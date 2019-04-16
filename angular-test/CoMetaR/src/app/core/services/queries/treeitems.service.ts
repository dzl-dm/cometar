import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartBoolean, JSONResponsePartLangString, JSONResponsePartUriString, JSONResponsePartString, prefixes, JSONResponsePartDate } from '../../../services/data.service';
import { map, filter, withLatestFrom, combineAll } from 'rxjs/operators';
import { Observable, combineLatest, of, BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { TreeDataService } from '../tree-data.service';

@Injectable({
  providedIn: 'root'
})
export class TreeItemsService {
    constructor(
        private dataService: DataService
    ) { 
    }

    private ghostTreeItems:TreeItemAttributes[] = [];    
    public ghostTreeItems$ = new BehaviorSubject<TreeItemAttributes[]>([]);

    public setGhostTreeItems(items: TreeItemAttributes[]){
        this.ghostTreeItems = [];
        items.forEach(item => {
            if (this.ghostTreeItems.filter(i => i.element.value == item.element.value && i.ghostItemParent == item.ghostItemParent).length == 0){
              this.ghostTreeItems.push(item);
            };
        })
        this.ghostTreeItems$.next(this.ghostTreeItems);
    }

    public get(options:{range?:"top"|"sub"|"single", iri?:string}):Observable<TreeItemAttributes[]> {
        let {range, iri} = options;

        const currentTreeItemsQueryString = this.getCurrentTreeItemsQueryString(range,iri);
        
        return combineLatest(this.dataService.getData(currentTreeItemsQueryString),this.ghostTreeItems$).pipe(
            map(([currentItems,ghostItems]) => {
                if (range=="top") return currentItems;
                let allitems = currentItems.concat(ghostItems.filter(item => item.ghostItemParent == iri) || []);
                allitems.map(item => {
                    if (ghostItems[item.element.value]) item.hasChildren.value = true;
                    return item;
                })
                return allitems;
            })
        );
    };

    public getCurrentTreeItemsQueryString(range,iri?):string {
        return `${prefixes}
SELECT ?element ?type ?label (COUNT(?sub)>0 as ?hasChildren) (COUNT(?top)>0 as ?isModifier) ?status
WHERE {	          
    ${range=="sub"?this.getSubElementsFilter(iri):range=="top"?this.getTopElementsFilter():this.getSingleElementFilter(iri)}
	FILTER (bound(?element))
    ?element skos:prefLabel ?label FILTER (lang(?label)='en') .
    OPTIONAL { ?element skos:narrower ?sub . }
    OPTIONAL { ?element rdf:hasPart ?sub . }
    OPTIONAL { ?element skos:member ?sub . }
    OPTIONAL { ?element skos:broader* [ rdf:partOf ?top ] . }
    OPTIONAL { ?element rdf:type ?type . }
    OPTIONAL { ?element :status ?status . }
} 
GROUP BY ?element ?label ?type ?status
HAVING bound(?element)
ORDER BY ?isModifier ?label`;
    }
    private getSubElementsFilter(iri):string{
        return `
    { 
        SELECT ?element
        WHERE { 
            <${iri}> ?narrower ?element .
            FILTER (?narrower IN (skos:narrower, rdf:hasPart, skos:member)) 
        } 
    }`
    }
    private getTopElementsFilter():string{
        return `
    {
        SELECT ?element
        WHERE { ?dzl :topLevelNode ?element . }
    }
    UNION
    {
        SELECT ?element
        WHERE { ?element skos:topConceptOf :Scheme . }
    } `
    }
    private getSingleElementFilter(iri):string{
        return `
    FILTER (?element = <${iri}>)
    `
    }
}

export interface TreeItemAttributes {
    element:JSONResponsePartUriString,
    type:JSONResponsePartUriString,
    label:JSONResponsePartLangString,
    hasChildren:JSONResponsePartBoolean,
    isModifier:JSONResponsePartBoolean,
    status?:JSONResponsePartString,
    ghostItemParent?:string
}