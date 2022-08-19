from datetime import datetime
import os
import json
import re
from typing import Any, List, TypedDict
from ..rdf_loading import utils as rdf_load_utils
from ..queries import fuseki as fuseki_query
import git
import logging
from ..mylog import mylog, get_mylog
logger = logging.getLogger(__name__)
repo_dir = os.environ["COMETAR_TEMP_DIR"]+"/checkout"

def reset_repo():
    if os.path.exists(repo_dir):
        logger.debug(repo_dir + " exists, removing it.")
        os.system("rm -rf "+repo_dir)
    logger.debug("Cloning")
    git.Repo.clone_from('/update-hook-repository', repo_dir)  # type: ignore

def git_checkout(commit_id):
    reset_repo()
    g = git.cmd.Git(repo_dir)  # type: ignore
    g.checkout(commit_id)

def get_commit_details(commit_id):
    result={}
    g = git.cmd.Git(repo_dir)  # type: ignore
    g.checkout('master')
    git_log_string = g.log('-n 1','--pretty=format:%H::::%aN::::%aE::::%aI::::%s::::%P',commit_id)
    if not git_log_string=='':
        for line in git_log_string.split('\n'):
            items = line.split('::::')
            result.update({"id":items[0],"author":items[1],"author_mail":items[2],"date":items[3],"message":json.dumps(items[4])[1:-1],"parents":items[5].split(" ")})
    return result


def get_commits_list(date_from="2016-01-01",date_to=datetime.now().strftime("%Y-%m-%d")):
    g = git.cmd.Git(repo_dir)  # type: ignore
    g.checkout('master')
    result = []
    git_log_string = g.log('--since="'+date_from+' 00:00:00"','--until="'+date_to+'"',
         '--pretty=format:%H::::%aN::::%aE::::%aI::::%s::::%P')
    if not git_log_string=='':
        for line in git_log_string.split('\n'):
            items = line.split('::::')
            result.append({"id":items[0],"author":items[1],"author_mail":items[2],"date":items[3],"message":json.dumps(items[4])[1:-1],"parents":items[5].split(" ")})
    return result

def get_parent_commits(commit_id):
    g = git.cmd.Git(repo_dir)  # type: ignore
    git_log_string = g.log('-n 1','--pretty=format:%P',commit_id)
    git_log_list = git_log_string.split(" ")
    mylog("Parents of "+commit_id+" are :"+", ".join(git_log_list))
    if len(git_log_list) == 1 and git_log_list[0]=='':
        return []
    return git_log_list

## Get all triples defined in the commit
def get_commit_data(commit_id):
    mylog("Getting commit data for "+commit_id)
    r = fuseki_query.get_whole_commit_data(commit_id)
    if r == None:
        return []
    data=r["results"]["bindings"]
    return data

def get_parent_commit_data(commit_id):
    mylog("Getting parent commit data for "+commit_id)
    ps = []
    for parent in get_parent_commits(commit_id):
        p = get_commit_data(parent)
        if len(p) > 0:
            ps.append(p)
        else:
            mylog("Data for "+parent+" is empty, so it is probably an invalid commit; continue with next parents.")
            ps += get_parent_commit_data(parent)
    return ps

def substract_sorted_lists(first_list,second_list):
    result = []
    row_index = 0
    for r_1 in first_list:
        match = False
        pointer_moved = False
        for pointer in range(row_index,len(second_list)):
            r_2 = second_list[pointer]
            if r_1["subject"]["value"] > r_2["subject"]["value"]:
                continue
            if pointer_moved == False:
                row_index = pointer
                pointer_moved = True
            if r_1["subject"]["value"] < r_2["subject"]["value"]:
                break
            if str(r_1) == str(r_2):
                match = True
                break
        if match == False:
            result.append(r_1)
    return result
#same as substract, but append the matching lines instead of the not-matching
def intersect_sorted_lists(first_list,second_list):
    result = []
    row_index = 0
    for r_1 in first_list:
        match = False
        pointer_moved = False
        for pointer in range(row_index,len(second_list)):
            r_2 = second_list[pointer]
            if r_1["subject"]["value"] > r_2["subject"]["value"]:
                continue
            if pointer_moved == False:
                row_index = pointer
                pointer_moved = True
            if r_1["subject"]["value"] < r_2["subject"]["value"]:
                break
            if str(r_1) == str(r_2):
                match = True
                break
        if match == True:
            result.append(r_1)
    return result
                
def get_diff_text(commit_id):
    g = git.cmd.Git(repo_dir)  # type: ignore
    diff_string = g.show('--word-diff=plain','-U10', commit_id)
    return diff_string

