import { Injectable } from '@angular/core';
import { TreeItem } from '../classes/tree-item';
import { prefixes, DataService, JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartString } from 'src/app/services/data.service';
import { element, pipe } from '@angular/core/src/render3';
import { withLatestFrom, map } from 'rxjs/operators';
import { combineLatest, forkJoin, Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { GhostTreeItem } from './ontology-access.service';

@Injectable({
  providedIn: 'root'
})
export class OntologyDataService {

  constructor(private dataService: DataService) { 
    this.ghostTreeItems$.next([]);
    this.loadOntology();
  }

  private ghostTreeItems$ = new ReplaySubject<GhostTreeItem[]>(1);
  private rootItems:TreeItem[]=[];
  public rootItems$ = new ReplaySubject<TreeItem[]>(1);
  private treeItems:TreeItem[]=[];
  public treeItems$ = new ReplaySubject<TreeItem[]>(1);

  private loadOntology(){
    let rootQueryString = this.getRootElementsQueryString();
    let rootQuery:Observable<RootElement[]> = this.dataService.getData(rootQueryString);

    let parentsQueryString = this.getAllParentRelationsQueryString();
    let parentsQuery:Observable<ParentChildRelation[]> = this.dataService.getData(parentsQueryString);

    let informationQueryString = this.getItemInformationQueryString();
    let informationQuery:Observable<TreeItemInformation[]> = this.dataService.getData(informationQueryString);
    
    combineLatest(rootQuery,parentsQuery,informationQuery,this.ghostTreeItems$).subscribe(([rootElements,pcs,is,gtis])=>{
      this.rootItems=[];
      this.treeItems=[];
      rootElements.forEach(re=>{
        let info = is.filter(i => i.element.value == re.element.value)[0];
        let ti = new TreeItem(info);
        this.rootItems.push(ti);
        this.treeItems.push(ti);
        this.fillOntologyRecursively(ti,pcs,is,gtis);
      });
      this.rootItems.sort((a,b)=>{
        if (a.label.value > b.label.value) return 1;
        return -1;
      });
      
      this.treeItems$.next(this.treeItems);
      this.rootItems$.next(this.rootItems);
    });
  }
  
  private fillOntologyRecursively(ti:TreeItem,pcs:ParentChildRelation[],is:TreeItemInformation[],gtis:GhostTreeItem[]){
    let children = pcs.filter(pc => pc.parent.value == ti.element.value).map(pc => pc.child);
    children.forEach(c => {
      let checkti = this.treeItems.filter(ti => ti.element.value == c.value);
      let newti:TreeItem;
      if (checkti.length > 0) newti = checkti[0];
      else {
        let info = is.filter(i => i.element.value == c.value)[0];
        newti = new TreeItem(info);
        this.treeItems.push(newti);
        ti.children.push(newti);
      }
      newti.parents.push(ti);
      this.fillOntologyRecursively(newti,pcs,is,gtis);      
    });

    let ghostChildren = gtis.filter(gti => gti.parent == ti.element.value);
    ghostChildren.forEach(gc => {
      let checkti = ti.children.map(c => c.element.value).includes(gc.element.value)
      if (!checkti){
        let newti = new TreeItem({
          element: gc.element,
          label: {value: gc.label.value, "xml:lang":"en"},
          isModifier: {value: false},
          type: {value: "http://www.w3.org/2004/02/skos/core#Concept"}
        });
        newti.isGhostItem = true;   
        ti.children.push(newti); 
        newti.parents.push(ti);
        this.treeItems.push(newti);
        this.fillOntologyRecursively(newti,pcs,is,gtis); 
      }
    });

    ti.children.sort((a,b)=>{
      if (a.label.value > b.label.value) return 1;
      return -1;
    });
  }  
  
  public setGhostTreeItems(gtis:GhostTreeItem[]) {
    this.ghostTreeItems$.next(gtis);
  }

  private addGhostTreeItems(gtis:GhostTreeItem[]){
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
  }

  private getRootElementsQueryString():string{
    return `${prefixes}
SELECT ?element
WHERE
{
  {
      SELECT ?element
      WHERE { ?dzl :topLevelNode ?element . }
  }
  UNION
  {
      SELECT ?element
      WHERE { ?element skos:topConceptOf :Scheme . }
  }
} ` 
  }

  private getAllParentRelationsQueryString():string {
    return `${prefixes}
SELECT ?parent ?child
WHERE
{
  ?parent ?narrower ?child .
  FILTER (?narrower IN (skos:narrower, skos:member, rdf:hasPart))
}`
  }

  private getItemInformationQueryString(){
    return `${prefixes}
SELECT ?element ?type ?label (COUNT(?top)>0 as ?isModifier) ?status
WHERE {	    
  FILTER (bound(?element))
  ?element skos:prefLabel ?label FILTER (lang(?label)='en') .
  OPTIONAL { ?element skos:broader* [ rdf:partOf ?top ] . }
  OPTIONAL { ?element rdf:type ?type . }
  OPTIONAL { ?element :status ?status . }
} 
GROUP BY ?element ?label ?type ?status
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
  label: JSONResponsePartLangString,
  isModifier: JSONResponsePartBoolean,
  status?: JSONResponsePartString
}