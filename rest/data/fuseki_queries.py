from typing import Dict
import requests
from . import rdf_loading
from . import ontology
from .mylog import mylog


import os
import logging
logger = logging.getLogger(__name__)

def get_whole_commit_data(commit_id):
    exit_code = rdf_loading.load_checkout_into_fuseki(commit_id=commit_id)
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
    sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
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
    url=os.environ["FUSEKI_LIVE_SERVER"]+'/query'
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

def get_progress_metadata_concepts():
  sparql_query='''
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov:   <http://www.w3.org/ns/prov#>
PREFIX cs:     <http://purl.org/vocab/changeset/schema#>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
SELECT ?date (COUNT(DISTINCT ?add) as ?additions) (COUNT(DISTINCT ?rem) as ?removals)
WHERE { 
  {
    SELECT ?usage ?date
    WHERE {
      ?commit prov:qualifiedUsage ?usage ;
        prov:endedAtTime ?d .
      BIND (
          CONCAT(STR(YEAR(?d)), 
          "-", 
          STR(MONTH(?d))
          # , 
          # "-", 
          # STR(DAY(?d))
        ) as ?date)
    }
  }
  OPTIONAL { 
    ?usage cs:addition ?add FILTER NOT EXISTS { ?add rdf:comment "hidden" } . 
    ?add rdf:object skos:Concept .
  }
  OPTIONAL { 
    ?usage cs:removal ?rem FILTER NOT EXISTS { ?rem rdf:comment "hidden" }  . 
    ?rem rdf:object skos:Concept .
  }
}
group by ?date ?total
order by ?date
'''
  url = os.environ['FUSEKI_LIVE_SERVER']+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  number_of_concepts = []
  dates = []
  for row in r.json()["results"]["bindings"]:
    addition = int(row["additions"]["value"])
    removal = int(row["removals"]["value"])
    diff=(number_of_concepts[-1] if len(number_of_concepts) > 0 else 0)+addition-removal
    dates.append(row["date"]["value"])
    number_of_concepts.append(diff)
  return {"dates":dates,"number_of_concepts":number_of_concepts}

def get_progress_metadata_attributes():
  sparql_query='''
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov:   <http://www.w3.org/ns/prov#>
PREFIX cs:     <http://purl.org/vocab/changeset/schema#>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>
PREFIX : <http://data.dzl.de/ont/dwh#>
SELECT (?datea as ?date) (?additionsx - ?changes as ?additions) (?removalsx - ?changes as ?removals) ?changes
WHERE { 
	{
		SELECT ?datear (COUNT(DISTINCT ?add_change) as ?changes) 
		WHERE {
			?commitar prov:qualifiedUsage ?usagear ;
			  prov:endedAtTime ?dar .
			BIND (CONCAT(STR(YEAR(?dar)), "-",  STR(MONTH(?dar))) as ?datear)
      ?usagear cs:addition ?add_change FILTER NOT EXISTS { ?add_change rdf:comment "hidden" } . 
      ?add_change rdf:subject ?subjectar ; rdf:predicate ?predicatear; rdf:object ?objectar1 .
      ?usagear cs:removal ?rem_change FILTER NOT EXISTS { ?rem_change rdf:comment "hidden" }  . 
      ?rem_change rdf:subject ?subjectar ; rdf:predicate ?predicatear; rdf:object ?objectar2 .
      FILTER (LANG(STR(?objectar1)) = LANG(STR(?objectar2)))
		}
    GROUP BY ?datear
	}
	{
		SELECT ?datea (COUNT(DISTINCT ?add) as ?additionsx) 
		WHERE {
			?commita prov:qualifiedUsage ?usagea ;
			  prov:endedAtTime ?da .
			BIND (CONCAT(STR(YEAR(?da)), "-",  STR(MONTH(?da))) as ?datea)
      ?usagea cs:addition ?add FILTER NOT EXISTS { ?add rdf:comment "hidden" } . 
    }
    GROUP BY ?datea
  }
	{
		SELECT ?dater (COUNT(DISTINCT ?rem) as ?removalsx) 
		WHERE {
			?commitr prov:qualifiedUsage ?usager ;
			  prov:endedAtTime ?dr .
			BIND (CONCAT(STR(YEAR(?dr)), "-",  STR(MONTH(?dr))) as ?dater)
      ?usager cs:removal ?rem FILTER NOT EXISTS { ?rem rdf:comment "hidden" }  . 
    }
    GROUP BY ?dater
  }
  FILTER (?datea = ?dater && ?datea = ?datear)
}
ORDER BY ?datea
'''
  url = os.environ['FUSEKI_LIVE_SERVER']+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  total_statements = []
  dates = []
  additions = []
  removals = []
  changes = []
  for row in r.json()["results"]["bindings"]:
    addition = int(row["additions"]["value"])
    removal = int(row["removals"]["value"])
    change = int(row["changes"]["value"])
    diff=(total_statements[-1] if len(total_statements) > 0 else 0)+addition-removal
    dates.append(row["date"]["value"])
    additions.append(addition)
    removals.append(removal)
    changes.append(change)
    total_statements.append(diff)

  return {"dates":dates,"additions":additions,"removals":removals,"changes":changes,"total_statements":total_statements}

