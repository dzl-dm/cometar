import subprocess
import os
from rdf_loading import utils as rdf_load_utils

def apply_verification_tests():
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_verification/exec_tests.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    return [p.communicate()[0], p.returncode]

def rdf_verification_steps(commit_id):
    if os.path.exists("/update-hook-repository"):
        x = rdf_load_utils.load_into_fuseki("test", commit_id)
        response = x[0]
        if x[1] > 0:
            return [response, x[1]]
        x = apply_verification_tests()
        response += x[0]
        return [response, x[1]]
    else:
        return ["No repository for update checks available.", 0]