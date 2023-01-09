from __future__ import annotations
from .mylog import mylog
import json
import logging
from datetime import datetime
logger = logging.getLogger(__name__)
from . import fuseki_queries as fuseki_query

class ConceptList:
    def __init__(self,items:list[ConceptDetails],attributes_definitions:list[AttributeDefinition]):
        self.items = items
        self.attributes_definitions = attributes_definitions    
    def toJson(self):
        return {
            "items":[t.toJson() for t in self.items],
            "attributes":[a.toJson() for a in self.attributes_definitions]
        }
class Dictable: 
    def toDict(self,compact=True):
        d = self.__dict__
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
    def toJson(self,compact=True):
        return json.loads(json.dumps(self, default=lambda o: isinstance(o,Dictable) and o.toDict(compact) or hasattr(o,"__dict__") and o.__dict__ or str(o)))
class ConceptTag:
    attribute_label:str
    attribute_name:str
    attribute_value:str|None
    is_rdf_attribute:bool
    is_child_aggregation:bool
    aggregate_children:bool
    amount:int|None
    def __init__(self,attribute_label:str,attribute_name:str,is_rdf_attribute:bool,amount:int|None=None,attribute_value:str|None=None,aggregate_children:bool=False,is_child_aggregation:bool=False) -> None:
        self.attribute_label = attribute_label
        self.attribute_name = attribute_name
        self.is_rdf_attribute = is_rdf_attribute
        self.attribute_value = attribute_value
        self.amount = amount
        self.is_child_aggregation = is_child_aggregation
        self.aggregate_children = aggregate_children
class ConceptDetails(Dictable):
    iri:str
    predicates:list[RDFPredicate]
    tags:list[ConceptTag]
    def __init__(self,iri:str,attributes_used:set[str],rdfPredicates:RDFPredicates,tags:list[ConceptTag]|None=None):
        self.iri=iri
        self.predicates=[rdfPredicates.get(iri,a) for a in attributes_used if rdfPredicates.has(iri,a)]
        self.tags=[]
        if tags:
            for tag in tags:
                if tag.is_rdf_attribute and rdfPredicates.has(self.iri,tag.attribute_name):
                    # TODO: For now, only works for literal values not taking language into account
                    if tag.attribute_value:
                        for o in rdfPredicates.get(self.iri,tag.attribute_name).objects:
                            if isinstance(o,RDFLiteralObject):
                                if o.value == tag.attribute_value:
                                    self.tags.append(tag)
                                    break
                            if isinstance(o,RDFIriObject):
                                for l in o.labels:
                                    if l.value == tag.attribute_value:
                                        self.tags.append(tag)
                                        break
                    else:
                        self.tags.append(tag)
    def getDisplayLabel(self,language:str|None=None) -> str:
        displayLabel_candidates = [p.get_located_literal(language=language,tagged=False) for p in self.predicates if p.iri == "http://data.dzl.de/ont/dwh#displayLabel"]
        displayLabel_candidates_noempty = list(filter(None,displayLabel_candidates))
        if len(displayLabel_candidates_noempty) > 0:
            return displayLabel_candidates_noempty[0]
        else:
            prefLabel_candidates = [p.get_located_literal(language=language,tagged=False) for p in self.predicates if p.iri == "http://www.w3.org/2004/02/skos/core#prefLabel"]
            prefLabel_candidates_noempty = list(filter(None,prefLabel_candidates))
            if len(prefLabel_candidates_noempty) > 0:
                return prefLabel_candidates_noempty[0]
        return "No  "+("'"+language+"'" if language else "")+" Label Available"
    def toDict(self, compact=True):
        d = super().toDict(compact)      
        if compact:
            if "tags" in d.keys():
                d_tags:list[ConceptTag] = d["tags"] # type: ignore  
                for i in range(len(d_tags)-1, -1, -1):
                    tag = d_tags[i]
                    if tag.is_child_aggregation and hasattr(tag,"amount") and tag.amount == 0:
                        del d_tags[i]
                    else:
                        if hasattr(tag,"attribute_name"):
                            del tag.attribute_name
                        if hasattr(tag,"attribute_value"):
                            del(tag.attribute_value)
                        if hasattr(tag,"is_rdf_attribute"):
                            del(tag.is_rdf_attribute)
                        if hasattr(tag,"aggregate_children"):
                            del(tag.aggregate_children)
                        if not tag.is_child_aggregation and hasattr(tag,"amount"):
                            del(tag.amount)
        return d
