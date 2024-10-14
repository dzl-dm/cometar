""" cometar_flask.py
The flask listener for CoMetaR's REST api
"""
print("Begin cometar_flask.py")

## Setup logging (before importing other modules)
from datetime import datetime
import logging
import logging.config
import os
from matplotlib.font_manager import json_load
import yaml
from flask import Flask, jsonify, request, send_file, url_for
from flask_accept import accept

from . import rdf_provenance
from . import rdf_loading
from . import plotting
from . import ontology
from .rdf_verification import utils as rdf_verification_utils
from . import git_utils
from .html_templates import commits as html_commits
from .html_templates import console as html_console
from .html_templates import search as html_search
from .html_templates import history as html_history
from .html_templates import text_only as html_text
from .html_templates import provenance as html_provenance
from .html_templates import concepts as html_concepts
from . import fuseki_query_adapter as query_adapter
from . import fuseki_queries
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
logger.debug("'app' created as Flask(__name__)")

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
    rdf_loading.load_checkout_into_fuseki(server = os.environ["FUSEKI_LIVE_SERVER"])
    return html_text.get_html("\n".join(get_mylog()))

@app.route('/admin/load_provenance')
def admin_load_provenance():
    reset_mylog()
    rdf_loading.load_provenance_into_fuseki(server = os.environ["FUSEKI_LIVE_SERVER"])
    return html_text.get_html("\n".join(get_mylog()))

@app.route('/query/console')
def get_console():
    reset_mylog()
    return html_console.get_console_html()

@app.route('/admin/provenance')
def admin_provenance():
    reset_mylog()
    missing_commits = rdf_provenance.get_missing_provenance_data()
    return html_provenance.get_provenance_html(missing_commits,git_utils.get_commits_list())

