""" cometar_flask.py
The flask listener for CoMetaR's REST api
"""
print("Begin cometar_flask.py")

## Setup logging (before importing other modules)
from datetime import datetime
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
from .html_templates import provenance as html_provenance
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

@app.route('/query/commits/rdf_verification/<commit_id>')
@accept('text/html')
def rdf_verification(commit_id):
    reset_mylog()
    rdf_verification_utils.rdf_verification_steps(commit_id)
    return html_text.get_html("\n".join(get_mylog()))

@rdf_verification.support('application/json')
def rdf_verification_json(commit_id):
    reset_mylog()
    exit_code = rdf_verification_utils.rdf_verification_steps(commit_id)
    return {
        "rdf_verification_steps_response": "\n".join(get_mylog()),
        "exitcode": exit_code
    }

@app.route('/admin/load_latest_commit')
def fuseki_load_live():
    reset_mylog()
    rdf_load_utils.load_checkout_into_fuseki(server = os.environ["FUSEKI_LIVE_SERVER"])
    return html_text.get_html("\n".join(get_mylog()))

@app.route('/admin/load_provenance')
def admin_load_provenance():
    reset_mylog()
    rdf_load_utils.load_provenance_into_fuseki(server = os.environ["FUSEKI_LIVE_SERVER"])
    return html_text.get_html("\n".join(get_mylog()))

@app.route('/query/console')
def get_console():
    reset_mylog()
    return html_console.get_console_html()

@app.route('/admin/provenance')
def admin_provenance():
    reset_mylog()
    missing_commits = prov_utils.get_missing_provenance_data()
    return html_provenance.get_provenance_html(missing_commits,git_commits.get_commits_list())

@app.route('/admin/update_provenance')
def admin_update_provenance():
    reset_mylog()
    date_from = request.args.get('date_from', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    date_to = request.args.get('date_to', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    prov_utils.update_provenance_data(date_from,date_to)
    return html_text.get_html("\n".join(get_mylog()))

@app.route('/query/commits')
def get_commits_options():
    return html_commits.get_commits_options()

@app.route('/query/commits/list')
def get_commits_list():
    reset_mylog()
    date_from = request.args.get('date_from', default = '2016-01-01', type = str)
    date_to = request.args.get('date_to', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    git_log_list = git_commits.get_commits_list(date_from,date_to)
    git_log_html = html_commits.get_commits_list(git_log_list)
    return git_log_html

@app.route('/query/commits/diff_ttl/<commit_id>')
def query_ttl_diff(commit_id):
    reset_mylog()
    diff = git_commits.get_diff_ttl(commit_id)
    return html_commits.get_text_diff_html(diff,"TTL diff for "+commit_id)

@app.route('/query/commits/diff_text/<commit_id>')
def query_text_diff(commit_id):
    reset_mylog()
    diff = git_commits.get_diff_text(commit_id)
    return html_commits.get_text_diff_html(diff,"Text diff for "+commit_id)

@app.route('/query/commits/diff_rdf/<commit_id>')
def query_rdf_diff(commit_id):
    reset_mylog()
    diff_result = git_commits.get_diff_rdf(commit_id)
    return html_commits.get_rdf_diff_html(diff_result,"RDF diff for "+commit_id)

@app.route('/query/history')
def history():
    reset_mylog()
    return html_history.get_history_html()

@app.route('/query/history/concept')
def history_concept():
    reset_mylog()
    iri=request.args.get('iri', default = "", type = str)
    history_data = fuseki_query.get_history_data(iri)
    return html_history.get_history_concept_html(history_data)

@app.route('/query/search')
def search():
    reset_mylog()
    return html_search.get_search_html()

@app.route('/query/search/<pattern>')
def search_pattern(pattern):
    reset_mylog()
    search_data = fuseki_query.get_search_data(pattern)
    return html_search.get_search_pattern_html(search_data,pattern)
