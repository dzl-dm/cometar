from __future__ import annotations
from .mylog import mylog
import difflib
import logging
from datetime import datetime
logger = logging.getLogger(__name__)
from . import fuseki_query_adapter as query_adapter
from .fuseki_query_adapter import ProvenanceCommit, Dictable, RDFIriObject, RDFPredicate, RDFPredicates, AttributeDefinition, LocatedLiteralizable

class ConceptList:
    def __init__(self,items:list[ConceptDetails],attributes_definitions:list[AttributeDefinition]):
        self.items = items
        self.attributes_definitions = attributes_definitions    
    def toJson(self):
        return {
            "items":[t.toJson() for t in self.items],
            "attributes":[a.toJson() for a in self.attributes_definitions]
        }
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
                            if isinstance(o,LocatedLiteralizable):
                                if o.get_single_located_literal() == tag.attribute_value:
                                    self.tags.append(tag)
                                    break
                            if isinstance(o,RDFIriObject):
                                for l in o.literals:
                                    if l.value == tag.attribute_value:
                                        self.tags.append(tag)
                                        break
                    else:
                        self.tags.append(tag)
    def getDisplayLabel(self,language:str|None=None) -> str:
        displayLabel_candidates = [p.get_single_located_literal(language=language,tagged=False) for p in self.predicates if p.iri == "http://data.dzl.de/ont/dwh#displayLabel"]
        displayLabel_candidates_noempty = list(filter(None,displayLabel_candidates))
        if len(displayLabel_candidates_noempty) > 0:
            return displayLabel_candidates_noempty[0]
        else:
            prefLabel_candidates = [p.get_single_located_literal(language=language,tagged=False) for p in self.predicates if p.iri == "http://www.w3.org/2004/02/skos/core#prefLabel"]
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
        iris = query_adapter.get_toplevel_elements()

    treeNodes = [ConceptTreeNode(
            iri,
            attributes_definitions,
            attributes_used,
            rdfPredicates,
            tags
        ) for iri in iris]
    return ConceptList(treeNodes,attributes_definitions)



class ConceptChange(Dictable):
    commit:ProvenanceCommit
    predicate:RDFPredicate
    subject:RDFIriObject
    def __init__(self,commit:ProvenanceCommit,subject:RDFIriObject,predicate:RDFPredicate) -> None:
        self.commit = commit
        self.subject=subject
        self.predicate=predicate
    def toDict(self, compact=True):
        d = super().toDict(compact)
        if "commit" in d.keys():
            del d["commit"]
        if compact and "subject" in d.keys():
            del d["subject"]
        return d

class SingleConceptChange(ConceptChange):
    new:bool
    commit:ProvenanceCommit
    literal_object_change:LiteralConceptOldAndNewValue
    def __init__(self,commit:ProvenanceCommit,subject:RDFIriObject,predicate:RDFPredicate,new:bool) -> None:
        self.predicate = predicate
        self.subject=subject
        self.new = new    
        self.commit = commit
        self.literal_object_changes=[]
class LiteralConceptOldAndNewValue(ConceptChange):
    commit:ProvenanceCommit|list[ProvenanceCommit]
    language:str|None
    before:str
    after:str
    codes:list[tuple[str, int, int, int, int]]
    def __init__(self,commit:list[ProvenanceCommit],subject:RDFIriObject,predicate:RDFPredicate,before:str,after:str,language:str|None=None) -> None:
        self.commit=commit
        self.subject=subject
        self.predicate=predicate
        self.language=language
        self.before=before
        self.after=after
        self.codes=difflib.SequenceMatcher(a=before, b=after).get_opcodes()
