""" utils.py
provenance module related functions
"""

## Load logger for this file
import logging

logger = logging.getLogger(__name__)
from ..mylog import mylog
from ..queries import git_commits

import os

def update_provenance_data(from_date,to_date):
    commits=git_commits.get_commits_list(from_date,to_date)
    for c in commits:
        output_file = os.environ["PROVENANCEFILESDIR"]+'/output/'+c["id"]+'.ttl'
        if not os.path.exists(output_file):
            s = git_commits.get_diff_ttl(c["id"])
            text_file = open(output_file, "w")
            text_file.write(s)
            text_file.close()

def get_missing_provenance_data():
    result = []
    all_commits = git_commits.get_commits_list()
    finished_commits = os.listdir(os.environ["PROVENANCEFILESDIR"]+'/output')
    for c in all_commits:
        if not c["id"]+".ttl" in finished_commits:
            result.append(c)
    return result