class ConceptTreeNode(ConceptDetails):
    children:list[ConceptDetails]
    def __init__(self,iri:str,attributes_definitions:list[AttributeDefinition],attributes_used:set[str],rdfPredicates:RDFPredicates,tags:list[ConceptTag]):
        super().__init__(iri,attributes_used,rdfPredicates,tags)
        self.children = [ConceptTreeNode(o,attributes_definitions,attributes_used,rdfPredicates,tags) for o in rdfPredicates.get(iri,"http://www.w3.org/2004/02/skos/core#narrower").get_iris()]
        self.children += [ConceptTreeNode(o,attributes_definitions,attributes_used,rdfPredicates,tags) for o in rdfPredicates.get(iri,"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart").get_iris()]
        for tag in tags:
            if tag.aggregate_children:
                tag_agg = ConceptTag(
                    attribute_label=tag.attribute_label,
                    aggregate_children=True,
                    amount=0,
                    attribute_name=tag.attribute_name,
                    attribute_value=tag.attribute_value,
                    is_child_aggregation=True,
                    is_rdf_attribute=tag.is_rdf_attribute
                )
                for child in self.children:
                    for child_tag in child.tags:
                        if child_tag.attribute_label == tag.attribute_label and not child_tag.is_child_aggregation:
                            tag_agg.amount=(tag_agg.amount or 0) + 1
                        if child_tag.attribute_label == tag.attribute_label and child_tag.is_child_aggregation:
                            tag_agg.amount=(tag_agg.amount or 0) + (child_tag.amount or 0)
                if tag_agg.amount and tag_agg.amount > 0:
                    self.tags.append(tag_agg)
        
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

class RDFObject(Dictable):
    def __init__(self):
        pass
    def get_located_literal(self,language:str|None=None,tagged=False) -> str:
        return ""
    
class RDFIriObject(RDFObject):
    iri:str
    labels:list[RDFLiteralObject]
    def __init__(self, iri: str):
        self.iri = iri
        self.labels=[]
    def addLabel(self,literal:str,language:str|None):
        if len([x for x in self.labels if x.value==literal and x.language==language]) == 0:
            self.labels.append(RDFLiteralObject(literal,language))
    def get_located_literal(self,language:str|None=None,tagged=False) -> str:
        lit = [l.value for l in self.labels if not language or l.language == language]
        if len(lit) > 0:
            return (tagged and language and language + ": " or "") + lit[0]
        return self.iri

class RDFLiteralObject(RDFObject):
    language:str|None
    value:str
    def __init__(self,value,language=None):
        self.language=language
        self.value=value

class RDFPredicate(Dictable):
    subject_iri:str
    iri:str
    objects:list[RDFObject]
    def __init__(self,iri,subject_iri):
        self.subject_iri=subject_iri
        self.iri=iri
        self.objects = []
    def add_object(self,value:str, type:str, object_label:str|None=None, language:str|None=None):
        if type=="uri":
            rdfiriobjects:list[RDFIriObject] = [o for o in self.objects if isinstance(o,RDFIriObject) and o.iri==value]
            if len(rdfiriobjects) == 0:
                rdfiriobject = RDFIriObject(value)
                self.objects.append(rdfiriobject)
            else:
                rdfiriobject = rdfiriobjects[0]
            if object_label:
                rdfiriobject.addLabel(object_label,language)
        if type=="literal":
            rdfliteralobjects:list[RDFLiteralObject] = [o for o in self.objects if isinstance(o,RDFLiteralObject) and o.value==value and o.language == language]
            if len(rdfliteralobjects) == 0:
                self.objects.append(RDFLiteralObject(value,language))
    def get_located_literal(self,language:str|None=None,tagged=False,fallBackOnNoLang=True,fallBackOnEnLang=True) -> str:
        return self.get_located_literals(language,False,fallBackOnNoLang,fallBackOnEnLang)[0]
    def get_located_literals(self,language:str|None=None,tagged=False,fallBackOnNoLang=True,fallBackOnEnLang=True) -> list[str]:
        res = []
        for o in self.objects:
            if isinstance(o,RDFLiteralObject):
                if language == "all" or o.language == language:
                    val = o.value if not tagged or not o.language else (o.language+": "+o.value)
                    res.append(val)
            elif isinstance(o,RDFIriObject):
                for l in o.labels:
                    if language == "all" or l.language == language:
                        val = l.value if not tagged or not l.language else (l.language+": "+l.value)
                        res.append(val)
        if len(res) == 0 and fallBackOnNoLang and language != None:
            return self.get_located_literals(None,tagged,False,fallBackOnEnLang)
        if len(res) == 0 and fallBackOnEnLang and language == None:
            return self.get_located_literals("en",tagged,fallBackOnNoLang,False)
        if len(res) > 0:
            return res
        else:
            return [""]
    def get_iris(self) -> list[str]:
        return [o.iri for o in self.objects if isinstance(o,RDFIriObject)]
    def toDict(self, compact=True):
        d = super().toDict(compact)
        if "subject_iri" in d.keys():
            del d["subject_iri"]


