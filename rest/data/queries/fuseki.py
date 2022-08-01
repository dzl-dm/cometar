import requests
from ..rdf_loading import utils as rdf_load_utils
from ..mylog import mylog
import os
import logging
logger = logging.getLogger(__name__)

def get_whole_commit_data(commit_id):
    exit_code = rdf_load_utils.load_checkout_into_fuseki(commit_id=commit_id)
    if exit_code > 0:
        return None
    sparql_query="""PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
		SELECT DISTINCT ?subject ?predicate ?object WHERE {
		{
			?a ?predicate ?object .
            BIND(IF(isBlank(?a),"none",?a) AS ?subject) .
		}
	}
	ORDER BY ?subject ?predicate lang(?object) ?object"""
    url = os.environ['FUSEKI_TEST_SERVER']+'/query'
    mylog("Query data from "+url)
    headers = {'Accept-Charset': 'UTF-8'}
    r = requests.post(url, data={'query': sparql_query}, headers=headers)
    return r.json()

def get_search_data(pattern):    
    sparql_query='''PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX cs:		<http://purl.org/vocab/changeset/schema#>
PREFIX prov: 	<http://www.w3.org/ns/prov#>

SELECT ?element ?property ?value
WHERE {
  ?element rdf:type ?t .
  FILTER (?t IN (skos:Concept, skos:Collection)) .
  #FILTER EXISTS { ?root :topLevelNode [ skos:member* [ skos:narrower* [ rdf:hasPart? [ skos:narrower* ?element ] ] ] ] }
  {
    SELECT ?element ?property ?value
    WHERE {'''+'''
        ?element ?property ?value FILTER (regex(?value, '{pattern}', 'i'))'''.format(pattern=pattern)+'''
    }
  }
  UNION
  {
    SELECT ?element ("Old Code" as ?property) (?oldnotation as ?value)
    WHERE {
      ?element prov:wasDerivedFrom+ ?oldconcept .
      ?cs a cs:ChangeSet ;
        cs:removal [
          a rdf:Statement;
          rdf:subject ?oldconcept;
          rdf:predicate skos:notation;
          rdf:object ?oldnotation
        ] .'''+'''
      FILTER(regex(?oldnotation, '{pattern}', 'i'))'''.format(pattern=pattern)+'''
      FILTER NOT EXISTS { ?element skos:notation ?oldnotation }
    }
  }
}
ORDER BY ?element ?property'''
    url=os.environ["FUSEKI_TEST_SERVER"]+'/query'
    headers = {'Accept-Charset': 'UTF-8'}
    r = requests.post(url, data={'query': sparql_query}, headers=headers)
    return r.json()

def get_history_data(concept):
    sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX loinc: <http://loinc.org/owl#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov:   <http://www.w3.org/ns/prov#>
PREFIX cs:     <http://purl.org/vocab/changeset/schema#>
SELECT DISTINCT ?commit ?date ?addorremove ?subject ?predicate ?object 
WHERE {
    {
        ?commit prov:qualifiedUsage ?usage ;
            prov:endedAtTime ?date .
        ?usage a prov:Usage, cs:ChangeSet .
        ?usage ?addorremove ?statement .
        ?statement a rdf:Statement;
            rdf:subject ?subject;
            rdf:predicate ?predicate;
            rdf:object ?object .'''+'''
        FILTER (?subject = {concept} || ?object = {concept})'''.format(concept = concept)+'''
    }
}
ORDER BY DESC(?date) ?subject ?predicate DESC(?addorremove)
'''
    url = os.environ['FUSEKI_TEST_SERVER']+'/query'
    headers = {'Accept-Charset': 'UTF-8'}
    r = requests.post(url, data={'query': sparql_query}, headers=headers)
    return r.json()