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

def get_history_data(iri):
	sparql_query='''
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov:   <http://www.w3.org/ns/prov#>
PREFIX cs:     <http://purl.org/vocab/changeset/schema#>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>
#SELECT DISTINCT (GROUP_CONCAT(?commit;SEPARATOR=",") AS ?commits) ?day ?subject ?predicate ?oldobject ?newobject
#SELECT DISTINCT ?commits ?day ?subject ?predicate ?lang (GROUP_CONCAT(DISTINCT ?oldobject;SEPARATOR=", ") AS ?oldobjects) (GROUP_CONCAT(DISTINCT ?newobject;SEPARATOR=", ") AS ?newobjects)
SELECT DISTINCT ?commits ?day ?subject ?predicate ?lang ?oldobject ?newobject
WHERE {
  {
    {
      # All days on which predicates were changed
      SELECT DISTINCT (GROUP_CONCAT(?commit;SEPARATOR=",") AS ?commits) ?day ?predicate ?lang
      WHERE {
        <'''+iri+'''> prov:wasDerivedFrom* ?subject .
        ?commit prov:qualifiedUsage ?usage ;
          prov:endedAtTime ?date .
        ?usage ?addorremove ?statement FILTER (?addorremove IN (cs:addition,cs:removal)) .
        ?statement a rdf:Statement ;
          rdf:subject ?subject ;
          rdf:predicate ?predicate ;
          rdf:object ?object .
        BIND (xsd:date(concat(str(year(?date)),"-",
                       str(month(?date)),"-",
                       str(day(?date))))
        as ?day)
        BIND (lang(?object) as ?lang)
      }
      GROUP BY ?day ?predicate ?lang
    }

    OPTIONAL {
      <'''+iri+'''> prov:wasDerivedFrom* ?subject_1 .
      ?commit_1 prov:qualifiedUsage [
          cs:removal [
            a rdf:Statement ;
            rdf:subject ?subject_1 ;
            rdf:predicate ?predicate ;
            rdf:object ?oldobject 
          ]
        ] ;
        prov:endedAtTime ?date_1 .
      FILTER (xsd:date(concat(str(year(?date_1)),"-",
                        str(month(?date_1)),"-",
                        str(day(?date_1)))) = ?day)
      FILTER (!bound(?lang) || lang(?oldobject) = ?lang)
      # check if object has not been added this day (before or after removal)
      FILTER NOT EXISTS {
        <'''+iri+'''> prov:wasDerivedFrom* ?subject_22 .
        ?commit_22 prov:qualifiedUsage [
            cs:addition [
              a rdf:Statement ;
              rdf:subject ?subject_22 ;
              rdf:predicate ?predicate ;
              rdf:object ?oldobject
            ]
          ] ;
          prov:endedAtTime ?date_22 .
        FILTER (xsd:date(concat(str(year(?date_22)),"-",
                        str(month(?date_22)),"-",
                        str(day(?date_22)))) = ?day)
        FILTER (!bound(?lang) || lang(?oldobject) = ?lang)
      }
    }

    OPTIONAL {
      <'''+iri+'''> prov:wasDerivedFrom* ?subject_2 .
      ?commit_2 prov:qualifiedUsage [
          cs:addition [
            a rdf:Statement ;
            rdf:subject ?subject_2 ;
            rdf:predicate ?predicate ;
            rdf:object ?newobject 
          ]
        ] ;
        prov:endedAtTime ?date_2 .
      FILTER (xsd:date(concat(str(year(?date_2)),"-",
                        str(month(?date_2)),"-",
                        str(day(?date_2)))) = ?day)
      FILTER (!bound(?lang) || lang(?newobject) = ?lang)
      # check if object has not been removed this day (before or after addition)
      FILTER NOT EXISTS {
        <'''+iri+'''> prov:wasDerivedFrom* ?subject_11 .
        ?commit_11 prov:qualifiedUsage [
            cs:removal [
              a rdf:Statement ;
              rdf:subject ?subject_11 ;
              rdf:predicate ?predicate ;
              rdf:object ?newobject
            ]
          ] ;
          prov:endedAtTime ?date_11 .
        FILTER (xsd:date(concat(str(year(?date_11)),"-",
                        str(month(?date_11)),"-",
                        str(day(?date_11)))) = ?day)
        FILTER (!bound(?lang) || lang(?newobject) = ?lang)
      }
    }

    FILTER ((bound(?oldobject) || bound(?newobject)) && (!bound(?oldobject) || !bound(?newobject) || ?oldobject != ?newobject))
  }
}
#GROUP BY ?commits ?day ?subject ?predicate ?lang
#HAVING ((bound(?oldobjects) || bound(?newobjects)) && (!bound(?oldobjects) || !bound(?newobjects) || ?oldobjects != ?newobjects))
ORDER BY DESC(?day) ?subject ?predicate
'''
	url = os.environ['FUSEKI_LIVE_SERVER']+'/query'
	headers = {'Accept-Charset': 'UTF-8'}
	r = requests.post(url, data={'query': sparql_query}, headers=headers)
	return r.json()