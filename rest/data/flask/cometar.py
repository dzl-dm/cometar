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

def load_into_fuseki():
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_loading/fuseki_load.sh", "-s", os.environ["FUSEKI_TEST_SERVER"]] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    return [p.communicate()[0], p.returncode]

def apply_verification_tests():
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_verification/exec_tests.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    return [p.communicate()[0], p.returncode]

def rdf_verification_steps(commit_id):
    if os.path.exists("/update-hook-repository"):
        x = git_checkout(commit_id)
        response = x[0]
        if x[1] > 0:
            return [response, x[1]]
        x = load_into_fuseki()
        response += x[0]
        if x[1] > 0:
            return [response, x[1]]
        x = apply_verification_tests()
        response += x[0]
        return [response, x[1]]
    else:
        return ["No repository for update checks available.", 0]

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

@app.route('/fuseki_load')
def fuseki_load():
    return load_into_fuseki()

@app.route('/search/<pattern>')
def search(pattern):
    url=os.environ["FUSEKI_TEST_SERVER"]+'/query'
    query = Path(os.environ["COMETAR_PROD_DIR"]+'/information_retrieval/search.sparql').read_text()
    query = Template(query)
    query = query.substitute(pattern=pattern)
    query = urllib.parse.quote(query)
    headers = {'Content': 'application/json'}
    r = requests.get(url+"?query="+query,headers=headers)
    return r.json()
