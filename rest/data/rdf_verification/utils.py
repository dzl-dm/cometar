import subprocess
import os
from ..rdf_loading import utils as rdf_load_utils
from ..mylog import mylog
import logging

logger = logging.getLogger(__name__)

def apply_verification_tests():
    mylog("Running verification tests.")
    p = subprocess.Popen([os.environ["COMETAR_PROD_DIR"]+"/rdf_verification/exec_tests.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    mylog(p.communicate()[0])
    return p.returncode

def rdf_verification_steps(commit_id):
    if os.path.exists("/update-hook-repository"):
        exit_code = rdf_load_utils.load_checkout_into_fuseki(commit_id=commit_id)
        if exit_code > 0:
            return exit_code
        exit_code = apply_verification_tests()
        return exit_code
    else:
        mylog("No repository for update checks available.")
        return 0