class OntologyChanges(Dictable):
    changes:dict[tuple[str,datetime],list[ConceptChange]]
    def __init__(self,commits:list[ProvenanceCommit]):
        self.changes={}
        for commit in commits:
            for detail in commit.details:
                c = self.get(detail.subject.iri,commit.enddate)
                c.append(SingleConceptChange(commit,detail.subject,detail.predicate,detail.addition))
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
            c.update({iri:c.get(iri,[])+ontology_changes.get(iri,date)})
            self.changes.update({date_string:c})
    def condense(self) -> OntologyChangesByDate:
        for date,subjects in self.changes.items():
            for subject_iri,changes in subjects.items():
                single_changes:list[SingleConceptChange] = [c for c in changes if isinstance(c,SingleConceptChange)]
                predicate_iris = set([change.predicate.iri for change in single_changes if len(change.predicate.objects) > 0 and isinstance(change.predicate.objects[0],LocatedLiteralizable)])
                for predicate_iri in predicate_iris:
                    p_changes = [change for change in single_changes if change.predicate.iri == predicate_iri]
                    #iri objects
                    p_i_changes = [change for change in p_changes if isinstance(change.predicate.objects[0],RDFIriObject)]
                    p_i_changes.sort(key=lambda c:c.commit.enddate.isoformat())
                    removes=set()
                    for i,p_i_change in enumerate(p_i_changes):
                        for match_candidate in p_i_changes[i:]:
                            if p_i_change.predicate.objects[0].iri == match_candidate.predicate.objects[0].iri:# type: ignore                    
                                if (p_i_change.new and not match_candidate.new) or (not p_i_change.new and match_candidate.new):
                                    if p_i_change not in removes and match_candidate not in removes:
                                        removes.add(p_i_change)
                                        removes.add(match_candidate)
                                        break
                    changes=[c for c in changes if not c in removes]
                    subjects.update({subject_iri:changes})
                    #literals
                    langs:set[str|None]=set()
                    for change in p_changes:
                        for o in [o for o in change.predicate.objects if isinstance(o,LocatedLiteralizable)]:
                            for l in o.literals:
                                langs.add(l.language)
                    for lang in langs:
                        p_l_changes = [change for change in p_changes if (not isinstance(change.predicate.objects[0],RDFIriObject)) and isinstance(change.predicate.objects[0],LocatedLiteralizable) and change.predicate.objects[0].literals[0].language==lang]
                        if len([c for c in p_l_changes if c.new]) > 0 and len([c for c in p_l_changes if not c.new]) > 0:
                            p_l_changes.sort(key=lambda c:c.commit.enddate.isoformat())
                            if p_l_changes[0].new:
                                last_old = [c for c in p_l_changes if not c.new][-1]
                                last_old_val = isinstance(last_old.predicate.objects[0],LocatedLiteralizable) and last_old.predicate.get_single_located_literal() or ""
                                first_new = [c for c in p_l_changes if c.new][0]
                                first_new_val = isinstance(first_new.predicate.objects[0],LocatedLiteralizable) and first_new.predicate.get_single_located_literal() or ""
                                betweens = [c for c in p_l_changes if p_l_changes.index(c) >= p_l_changes.index(first_new) and p_l_changes.index(c) <= p_l_changes.index(last_old)]
                                if not first_new_val == last_old_val:
                                    changes.append(LiteralConceptOldAndNewValue([c.commit for c in betweens],last_old.subject,RDFPredicate(predicate_iri,subject_iri), first_new_val,last_old_val,lang))
                            else:
                                last_new = [c for c in p_l_changes if c.new][-1]
                                last_new_val = isinstance(last_new.predicate.objects[0],LocatedLiteralizable) and last_new.predicate.get_single_located_literal() or ""
                                first_old = [c for c in p_l_changes if not c.new][0]
                                first_old_val = isinstance(first_old.predicate.objects[0],LocatedLiteralizable) and first_old.predicate.get_single_located_literal() or ""
                                betweens = [c for c in p_l_changes if p_l_changes.index(c) >= p_l_changes.index(first_old) and p_l_changes.index(c) <= p_l_changes.index(last_new)]
                                changes.append(LiteralConceptOldAndNewValue([c.commit for c in betweens],last_new.subject,RDFPredicate(predicate_iri,subject_iri), first_old_val,last_new_val,lang))
                            changes=[c for c in changes if not c in betweens]
                            subjects.update({subject_iri: changes})       
        return self
class OntologyChangesBySubject(Dictable):
    changes:dict[str,dict[str,list[ConceptChange]]]
    def __init__(self,ontology_changes:OntologyChanges) -> None:
        self.changes={}
        for iri,date in ontology_changes.changes.keys():
            c = self.changes.get(iri,{})
            c.update({date.isoformat():ontology_changes.get(iri,date)})
            self.changes.update({iri:c})