class AttributeDefinition(RDFIriObject):
    display_index:list[int]
    def __init__(self, iri="", display_index:str="1"):
        self.iri = iri
        self.labels=[]
        self.display_index = list(map(lambda x:int(x),display_index.split(":")))

tags:list[ConceptTag] = [
    ConceptTag(attribute_label="Draft",attribute_name="http://data.dzl.de/ont/dwh#status", is_rdf_attribute=True, attribute_value="draft", aggregate_children=True),
    ConceptTag(attribute_label="Editorial Note",attribute_name="http://www.w3.org/2004/02/skos/core#editorialNote", is_rdf_attribute=True, aggregate_children=True)
]
def get_concept_list(
            rdfPredicates:RDFPredicates,
            attributes_definitions:list[AttributeDefinition]=[],
            attributes_used:set[str]=set(),
            iri:list[str]|str|None=None
        ) -> ConceptList:
    item_iris=[]
    if iri:    
        if isinstance(iri, list):
            item_iris=iri
        else:
            item_iris = iri.split(",")
    else:
        item_iris = list(set([t[0] for t in rdfPredicates.predicates.keys()]))
    concept_details = [ConceptDetails(iri,attributes_used,rdfPredicates,tags) for iri in item_iris]
    return ConceptList(concept_details,attributes_definitions)
def get_concept_tree(
            rdfPredicates:RDFPredicates,
            iris:list[str]=[],
            attributes_definitions:list[AttributeDefinition]=[],
            attributes_used:set[str]=set()
        ) -> ConceptList:
    treeNodes:list[ConceptDetails]
    if len(iris)==0:        
        iris = fuseki_query.get_toplevel_elements()

    treeNodes = [ConceptTreeNode(
            iri,
            attributes_definitions,
            attributes_used,
            rdfPredicates,
            tags
        ) for iri in iris]
    return ConceptList(treeNodes,attributes_definitions)

class ProvenanceCommitDetails:
    subject:str
    sl:str|None
    predicate:str
    object:str
    ol:str|None
    object_type:str
    addition:bool
    def __init__(self,subject:str,sl:str|None,predicate:str,object:str,ol:str|None,addition:bool,object_type:str) -> None:
        self.subject=subject
        self.sl=sl
        self.predicate=predicate
        self.object=object
        self.ol=ol
        self.addition=addition
        self.object_type=object_type
class ProvenanceCommit:
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
        self.details=fuseki_query.get_provenance_commit_details(commitid)

class ConceptChange:
    predicate:RDFPredicate|None
    new:bool
    def __init__(self,predicate:RDFPredicate,new:bool) -> None:
        self.predicate = predicate
        self.new = new    
class OntologyChanges:
    changes:dict[tuple[str,datetime],list[ConceptChange]]
    def __init__(self,commits:list[ProvenanceCommit]):
        self.changes={}
        for commit in commits:
            for detail in commit.details:
                c = self.get(detail.subject,commit.enddate)
                p = RDFPredicate(detail.predicate,detail.subject)
                p.add_object(detail.object,detail.object_type,detail.ol)
                c.append(ConceptChange(p,detail.addition))
    def has(self,subject_iri:str,date:datetime) -> bool:
        c = self.changes.get((subject_iri,date))
        if not c:
            return False
        if len(c) == 0:
            return False
        return True
    def get(self,subject_iri:str,date:datetime) -> list[ConceptChange]:
        c = self.changes.get((subject_iri,date),[])
        self.changes.update({(subject_iri,date):c})
        return c
    def by_date(self,granularity:str="day") -> OntologyChangesByDate:
        return OntologyChangesByDate(self,granularity)
    def by_subject(self) -> OntologyChangesBySubject:
        return OntologyChangesBySubject(self)
class OntologyChangesByDate(Dictable):
    changes:dict[str,dict[str,list[ConceptChange]]]
    def __init__(self,ontology_changes:OntologyChanges,granularity:str="day") -> None:
        self.changes={}
        for iri,date in ontology_changes.changes.keys():
            date_string = date.isoformat()
            if granularity == "day":
                date_string = date_string[:10]
            elif granularity == "month":
                date_string = date_string[:7]
            elif granularity == "year":
                date_string = date_string[:4]
            c = self.changes.get(date_string,{})
            c.update({iri:ontology_changes.get(iri,date)})
            self.changes.update({date_string:c})
class OntologyChangesBySubject(Dictable):
    changes:dict[str,dict[str,list[ConceptChange]]]
    def __init__(self,ontology_changes:OntologyChanges) -> None:
        self.changes={}
        for iri,date in ontology_changes.changes.keys():
            c = self.changes.get(iri,{})
            c.update({date.isoformat():ontology_changes.get(iri,date)})
            self.changes.update({iri:c})
