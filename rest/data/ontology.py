from __future__ import annotations
from .mylog import mylog
import json
import logging
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
class Jsonifyable:
    def clearForJson(self):
        pass
    def toJson(self):
        self.clearForJson()
        return json.loads(json.dumps(self, default=lambda o: o.__dict__))
class ConceptDetails(Jsonifyable):
    iri:str
    predicates:list[RDFPredicate]
    def __init__(self,iri:str,attributes_used:set[str],rdfPredicates:RDFPredicates):
        self.iri=iri
        self.predicates=[rdfPredicates.get(iri,a) for a in attributes_used if len(rdfPredicates.get(iri,a).objects) > 0]
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
    def clearForJson(self):
        for i in range(len(self.predicates)-1, -1, -1):
            p=self.predicates[i]
            if len(p.objects) == 0:
                del self.predicates[i]
            else:
                if hasattr(p,'subject_iri'):
                    del(p.subject_iri)
class ConceptTreeNode(ConceptDetails):
    children:list[ConceptDetails]
    def __init__(self,iri:str,attributes_definitions:list[AttributeDefinition],attributes_used:set[str],rdfPredicates:RDFPredicates):
        super().__init__(iri,attributes_used,rdfPredicates)
        self.children = [ConceptTreeNode(o,attributes_definitions,attributes_used,rdfPredicates) for o in rdfPredicates.get(iri,"http://www.w3.org/2004/02/skos/core#narrower").get_iris()]
        self.children += [ConceptTreeNode(o,attributes_definitions,attributes_used,rdfPredicates) for o in rdfPredicates.get(iri,"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart").get_iris()]
    def clearForJson(self):
        super().clearForJson()
        for c in self.children:
            c.clearForJson()

        
class RDFPredicates:
    predicates:dict[tuple[str,str],RDFPredicate]
    def __init__(self):
        self.predicates={}
    def get(self,subject_iri:str,predicate_iri:str) -> RDFPredicate:
        p = self.predicates.get((subject_iri,predicate_iri),RDFPredicate(predicate_iri,subject_iri))
        self.predicates.update({(subject_iri,predicate_iri):p})
        return p

class RDFObject:
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

class RDFPredicate:
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


class AttributeDefinition(RDFIriObject):
    display_index:list[int]
    def __init__(self, iri="", display_index:str="1"):
        self.iri = iri
        self.labels=[]
        self.display_index = list(map(lambda x:int(x),display_index.split(":")))
    def toJson(self):
        return json.loads(json.dumps(self, default=lambda o: o.__dict__))

def get_concept_list(rdfPredicates:RDFPredicates,attributes_definitions:list[AttributeDefinition]=[],attributes_used:set[str]=set(),iri:list[str]|str|None=None) -> ConceptList:
    item_iris=[]
    if iri:    
        if isinstance(iri, list):
            item_iris=iri
        else:
            item_iris = iri.split(",")
    else:
        item_iris = list(set([t[0] for t in rdfPredicates.predicates.keys()]))
    concept_details = [ConceptDetails(iri,attributes_used,rdfPredicates) for iri in item_iris]
    return ConceptList(concept_details,attributes_definitions)
def get_concept_tree(
            rdfPredicates:RDFPredicates,
            iris:list[str]|None=None,
            attributes_definitions:list[AttributeDefinition]=[],
            attributes_used:set[str]=set()
        ) -> ConceptList:
    treeNodes:list[ConceptDetails]
    if not iris:        
        iris = fuseki_query.get_toplevel_elements()
    treeNodes = [ConceptTreeNode(iri,attributes_definitions,attributes_used,rdfPredicates) for iri in iris]
    #treeNodes = [ConceptTreeNode(iri,attributes_definitions,attributes_used,rdfPredicates)]
    return ConceptList(treeNodes,attributes_definitions)