## Load logger for this file
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)
from .mylog import mylog
from . import git_utils

import os

def update_provenance_data(from_date,to_date):
    commits=git_utils.get_commits_list(from_date,to_date)
    for c in commits:
        output_file = os.environ["PROVENANCEFILESDIR"]+'/output/'+c["id"]+'.ttl'
        if not os.path.exists(output_file):
            s = get_diff_ttl(c["id"])
            text_file = open(output_file, "w")
            text_file.write(s)
            text_file.close()

def get_missing_provenance_data():
    result = []
    all_commits = git_utils.get_commits_list()
    finished_commits = os.listdir(os.environ["PROVENANCEFILESDIR"]+'/output')
    for c in all_commits:
        if not c["id"]+".ttl" in finished_commits:
            result.append(c)
    return result

## The following functions calculate differences between two or more commits.

# first_list minus second_list
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
 
def get_diff_rdf(commit_id):
    c = git_utils.get_commit_data_for_commit_comparison(commit_id,os.environ["FUSEKI_TEST_SERVER"])
    result = []
    #TODO hier fehlt natürlich die krasse Logik bei mehreren Parents.
    if len(c) == 0:
        mylog("Commit {} is empty or was rejected.".format(commit_id))
    else:
        mylog("The commit has "+str(len(c))+" triples.")
        ps = git_utils.get_parent_commit_data_for_commit_comparison(commit_id,os.environ["FUSEKI_TEST_SERVER"])
        mylog("Received data from "+str(len(ps))+" parent commits, the triple counts are:")
        for p in ps:
            mylog(str(len(p)) + " triples")
        if len(ps) == 0:
            addes = c
            removes = []
        else:
            #removes are missing triples that have existed in all parents
            intersection = ps[0]
            for p in ps[1:]:
                intersection = intersect_sorted_lists(intersection,p)
            mylog("The intersection of parents has "+str(len(intersection))+" triples.")
            removes = substract_sorted_lists(intersection,c)
            mylog("The removals/number of triples that were in the intersection of parents but not in the child commit is "+str(len(removes)))
            #addes are new triples that have not existed in any parent
            addes = c
            for p in ps:
                addes = substract_sorted_lists(addes,p)
            mylog("The additions/number of triples that were not in the intersection of parents but are in the child commit is "+str(len(removes)))
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
        start_date = datetime.strptime("2016-01-01T00:00:00Z", "%Y-%m-%dT%H:%M:%S%z")
        for parent in commit["parents"]:
            parent_commit = git_utils.get_commit_details(parent)
            if not parent_commit:
                logger.debug("Parent commit not available for '%s'", commit["id"])
                continue
            temp_date = datetime.strptime(parent_commit["date"], "%Y-%m-%dT%H:%M:%S%z")
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
        sd=re.sub("UTC","",start_date.strftime("%Y-%m-%dT%H:%M:%S%Z")),
        cd=commit["date"],
        cm=commit["message"].replace("'","\\'"),
        ## Substitute an empty parent list with some text
        cp=", ".join([":commit_{}".format(parent_commit_id) for parent_commit_id in commit["parents"]] if len(commit["parents"]) > 0 else ['"No parent(s)"']),
        cs=get_change_set_ttl(commit["id"])
    )
    return result

def get_diff_ttl(commit_id):
    commit = git_utils.get_commit_details(commit_id)
    return get_ttl_string([commit])

def get_diff_ttl_interval(date_from,date_to):
    commits_list = git_utils.get_commits_list(date_from,date_to)
    return get_ttl_string(commits_list)
