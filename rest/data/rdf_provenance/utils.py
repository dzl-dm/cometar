""" utils.py
provenance module related functions
"""

## Load logger for this file
import logging
logger = logging.getLogger(__name__)

import os
import subprocess

def get_last_provenance_date():
    prov_files_dir="/var/lib/cometar/provenance/output"
    filenames=os.listdir(prov_files_dir)
    if len(filenames) == 0:
        ## TOOD: Define this as a variable?
        return "2017-01-01 00:00:00"
    filenames.sort
    last_filename=filenames[-1]
    last_date=last_filename[22:41]
    return last_date

def update_provenance_data():
    """Call the shell scripts which search the git history and generate a file for the provenance module to read"""
    ## Get most recent date already captured and write the updates to a provenance data file
    logger.info("os.environ[COMETAR_PROD_DIR]: {}".format(os.environ["COMETAR_PROD_DIR"]))
    p = subprocess.Popen(["bash", os.environ["COMETAR_PROD_DIR"]+"/rdf_provenance/update_provenance.sh"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    # load_into_fuseki("live")
    # return [get_last_provenance_date(),1]
    return [p.communicate()[0], p.returncode]

def fuseki_load_provenance_data():
    """Call the shell scripts which push provenance data to fuseki live"""
    ## Get most recent date already captured and write the updates to a provenance data file
    logger.info("os.environ[COMETAR_PROD_DIR]: {}".format(os.environ["COMETAR_PROD_DIR"]))
    p = subprocess.Popen(["bash", os.environ["COMETAR_PROD_DIR"]+"/rdf_loading/add_files_to_dataset.sh", "-h"] ,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    # load_into_fuseki("live")
    return [p.communicate()[0], p.returncode]
