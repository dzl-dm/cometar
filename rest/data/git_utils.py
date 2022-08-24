from datetime import datetime
import os
import json
import re
from . import fuseki_queries as fuseki_query
import git
import logging
from .mylog import mylog, get_mylog
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

