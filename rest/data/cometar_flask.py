from flask import Flask, url_for, request
from flask_accept import accept
from markupsafe import escape
from pathlib import Path
from string import Template
import requests
import os
import urllib.parse
from rdf_provenance import utils as prov_utils
from rdf_loading import utils as rdf_load_utils
from rdf_verification import utils as rdf_verification_utils
app = Flask(__name__)

@app.route('/')
def index():
    return 'Index Page'

@app.route('/rdf_verification/<commit_id>')
@accept('text/html')
def rdf_verification(commit_id):
    result = rdf_verification_utils.rdf_verification_steps(commit_id)
    return "<html><body><p>Exitcode: "+str(result[1])+"</p><p>Message Log:<br/>"+result[0].replace("\n","<br/>")+"</p></body></html>"

@rdf_verification.support('application/json')
def rdf_verification_json(commit_id):
    result = rdf_verification_utils.rdf_verification_steps(commit_id)
    return {
        "rdf_verification_steps_response": result[0],
        "exitcode": result[1]
    }

@app.route('/fuseki_load_test')
def fuseki_load_test():
    result = rdf_load_utils.load_into_fuseki("test")
    response = "SUCCESS"
    if result[1] == 1:
        response = result[0]
    return {
        "load_into_fuseki_test_response": response,
        "exitcode": result[1]
    }
@app.route('/fuseki_load_live')
def fuseki_load_live():
    result = rdf_load_utils.load_into_fuseki("live")
    response = "SUCCESS"
    if result[1] == 1:
        response = result[0]
    return {
        "load_into_fuseki_live_response": response,
        "exitcode": result[1]
    }

@app.route('/update_provenance')
def update_provenance():
    result = prov_utils.update_provenance_data()
    if result[1] == 0:
        result2 = prov_utils.fuseki_load_provenance_data()
    else:
        return {
            "error": "update_provenance_data failed",
            "output": result[0]
        }
    if result2[1] == 1:
        return {
            "error": "fuseki_load_provenance_data failed",
            "output": result2[0]
        }
    return {
        "update_provenance": "SUCCESS",
        "exitcode": result2[1]
    }

@app.route('/fuseki_load_provenance')
def fuseki_load_provenance():
    result = prov_utils.fuseki_load_provenance_data()
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
