import { Injectable } from '@angular/core';
import { TreeItem } from '../classes/tree-item';
import { DataService, JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartString, JSONResponsePartArray } from 'src/app/services/data.service';
import { combineLatest, Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { GhostTreeItem } from './ontology-access.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class OntologyDataService {

  constructor(
    private dataService: DataService,
    private configuration: ConfigurationService
  ) { 
    this.configuration.configurationLoaded$.subscribe(()=>{
      this.ghostTreeItems$.next([]);
      this.loadOntology();
    })
  }

  private ghostTreeItems$ = new ReplaySubject<GhostTreeItem[]>(1);
  private rootItems:TreeItem[]=[];
  public rootItems$ = new ReplaySubject<TreeItem[]>(1);
  private treeItems:TreeItem[]=[];
  public treeItems$ = new ReplaySubject<TreeItem[]>(1);

  private loadOntology(){
    const rootQueryString = this.getRootElementsQueryString();
    const rootQuery:Observable<RootElement[]> = this.dataService.getData(rootQueryString, "root elements");

    const parentsQueryString = this.getAllParentRelationsQueryString();
    const parentsQuery:Observable<ParentChildRelation[]> = this.dataService.getData(parentsQueryString, "all parent-child relations");

    const informationQueryString = this.getItemInformationQueryString();
    const informationQuery:Observable<TreeItemInformation[]> = this.dataService.getData(informationQueryString, "all basic concept information", {notations:"|array", units:"|array"});
    
    //this triggers once when the page loads and afterwards when a new provenance date is entered so that this.ghostTreeItems$ changes
    //could be optimized by not fully rebuilding the concept tree
    combineLatest(rootQuery,parentsQuery,informationQuery,this.ghostTreeItems$).subscribe(([rootElements,pcs,is,gtis])=>{
      if (rootElements.length==0 || pcs.length==0 || is.length == 0) { return; }
      this.rootItems=[];
      this.treeItems=[];
      rootElements.forEach(re=>{
        const info = is.filter(i => i.element.value == re.element.value)[0];
        if (!info) { return; }
        const ti = new TreeItem(info);
        this.rootItems.push(ti);
        this.treeItems.push(ti);
        this.fillOntologyRecursively(ti,pcs,is,gtis);
      });
      this.rootItems.sort((a,b)=> {
        const labela = a.displayLabel.value || a.label.value;
        const labelb = b.displayLabel.value || b.label.value;
        if (labela > labelb) { return 1; }
        return -1;
      });
      
      this.treeItems$.next(this.treeItems);
      this.rootItems$.next(this.rootItems);
    });
  }
  
  private fillOntologyRecursively(ti:TreeItem,pcs:ParentChildRelation[],is:TreeItemInformation[],gtis:GhostTreeItem[]){    
    const children = pcs.filter(pc => pc.parent.value == ti.element.value).map(pc => pc.child);
    children.forEach(c => {
      const checkti = this.treeItems.filter(ti => ti.element.value == c.value);
      let newti:TreeItem;
      if (checkti.length > 0) { newti = checkti[0]; }
      else {
        const info = is.filter(i => i.element.value == c.value)[0];
        newti = new TreeItem(info);
        this.treeItems.push(newti);
        this.fillOntologyRecursively(newti,pcs,is,gtis);  
      }
      ti.children.push(newti);
      newti.parents.push(ti);    
    });

    const ghostChildren = gtis.filter(gti => gti.parent == ti.element.value);
    ghostChildren.forEach(gc => {
      const checkti = ti.children.map(c => c.element.value).includes(gc.element.value)
      if (!checkti){
        const newti = new TreeItem({
          element: gc.element,
          label: {value: gc.label.value, "xml:lang":"en"},
          notations: { value:[] },
          isModifier: {value: false},
          units: { value:[] },
          type: {value: "http://www.w3.org/2004/02/skos/core#Concept"}
        });
        newti.ghostParents.push(ti.element);   
        ti.children.push(newti); 
        newti.parents.push(ti);
        this.treeItems.push(newti);
        this.fillOntologyRecursively(newti,pcs,is,gtis); 
      }
    });

    ti.children.sort((a,b)=> {
      const labela = a.displayLabel.value || a.label.value;
      const labelb = b.displayLabel.value || b.label.value;
      if (labela > labelb) { return 1; }
      return -1;
    });
  }  
  
  public setGhostTreeItems(gtis:GhostTreeItem[]) {
    this.ghostTreeItems$.next(gtis);
  }

  /*private addGhostTreeItems(gtis:GhostTreeItem[]){
    let insertedAnotherGhostTreeItem = true;
    while (insertedAnotherGhostTreeItem){
      insertedAnotherGhostTreeItem = false;
      gtis.forEach(gti => {
        console.log(gti);
        console.log(this.treeItems);
        this.treeItems
          .filter(tis => tis.element.value == gti.parent 
            && !tis.children.map(c => c.element.value).includes(gti.element.value))
          .forEach(ti => {
            console.log(ti);
            let newti = new TreeItem({
              element: gti.element,
              label: {value: gti.label.value, "xml:lang":"en"},
              isModifier: {value: false},
              type: {value: "http://www.w3.org/2004/02/skos/core#Concept"}
            });
            newti.isGhostItem = true;
            ti.children.push(newti);
            this.treeItems.push(newti);
            insertedAnotherGhostTreeItem = true;
          })
      })
      console.log(this.treeItems.filter(ti => ti.isGhostItem))
    }
    this.treeItems$.next(this.treeItems);
  }*/

  public getRootElementsQueryString():string{
    return `#root elements
${this.dataService.prefixes}
SELECT ?element
WHERE
{
  {
      SELECT ?element
      WHERE { ?org <${this.configuration.settings.rdf.topLevelNode_iri}> ?element . }
  }
  UNION
  {
      SELECT ?element
      WHERE { ?element skos:topConceptOf :Scheme . }
  }
} ` 
  }

  private getAllParentRelationsQueryString():string {
    return `#parent-child relations
${this.dataService.prefixes}
SELECT ?parent ?child
WHERE
{
  ?parent ?narrower ?child .
  FILTER (?narrower IN (skos:narrower, skos:member, rdf:hasPart))
}`
  }

  private getItemInformationQueryString(){
    return `#basic information for all concepts
${this.dataService.prefixes}
SELECT ?element ?type ?label (COUNT(?top)>0 as ?isModifier) ?status ?displaylabel (GROUP_CONCAT(?notation;separator="|") as ?notations) (GROUP_CONCAT(?unit;separator="|") as ?units)
WHERE {	    
  FILTER (bound(?element))
  ?element skos:prefLabel ?label FILTER (lang(?label)='en') .
  OPTIONAL { ?element skos:broader* [ rdf:partOf ?top ] . }
  OPTIONAL { ?element skos:notation ?notation }
  OPTIONAL { ?element <${this.configuration.settings.rdf.unit_iri}> ?unit }
  OPTIONAL { ?element <${this.configuration.settings.rdf.displayLabel_iri}> ?displaylabel FILTER (lang(?displaylabel)='en') }
  OPTIONAL { ?element rdf:type ?type . }
  OPTIONAL { ?element <${this.configuration.settings.rdf.status_iri}> ?status . }
} 
GROUP BY ?element ?label ?type ?status ?displaylabel
HAVING bound(?element)
ORDER BY ?isModifier ?label`;
  }
}

interface RootElement {
  element: JSONResponsePartUriString
}

interface ParentChildRelation {
  parent: JSONResponsePartUriString,
  child: JSONResponsePartUriString
}

export interface TreeItemInformation {
  element: JSONResponsePartUriString,
  type: JSONResponsePartUriString,
  notations: JSONResponsePartArray,
  label: JSONResponsePartLangString,
  displaylabel?:JSONResponsePartLangString,
  isModifier: JSONResponsePartBoolean,
  status?: JSONResponsePartString,
  units:JSONResponsePartArray
}