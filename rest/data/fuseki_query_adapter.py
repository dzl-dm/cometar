from typing import Dict
from . import fuseki_queries as fuseki_query
from datetime import datetime
import json
import dateutil.parser

class Dictable: 
    def toDict(self,compact=True):
        d = dict(self.__dict__)
        keys = [key for key in d.keys()]
        for i in range(len(d.keys())-1, -1, -1):
            key = keys[i]
            a = self.__getattribute__(key)
            if isinstance(a,Dictable):
                d.update({key:a.toDict(compact)})
            if compact and isinstance(a,list):
                if len(a) == 0:
                    del d[key]
        return d
    def toJson(self,compact=True,also_loads=True,indent=False):
        d = json.dumps(self, default=lambda o: isinstance(o,Dictable) and o.toDict(compact) or hasattr(o,"__dict__") and o.__dict__ or str(o),indent=4 if indent else -1)
        if not also_loads:
            return d
        return json.loads(d)

class RDFLiteralObject(Dictable):
    language:str|None
    value:str
    def __init__(self,value,language=None):
        self.language=language
        self.value=value

class LocatedLiteralizable:
    literals:list[RDFLiteralObject]
    literal_fallback_value:str|None
    literal_fallback_array:list[str]
    def __init__(self,literal_fallback_value:str|None=None,literal_fallback_array:list[str]=[]) -> None:
        self.literal_fallback_value=literal_fallback_value
        self.literals=[]
        self.literal_fallback_array=literal_fallback_array
    def get_located_literals(self,language:str|None=None,tagged=False,fallBackOnNoLang=True,fallBackOnEnLang=True) -> list[str]:
        lit = [l for l in self.literals if language == "all" or not language or l.language == language]
        if len(lit) > 0:
            return [(tagged and l.language and (l.language + ": ") or "") + l.value for l in lit]
        if fallBackOnEnLang:
            lit = [l for l in self.literals if l.language == "en"]
        if len(lit) > 0:
            return [(tagged and l.language and (l.language + ": ") or "") + l.value for l in lit]
        if fallBackOnNoLang:
            lit = [l for l in self.literals if l.language == None]
        if len(lit) > 0:
            return [(tagged and l.language and (l.language + ": ") or "") + l.value for l in lit]
        return self.literal_fallback_array
    def get_single_located_literal(self,language:str|None=None,tagged=False,fallBackOnNoLang=True,fallBackOnEnLang=True) -> str|None:
        r = self.get_located_literals(language=language,tagged=tagged,fallBackOnNoLang=fallBackOnNoLang,fallBackOnEnLang=fallBackOnEnLang)
        if len(r) > 0:
            return r[0]
        return self.literal_fallback_value
    def addLiteral(self,literal:str,language:str|None):
        if len([x for x in self.literals if x.value==literal and x.language==language]) == 0:
            self.literals.append(RDFLiteralObject(literal,language))
        return self
    
class RDFIriObject(LocatedLiteralizable,Dictable):
    iri:str
    def __init__(self, iri: str):
        LocatedLiteralizable.__init__(self,literal_fallback_value=iri,literal_fallback_array=[iri])
        self.iri=iri

class RDFPredicate(Dictable,LocatedLiteralizable):
    subject_iri:str
    iri:str
    objects:list[LocatedLiteralizable]
    def __init__(self,iri,subject_iri):
        super().__init__()
        self.subject_iri=subject_iri
        self.iri=iri
        self.objects = []
    def add_object(self,iri:str|None=None, iri_literal:str|None=None, iri_literal_lang:str|None=None, literal:str|None=None, literal_lang:str|None=None):
        if iri:
            rdfiriobjects:list[RDFIriObject] = [o for o in self.objects if isinstance(o,RDFIriObject) and o.iri==iri]
            if len(rdfiriobjects) == 0:
                rdfiriobject = RDFIriObject(iri)
                self.objects.append(rdfiriobject)
            else:
                rdfiriobject = rdfiriobjects[0]
            if iri_literal:
                rdfiriobject.addLiteral(iri_literal,iri_literal_lang)
        elif literal:
            rdfliteralobjects:list[RDFLiteralObject] = [o for o in self.objects if isinstance(o,RDFLiteralObject) and o.value==literal and o.language == literal_lang]
            if len(rdfliteralobjects) == 0:
                self.objects.append(LocatedLiteralizable().addLiteral(literal,literal_lang))
    def get_located_literals(self,language:str|None=None,tagged=False,fallBackOnNoLang=True,fallBackOnEnLang=True) -> list[str]:
        return list(set().union(*[o.get_located_literals(language,tagged,fallBackOnNoLang,fallBackOnEnLang) for o in self.objects]))
    def get_iris(self) -> list[str]:
        return [o.iri for o in self.objects if isinstance(o,RDFIriObject)]
    def toDict(self, compact=True):
        d = super().toDict(compact)
        if "subject_iri" in d.keys():
            del d["subject_iri"]
        return d

class RDFPredicates:
    predicates:dict[tuple[str,str],RDFPredicate]
    def __init__(self):
        self.predicates={}
    def has(self,subject_iri:str,predicate_iri:str) -> bool:
        p = self.predicates.get((subject_iri,predicate_iri))
        if not p:
            return False
        if len(p.objects) == 0:
            return False
        return True
    def get(self,subject_iri:str,predicate_iri:str) -> RDFPredicate:
        p = self.predicates.get((subject_iri,predicate_iri),RDFPredicate(predicate_iri,subject_iri))
        self.predicates.update({(subject_iri,predicate_iri):p})
        return p