@app.route('/admin/update_provenance')
def admin_update_provenance():
    reset_mylog()
    date_from = request.args.get('date_from', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    date_to = request.args.get('date_to', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    rdf_provenance.update_provenance_data(date_from,date_to)
    return html_text.get_html("\n".join(get_mylog())+"\n")

@app.route('/query/commits')
def get_commits_options():
    return html_commits.get_commits_options()

@app.route('/query/commits/list')
def get_commits_list():
    reset_mylog()
    date_from = request.args.get('date_from', default = '2016-01-01', type = str)
    date_to = request.args.get('date_to', default = datetime.now().strftime("%Y-%m-%d"), type = str)
    git_log_list = git_utils.get_commits_list(date_from,date_to)
    git_log_html = html_commits.get_commits_list(git_log_list)
    return git_log_html

@app.route('/query/commits/diff_ttl/<commit_id>')
def query_ttl_diff(commit_id):
    reset_mylog()
    diff = rdf_provenance.get_diff_ttl(commit_id)
    return html_commits.get_text_diff_html(diff,"TTL diff for "+commit_id)

@app.route('/query/commits/diff_text/<commit_id>')
def query_text_diff(commit_id):
    reset_mylog()
    diff = git_utils.get_diff_text(commit_id)
    return html_commits.get_text_diff_html(diff,"Text diff for "+commit_id)

@app.route('/query/commits/diff_rdf/<commit_id>')
def query_rdf_diff(commit_id):
    reset_mylog()
    diff_result = rdf_provenance.get_diff_rdf(commit_id)
    return html_commits.get_rdf_diff_html(diff_result,"RDF diff for "+commit_id)

@app.route('/query/history')
def history():
    reset_mylog()
    return html_history.get_history_html()

@app.route('/query/history/concept')
def history_concept():
    reset_mylog()
    iri=request.args.get('iri', default = "", type = str)
    history_data = fuseki_queries.get_history_data(iri).json()
    return html_history.get_history_concept_html(history_data)

@app.route('/query/history/details')
def history_details():
    reset_mylog()
    iri=request.args.get('iri', default = None, type = str)
    from_date:datetime=datetime(2022,7,1)
    fromd=request.args.get('from_date', default = None, type = str)
    until_date:datetime=datetime.now()
    untild=request.args.get('until_date', default = None, type = str)
    if fromd:
        from_date=datetime.strptime(fromd,'%Y-%m-%d')
    if untild:
        until_date=datetime.strptime(untild,'%Y-%m-%d')
    provenance_commits = query_adapter.get_provenance_commits(from_date,until_date)
    ontology_changes = ontology.OntologyChanges(provenance_commits).by_date("month").condense()
    attributes_definitions = query_adapter.get_attribute_definitions()
    return html_history.get_history_by_date_html(ontology_changes,attributes_definitions)

@app.route('/query/search')
def search():
    reset_mylog()
    return html_search.get_search_html()

@app.route('/query/search/<pattern>')
def search_pattern(pattern):
    reset_mylog()
    search_data = fuseki_queries.get_search_data(pattern).json()
    return html_search.get_search_pattern_html(search_data,pattern)

@app.route('/query/concepts')
def query_concepts():
    reset_mylog()
    #return [x.toJson() for x in fuseki_query.get_provenance()]
    return html_concepts.get_concepts_html()

@app.route('/query/concepts/listing')
def query_concepts_listing():
    reset_mylog()
    iri=request.args.get('iri', default = "", type = str)
    if iri == "":
        iris = []
    else:
        iris=iri.split(",")
    format=request.args.get('format', default = "tree", type = str)
    include_children=request.args.get('include_children', default = format=="tree", type = str)
    attributes_definitions = query_adapter.get_attribute_definitions()
    rdfPredicates, attributes_used = query_adapter.get_concept_details(iris,include_children=="true")
    concept_list=ontology.ConceptList([],[])
    if format == "tree":
        concept_list = ontology.get_concept_tree(
            iris=iris,
            rdfPredicates=rdfPredicates,
            attributes_definitions=attributes_definitions,
            attributes_used=attributes_used
        )
    elif format == "list":
        concept_list = ontology.get_concept_list(
            rdfPredicates=rdfPredicates,
            attributes_definitions=attributes_definitions,
            attributes_used=attributes_used
        )
    return html_concepts.get_thesaurus_html(concept_list)

# @app.route('/query/progress')
# def get_progress(pattern):
#     return send_file(filename, mimetype='image/gif')

@app.route('/query/progress/metadata')
@accept('application/json')
def get_metadata_progress():
    return jsonify({"test":"jo"})

@get_metadata_progress.support('text/html')
def get_metadata_progress_html():
    response = "<html><body>"
    #response += str(fuseki_query.get_metadata_progress())
    response += "<img style='width:500px;border:1px solid #333' src='/rest/query/progress/metadata/total_annotations/figure'/>"
    response += "<img style='width:500px;border:1px solid #333' src='/rest/query/progress/metadata/total_concepts/figure'/>"
    response += "<img style='width:500px;border:1px solid #333' src='/rest/query/progress/metadata/changes/figure'/>"
    response += "<img style='width:1000px;border:1px solid #333' src='/rest/query/progress/metadata/distribution/figure'/>"
    response += "</body></html>"
    return response

@app.route('/query/progress/metadata/changes/figure')
def get_metadata_progress_changes_figure():
    return send_file(plotting.get_progress_metadata_changes_figure(True), mimetype='image/jpg')

@app.route('/query/progress/metadata/total_annotations/figure')
def get_metadata_progress_total_annotations_figure():
    return send_file(plotting.get_progress_metadata_total_annotations_figure(True), mimetype='image/jpg')

@app.route('/query/progress/metadata/total_concepts/figure')
def get_metadata_progress_total_concepts_figure():
    return send_file(plotting.get_progress_metadata_total_concepts_figure(True), mimetype='image/jpg')

@app.route('/query/progress/metadata/distribution/figure')
def get_metadata_progress_distribution_figure():
    return send_file(plotting.get_metadata_distribution_figure(True), mimetype='image/jpg')

logger.debug("cometar_flask.py bottom")