def get_distribution_metadata():
  sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dzl: <http://data.dzl.de/ont/dwh#>

SELECT DISTINCT ?top_element ?top_label ?element ?label ?sub_elements (COUNT(DISTINCT ?x) AS ?sub_sub_elements)
WHERE
{
  {
    SELECT DISTINCT ?top_element ?top_label (COUNT(DISTINCT ?y) AS ?sub_elements)
    WHERE {
      ?dzl dzl:topLevelNode ?top_element .
      ?top_element skos:prefLabel ?top_label FILTER(lang(?top_label)='en') .
      ?top_element skos:narrower* [ rdf:hasPart* [ skos:narrower* ?y ] ] .
    }
    GROUP BY ?top_element ?top_label
  }

  ?top_element skos:narrower ?element . 
  ?element skos:prefLabel ?label FILTER(lang(?label)='en').
  ?element skos:narrower* [ rdf:hasPart* [ skos:narrower* ?x ] ] .
} 
GROUP BY ?top_element ?top_label ?element ?label ?sub_elements
ORDER BY DESC(?sub_elements) DESC(COUNT(DISTINCT ?x))
'''
  url = os.environ['FUSEKI_LIVE_SERVER']+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  categories:Dict[str,Dict[str,Dict[str,int]]] = {}
  for row in r.json()["results"]["bindings"]:
    cat_name=row["top_label"]["value"]
    if cat_name not in categories:
      categories.update({
        cat_name:{
          "sub_concepts":int(row["sub_elements"]["value"]),
          "sub_categories":{}
        }
      })
    categories[cat_name]["sub_categories"].update({row["label"]["value"]:int(row["sub_sub_elements"]["value"])})

  return categories

def get_toplevel_elements()->list[str]:
  sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?element
WHERE {
	{
		SELECT ?element
		WHERE {
			?element a skos:Concept .
			?scheme :topLevelNode ?element .
		}
	}
	UNION
	{
		SELECT ?element
		WHERE {
			?element a skos:Concept .
			?element skos:topConceptOf ?scheme .
		}
	}
}
'''
  url=os.environ["FUSEKI_LIVE_SERVER"]+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  return list(map(lambda x:x["element"]["value"],r.json()["results"]["bindings"]))

def get_concept_details(iri:list[str]|str|None=None,include_children=False) -> tuple[ontology.RDFPredicates,set[str]]:
  subject_filter=""
  parent_subject_filter=""
  if iri: 
    subject_filter="?parent_subject skos:narrower* ?subject. ?parent_subject skos:broader* ?subject ."
    if include_children:
      subject_filter="?parent_subject skos:narrower* [rdf:hasPart* [skos:narrower* ?subject]] ."   
    if isinstance(iri, list):
      parent_subject_filter="FILTER(?parent_subject IN (<"+">,<".join(iri)+">)) ."
    else:
      parent_subject_filter="FILTER(?parent_subject IN (<"+">,<".join(iri.split(","))+">)) ."
  sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?subject ?predicate ?object ?object_label
WHERE {
  '''+parent_subject_filter+'''
  '''+subject_filter+'''
  ?subject a skos:Concept .
  ?subject ?predicate ?object .
  OPTIONAL {
    ?object ?label_predicate ?object_label .
    FILTER (?label_predicate IN (rdf:label,skos:prefLabel))
  }
}
'''
  url=os.environ["FUSEKI_LIVE_SERVER"]+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  result_predicates = ontology.RDFPredicates()
  result_predicates_set = set()
  for row in r.json()["results"]["bindings"]:
    subject = row["subject"]["value"]
    predicate = row["predicate"]["value"]
    object=row["object"]["value"]
    object_label="object_label" in row and row["object_label"]["value"] or None
    type=row["object"]["type"]
    language = "object_label" in row and "xml:lang" in row["object_label"] and row["object_label"]["xml:lang"] or "xml:lang" in row["object"] and row["object"]["xml:lang"] or None
    rdfpredicates = result_predicates.get(subject,predicate)
    rdfpredicates.add_object(value=object,object_label=object_label,type=type,language=language)
    result_predicates_set.update({predicate})
  return result_predicates, result_predicates_set


def get_attribute_definitions() -> list[ontology.AttributeDefinition]:
  sparql_query='''
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dwh:    <http://sekmi.de/histream/dwh#> 
SELECT ?attribute ?label ?display_index
WHERE {
  ?attribute a :attribute .
  ?attribute rdf:label ?label .
  ?attribute :cometar_displayIndex ?display_index .
}
ORDER BY ?display_index
'''
  url=os.environ["FUSEKI_LIVE_SERVER"]+'/query'
  headers = {'Accept-Charset': 'UTF-8'}
  r = requests.post(url, data={'query': sparql_query}, headers=headers)
  result:list[ontology.AttributeDefinition] = []
  for row in r.json()["results"]["bindings"]:
    iri=row["attribute"]["value"]
    label=row["label"]["value"]
    language="xml:lang" in row["label"] and row["label"]["xml:lang"] or None
    display_index=row["display_index"]["value"]
    ads=[x for x in result if x.iri == iri]
    if len(ads) == 0:
      ad=ontology.AttributeDefinition(iri,display_index)
      result.append(ad)
    else:
      ad=ads[0]
    ad.addLabel(label,language)
  return result