class AttributeDefinition(RDFIriObject):
    iri:str
    display_index:list[int]
    def __init__(self, iri:str, display_index:str="1"):
        super().__init__(iri)
        self.iri = iri
        self.display_index = list(map(lambda x:int(x),display_index.split(":")))
        
class ProvenanceCommitDetails(Dictable):
    subject:RDFIriObject
    predicate:RDFPredicate
    addition:bool
    def __init__(self,subject:str,subject_labels:str|None,predicate:str,object:str,object_lang:str|None,object_labels:str|None,addition:bool,object_type:str) -> None:
        self.subject=RDFIriObject(subject)
        if subject_labels:
            label_array=subject_labels.split("::::")
            for l in label_array:
                label,lang=l.split(":::")
                self.subject.addLiteral(label,lang)
        self.predicate=RDFPredicate(predicate,subject)
        if object_type == "literal":
            self.predicate.add_object(literal=object,literal_lang=object_lang)
        elif object_type == "uri":
            if object_labels:
                label_array=object_labels.split("::::")
                for l in label_array:
                    label,lang=l.split(":::")
                    self.predicate.add_object(iri=object,iri_literal=label,iri_literal_lang=lang)
            else:
                self.predicate.add_object(iri=object)
        self.addition=addition
class ProvenanceCommit(Dictable):
    commitid:str
    author:str
    message:str
    enddate:datetime
    details:list[ProvenanceCommitDetails]
    def __init__(self,commitid:str,author:str,message:str,enddate:datetime) -> None:
        self.commitid=commitid
        self.author=author
        self.message=message
        self.enddate=enddate
        self.details=get_provenance_commit_details(commitid)




def get_provenance_commits(from_date:datetime,until_date:datetime) -> list[ProvenanceCommit]:
    r = fuseki_query.get_provenance_commits(from_date,until_date)
    return [ProvenanceCommit(
		row["commitid"]["value"],
		row["author"]["value"],
		message=row["message"]["value"],
		enddate=dateutil.parser.isoparse(row["enddate"]["value"])
	) for row in r.json()["results"]["bindings"]]
def get_provenance_commit_details(commitid:str) -> list[ProvenanceCommitDetails]:
    r = fuseki_query.get_provenance_commit_details(commitid)
    return [ProvenanceCommitDetails(
		subject=row["subject"]["value"],
		subject_labels="subject_labels" in row and row["subject_labels"]["value"] or None,
		predicate=row["predicate"]["value"],
		object=row["object"]["value"],
        object_lang="xml:lang" in row["object"] and row["object"]["xml:lang"] or None,
		object_labels="object_labels" in row and row["object_labels"]["value"] or None,
		addition="addition" in row and row["addition"]["value"] == "true",
    	object_type=row["object"]["type"],
	) for row in r.json()["results"]["bindings"]]





def get_toplevel_elements() -> list[str]:
    r = fuseki_query.get_toplevel_elements()
    return list(map(lambda x:x["element"]["value"],r.json()["results"]["bindings"]))
def get_concept_details(iris:list[str]|None=None,include_children=False) -> tuple[RDFPredicates,set[str]]:
  r = fuseki_query.get_concept_details(iris,include_children)
  result_predicates = RDFPredicates()
  result_predicates_set = set()
  for row in r.json()["results"]["bindings"]:
    subject = row["subject"]["value"]
    predicate = row["predicate"]["value"]
    object=row["object"]["value"]
    object_lang = "xml:lang" in row["object"] and row["object"]["xml:lang"] or None
    object_literal="object_label" in row and row["object_label"]["value"] or None
    object_literal_lang = "object_label" in row and "xml:lang" in row["object_label"] and row["object_label"]["xml:lang"] or None
    type=row["object"]["type"]
    rdfpredicates = result_predicates.get(subject,predicate)
    if type == "uri":
      rdfpredicates.add_object(iri=object,iri_literal=object_literal,iri_literal_lang=object_literal_lang)
    elif type == "literal":
      rdfpredicates.add_object(literal=object,literal_lang=object_lang)
    result_predicates_set.update({predicate})
  return result_predicates, result_predicates_set
def get_attribute_definitions() -> list[AttributeDefinition]:
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
  r = fuseki_query.get_attribute_definitions()
  result:list[AttributeDefinition] = []
  for row in r.json()["results"]["bindings"]:
    iri=row["attribute"]["value"]
    label=row["label"]["value"]
    language="xml:lang" in row["label"] and row["label"]["xml:lang"] or None
    display_index=row["display_index"]["value"]
    ads=[x for x in result if x.iri == iri]
    if len(ads) == 0:
      ad=AttributeDefinition(iri,display_index)
      result.append(ad)
    else:
      ad=ads[0]
    ad.addLiteral(label,language)
  return result



def get_progress_metadata_concepts():
    r = fuseki_query.get_progress_metadata_concepts()
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
  r = fuseki_query.get_progress_metadata_attributes()
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
  r = fuseki_query.get_distribution_metadata()
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