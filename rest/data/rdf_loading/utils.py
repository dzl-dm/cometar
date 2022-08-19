import os
import logging
import requests
import re
from ..queries import git_commits
from ..mylog import mylog
logger = logging.getLogger(__name__)


def load_checkout_into_fuseki(server = os.environ["FUSEKI_TEST_SERVER"], commit_id = "master"):
    mylog("Loading data for commit "+commit_id+" to "+server+" server.")
    try:
        git_commits.git_checkout(commit_id)
    except:
        mylog("Error during checkout of "+commit_id)
        return 1    
    #clear triple store
    mylog("Clearing triple store.")
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.put(server+"/data", data="", headers=headers)
    if not (200 <= r.status_code <300):
        mylog("Error clearing data: "+r.text)
        return 1
    #load files
    checkout_dir = os.environ['COMETAR_TEMP_DIR']+"/checkout"
    for file in os.listdir(checkout_dir):
        if file.endswith(".ttl"):
            mylog("Loading file "+file+".")
            try:
                data = open(checkout_dir+"/"+file).read()
            except:
                mylog("Bad data encoding.")
                return 1
            headers = {'Content-Type': 'text/turtle;charset=utf-8'}
            r = requests.post(server+"/data", data=data.encode('utf-8'), headers=headers)
            if not (200 <= r.status_code <300):
                mylog("Error loading "+file+": "+r.text)
                get_line_re = re.compile(r".*\[line: ([^,]+), col: [^\]]+\].*")
                line_number = int(re.sub(get_line_re, r'\1',r.text))
                with open(checkout_dir+"/"+file) as errordata:
                    reader=errordata.readlines()
                    rows = list(reader)
                    mylog("Context:")
                    for index in range(max(line_number-10,0),min(line_number+11,len(rows)-1)):
                        mylog("Line "+str(index+1)+": "+rows[index][:-1])
                return 1
    #insert rules
    logger.debug("Inserting rules.")
    rules_file = '/config/insertrules.ttl'
    data = open(rules_file).read()
    headers = {'Content-Type': 'application/sparql-update;charset=utf-8'}
    r = requests.post(server+"/update", data=data.encode('utf-8'), headers=headers)
    if not (200 <= r.status_code <300):
        mylog("Error inserting rules: "+r.text)
        return 1
    return 0

def load_provenance_into_fuseki(server = os.environ["FUSEKI_TEST_SERVER"]):
    mylog("Loading provenance data to "+server+" server.")
    #load files
    checkout_dir = os.environ['PROVENANCEFILESDIR']+"/output"
    for file in os.listdir(checkout_dir):
        if file.endswith(".ttl"):
            mylog("Loading file "+file+".")
            try:
                data = open(checkout_dir+"/"+file).read()
            except:
                mylog("Bad data encoding.")
                return 1
            headers = {'Content-Type': 'text/turtle;charset=utf-8'}
            r = requests.post(server+"/data", data=data.encode('utf-8'), headers=headers)
            if not (200 <= r.status_code <300):
                mylog("Error loading "+file+": "+r.text)
                get_line_re = re.compile(r".*\[line: ([^,]+), col: [^ ]+ \].*")
                line_number = int(re.sub(get_line_re, r'\1',r.text))
                with open(checkout_dir+"/"+file) as errordata:
                    reader=errordata.readlines()
                    rows = list(reader)
                    mylog("Context:")
                    for index in range(max(line_number-10,0),min(line_number+11,len(rows)-1)):
                        mylog("Line "+str(index+1)+": "+rows[index][:-1])
                return 1
    #insert rules
    # mylog("Inserting rules.")
    # rules_file = '/config/provenance_derivations.ttl'
    # data = open(rules_file).read()
    # headers = {'Content-Type': 'application/sparql-update;charset=utf-8'}
    # r = requests.post(server+"/update", data=data.encode('utf-8'), headers=headers)
    # if not (200 <= r.status_code <300):
    #     mylog("Error inserting rules: "+r.text)
    #     return 1
    return 0

def load_ttl_string_into_fuseki(server=os.environ["FUSEKI_TEST_SERVER"],s=""):
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post(server+"/data", data=s.encode('utf-8'), headers=headers)
    logger.debug(str(r))
    if not (200 <= r.status_code <300):
        logger.debug("Error inserting data: "+r.text)