def get_diff_rdf(commit_id):
    c = get_commit_data(commit_id)
    result = []
    #TODO hier fehlt natürlich die krasse Logik bei mehreren Parents.
    if len(c) == 0:
        mylog("Commit is empty or was rejected.")
    else:
        ps = get_parent_commit_data(commit_id)
        if len(ps) == 0:
            addes = c
            removes = []
        else:
            #removes are missing triples that have existed in all parents
            intersection = ps[0]
            for p in ps[1:]:
                intersection = intersect_sorted_lists(intersection,p)
            removes = substract_sorted_lists(intersection,c)
            #addes are new triples that have not existed in any parent
            addes = c
            for p in ps:
                addes = substract_sorted_lists(addes,p)
            mylog("The commit has "+str(len(c))+" triples, the intersection of parents has "+str(len(intersection))+" triples.")
        for row in removes:
            row.update({"add_or_remove":{"value":"removed", "type":"decision"}})
        for row in addes:
            row.update({"add_or_remove":{"value":"added", "type":"decision"}})
        result = removes+addes
        result = sorted(result, key=lambda m: (m["subject"]["value"],m["predicate"]["value"],m["object"]["xml:lang"] if "xml:lang" in m["object"].keys() else "",m["add_or_remove"]["value"]=="added"))
    return result

def get_change_set_ttl(commit_id):
    result = ""
    dr = get_diff_rdf(commit_id)
    for row in dr:
        add_or_remove="removal" if row["add_or_remove"]["value"] == 'removed' else "addition"
        subject="<"+row["subject"]["value"]+">" if row["subject"]["type"] == "uri" else "'''"+row["subject"]["value"]+"'''"
        predicate="<"+row["predicate"]["value"]+">" if row["predicate"]["type"] == "uri" else "'''"+row["predicate"]["value"]+"'''"
        if row["object"]["type"] == "uri":
            object = "<"+row["object"]["value"]+">"
        else:
            o_val = row["object"]["value"]
            o_val=o_val.replace("'","\\'")
            object = "'''"+o_val+"'''"
            if "xml:lang" in row["object"].keys():
                object += "@"+row["object"]["xml:lang"]
          
        result += '''
        cs:{add_or_remove} [
            a rdf:Statement ;
            rdf:subject {subject} ;
            rdf:predicate {predicate} ;
            rdf:object {object}
        ];'''.format(
                add_or_remove=add_or_remove,
                subject=subject,
                predicate=predicate,
                object=object
            )
    return result

def get_ttl_string(commits_list):
    result = '''
@prefix skos:   <http://www.w3.org/2004/02/skos/core#> .
@prefix snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/> .
@prefix : <http://data.dzl.de/ont/dwh#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .
@prefix dc: <http://purl.org/dc/elements/1.1/> .
@prefix dwh:    <http://sekmi.de/histream/dwh#> .
@prefix loinc: <http://loinc.org/owl#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix prov:   <http://www.w3.org/ns/prov#> .
@prefix cs:     <http://purl.org/vocab/changeset/schema#> .

:ontology a prov:Entity .
    '''
    for commit in commits_list:
        start_date = datetime.strptime("2016-01-01", "%Y-%m-%d")
        for parent in commit["parents"]:
            parent_commit = get_commit_details(parent)
            temp_date = datetime.strptime(parent_commit["date"][:19], "%Y-%m-%dT%H:%M:%S")
            if temp_date > start_date:
                start_date = temp_date
        result += '''
:{anf}
    a prov:Agent, foaf:Person ;
    rdfs:label "{an}" ;
    foaf:mbox "{ae}" ;
.

:commit_{commit_id}
    a prov:Activity ;
    prov:wasAssociatedWith :{anf} ;
    prov:startedAtTime "{sd}"^^xsd:dateTime ;
    prov:endedAtTime "{cd}"^^xsd:dateTime ;
    prov:label \'\'\'{cm}\'\'\' ;
    prov:wasInfluencedBy {cp} ;        
    prov:qualifiedUsage [
        a prov:Usage, cs:ChangeSet ;
        {cs}
    ]
.
'''.format(
        an=commit["author"],
        anf="Author_"+re.sub(
           r"[\u0080-\uFFFF :]", 
           "_", 
           commit["author"]
       ),
        ae=commit["author_mail"],
        commit_id=commit["id"],
        sd=start_date.strftime("%Y-%m-%dT%H:%M:%S"),
        cd=commit["date"][:10]+"T"+commit["date"][11:19],
        cm=commit["message"].replace("'","\\'"),
        cp=", ".join(list(map(lambda x: ":commit_"+x, commit["parents"]))),
        cs=get_change_set_ttl(commit["id"])
    )
    return result

def get_diff_ttl(commit_id):
    commit = get_commit_details(commit_id)
    return get_ttl_string([commit])

def get_diff_ttl_interval(date_from,date_to):
    commits_list = get_commits_list(date_from,date_to)
    return get_ttl_string(commits_list)
    
