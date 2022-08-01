""" cometar_flask.py
The flask listener for CoMetaR's REST api
"""
print("Begin cometar_flask.py")

## Setup logging (before importing other modules)
import logging
import logging.config
import os
import yaml
from flask import Flask, request
from flask_accept import accept

from .rdf_provenance import utils as prov_utils
from .rdf_loading import utils as rdf_load_utils
from .rdf_verification import utils as rdf_verification_utils
from .queries import git_commits
from .html_templates import commits as html_commits
from .html_templates import console as html_console
from .html_templates import search as html_search
from .html_templates import history as html_history
from .html_templates import text_only as html_text
from .queries import fuseki as fuseki_query
from .mylog import mylog,reset_mylog,get_mylog

print("Basic imports done")
if not os.path.isdir("/var/log/cometar/"):
    os.mkdir("/var/log/cometar/")
print("Setting up logging, using config file: {}".format(os.getenv('LOG_CONF_PATH')))
with open(os.getenv('LOG_CONF_PATH'), "r") as f:  # type: ignore
    log_config = yaml.load(f, Loader=yaml.FullLoader)
logging.config.dictConfig(log_config)
## Load logger for this file
logger = logging.getLogger(__name__)
logger.debug("Logging loaded and configured")

app = Flask(__name__)

@app.route('/')
def index():
    return 'Index Page'

@app.route('/rdf_verification/<commit_id>')
@accept('text/html')
def rdf_verification(commit_id):
    reset_mylog()
    exit_code = rdf_verification_utils.rdf_verification_steps(commit_id)
    return html_text.get_html("Exitcode:"+str(exit_code)+"\n"+"\n".join(get_mylog()))

@rdf_verification.support('application/json')
def rdf_verification_json(commit_id):
    reset_mylog()
    exit_code = rdf_verification_utils.rdf_verification_steps(commit_id)
    return {
        "rdf_verification_steps_response": "\n".join(get_mylog()),
        "exitcode": exit_code
    }

@app.route('/fuseki_load_test')
def fuseki_load_test():
    reset_mylog()
    exit_code = rdf_load_utils.load_checkout_into_fuseki()
    return {
        "load_into_fuseki_test_response": get_mylog(),
        "exitcode": exit_code
    }
@app.route('/fuseki_load_live')
def fuseki_load_live():
    exit_code = rdf_load_utils.load_checkout_into_fuseki(server = os.environ["FUSEKI_LIVE_SERVER"])
    return {
        "load_into_fuseki_test_response": get_mylog(),
        "exitcode": exit_code
    }

@app.route('/update_provenance')
def update_provenance():
    result = prov_utils.update_provenance_data()
    logger.debug("update provenance data; exit({}): {}".format(result[1], result[0]))
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
    logger.debug("load provenance data; exit({}): {}".format(result[1], result[0]))
    return {
        "fuseki_load_provenance (response)": result[0],
        "fuseki_load_provenance (exitcode)": result[1]
    }

@app.route('/query/console')
def get_console():
    return html_console.get_console_html()

@app.route('/query/commits')
def get_commits_options():
    return html_commits.get_commits_options()

@app.route('/query/commits/list')
def get_commits_list():
    date_from = request.args.get('date_from', default = '2016-01-01', type = str)
    date_to = request.args.get('date_to', default = '2050-01-01', type = str)
    git_log_list = git_commits.get_commits_list(date_from,date_to)
    git_log_html = html_commits.get_commits_list(git_log_list)
    return git_log_html

@app.route('/query/commits/diff_ttl')
def get_ttl_diff():
    reset_mylog()
    date_from = request.args.get('date_from', default = '2016-01-01', type = str)
    date_to = request.args.get('date_to', default = '2050-01-01', type = str)
    diff_ttl = git_commits.get_diff_ttl_interval(date_from,date_to)
    #TODO remove automatic loading
    rdf_load_utils.load_ttl_string_into_fuseki(s=diff_ttl)
    return html_commits.get_rdf_ttl_html(diff_ttl,"RDF ttl from "+date_from+" until "+date_to)

@app.route('/query/commits/diff_ttl/<commit_id>')
def query_ttl_diff(commit_id):
    diff = git_commits.get_diff_ttl(commit_id)
    return html_commits.get_text_diff_html(diff,"TTL diff for "+commit_id)

@app.route('/query/commits/diff_text/<commit_id>')
def query_text_diff(commit_id):
    diff = git_commits.get_diff_text(commit_id)
    return html_commits.get_text_diff_html(diff,"Text diff for "+commit_id)

@app.route('/query/commits/diff_rdf/<commit_id>')
def query_rdf_diff(commit_id):
    reset_mylog()
    diff_result = git_commits.get_diff_rdf(commit_id)
    return html_commits.get_rdf_diff_html(diff_result,"RDF diff for "+commit_id)

@app.route('/query/history')
def history():
    return html_history.get_history_html()

@app.route('/query/history/<concept>')
def history_concept(concept):
    history_data = fuseki_query.get_history_data(concept)
    return html_history.get_history_concept_html(history_data)

@app.route('/query/search')
def search():
    return html_search.get_search_html()

@app.route('/query/search/<pattern>')
def search_pattern(pattern):
    search_data = fuseki_query.get_search_data(pattern)
    return html_search.get_search_pattern_html(search_data,pattern)
