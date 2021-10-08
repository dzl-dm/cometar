from flask import Flask, url_for, request
from flask_accept import accept
from markupsafe import escape
from pathlib import Path
from string import Template
import requests
import subprocess
import os
import sys
import urllib.parse
app = Flask(__name__)

def git_checkout(commit_id):
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/git_scripts/git_checkout.sh", "-r", commit_id] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    return [p.communicate()[0], p.returncode]

def load_into_fuseki(server = "FUSEKI_TEST_SERVER", commit_id = "master"):
    if (server == "test"):
        server = os.environ["FUSEKI_TEST_SERVER"]
    if (server == "live"):
        server = os.environ["FUSEKI_LIVE_SERVER"]

    x = git_checkout(commit_id)
    response = x[0]
    if x[1] > 0:
        return [response, x[1]]
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_loading/fuseki_load.sh", "-s", server] , stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    x = [p.communicate()[0], p.returncode]
    response += x[0]
    return [response, x[1]]

def apply_verification_tests():
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_verification/exec_tests.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    return [p.communicate()[0], p.returncode]

def rdf_verification_steps(commit_id):
    if os.path.exists("/update-hook-repository"):
        x = load_into_fuseki("test", commit_id)
        response = x[0]
        if x[1] > 0:
            return [response, x[1]]
        x = apply_verification_tests()
        response += x[0]
        return [response, x[1]]
    else:
        return ["No repository for update checks available.", 0]

def update_provenance_data():
    """Call the shell scripts which search the git history and generate a file for the provenance module to read"""
    ## Get most recent date already captured and write the updates to a provenance data file
    print("os.environ[COMETAR_PROD_DIR]: {}".format(os.environ["COMETAR_PROD_DIR"]))
    p = subprocess.Popen(["bash", os.environ["COMETAR_PROD_DIR"]+"/rdf_provenance/update_provenance.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    # load_into_fuseki("live")
    return [p.communicate()[0], p.returncode]

def fuseki_load_provenance_data():
    """Call the shell scripts which push provenance data to fuseki live"""
    ## Get most recent date already captured and write the updates to a provenance data file
    print("os.environ[COMETAR_PROD_DIR]: {}".format(os.environ["COMETAR_PROD_DIR"]))
    p = subprocess.Popen(["bash", os.environ["COMETAR_PROD_DIR"]+"/rdf_loading/add_files_to_dataset.sh", "-h"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    # load_into_fuseki("live")
    return [p.communicate()[0], p.returncode]

@app.route('/')
def index():
    return 'Index Page'

@app.route('/rdf_verification/<commit_id>')
@accept('text/html')
def rdf_verification(commit_id):
    result = rdf_verification_steps(commit_id)
    return "<html><body><p>Exitcode: "+str(result[1])+"</p><p>Message Log:<br/>"+result[0].replace("\n","<br/>")+"</p></body></html>"

@rdf_verification.support('application/json')
def rdf_verification_json(commit_id):
    result = rdf_verification_steps(commit_id)
    return {
        "response": result[0],
        "exitcode": result[1]
    }

@app.route('/fuseki_load_test')
def fuseki_load_test():
    result = load_into_fuseki("test")
    return {
        "response": result[0],
        "exitcode": result[1]
    }
@app.route('/fuseki_load_live')
def fuseki_load_live():
    result = load_into_fuseki("live")
    return {
        # "fuseki_load_live (response)": result[0],
        "fuseki_load_live (exitcode)": result[1]
    }

@app.route('/update_provenance')
def update_provenance():
    result = update_provenance_data()
    if result[1] == 0:
        result2 = fuseki_load_provenance_data()
    return {
        # "update_provenance (response)": result[0],
        "update_provenance (exitcode)": result[1],
        # "fuseki_load_provenance (response)": result2[0],
        "fuseki_load_provenance (exitcode)": result2[1]
    }

@app.route('/fuseki_load_provenance')
def fuseki_load_provenance():
    result = fuseki_load_provenance_data()
    return {
        "fuseki_load_provenance (response)": result[0],
        "fuseki_load_provenance (exitcode)": result[1]
    }

@app.route('/query/search/<pattern>')
def search(pattern):
    url=os.environ["FUSEKI_TEST_SERVER"]+'/query'
    query = Path(os.environ["COMETAR_PROD_DIR"]+'/information_retrieval/search.sparql').read_text()
    query = Template(query)
    query = query.substitute(pattern=pattern)
    query = urllib.parse.quote(query)
    headers = {'Content': 'application/json'}
    r = requests.get(url+"?query="+query,headers=headers)
    return r.json()
