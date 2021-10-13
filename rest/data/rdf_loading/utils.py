import subprocess
import os

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