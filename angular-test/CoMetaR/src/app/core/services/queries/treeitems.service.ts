import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartBoolean, JSONResponsePartLangString, JSONResponsePartUriString, JSONResponsePartString, prefixes, JSONResponsePartDate } from '../../../services/data.service';
import { map, filter, withLatestFrom, combineAll } from 'rxjs/operators';
import { Observable, combineLatest, of, BehaviorSubject, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TreeItemsService {
    constructor(
        private dataService: DataService
    ) { 
        this.addedTreeItems$.next([]);
        this.removedTreeItems$.next([]);
        this.movedTreeItems$.next([]);
    }

    private set = false;
    private provTreeItemAttributes$ = new ReplaySubject<ProvTreeItemAttributes[]>();
    public removedTreeItems$ = new ReplaySubject<ProvParentOperation[]>(1);
    public addedTreeItems$ = new ReplaySubject<ProvParentOperation[]>(1);
    public movedTreeItems$ = new ReplaySubject<ProvParentOperation[]>(1);
    private removedTreeItems:ProvParentOperation[] = [];
    private addedTreeItems:ProvParentOperation[] = [];
    private movedTreeItems:ProvParentOperation[] = [];
    private removedTreeItemAttributes={};

    public setProvTreeItemAttributes(from?:Date, until?:Date, commits?:string[]) {
        from = new Date("2019-04-01T10:15:22+01:00");
        until=until || new Date(Date.now());
        until.setHours(0);until.setSeconds(0);until.setMilliseconds(0);until.setMinutes(0); //else it refreshes endlessly
        const provItemsQueryString = this.getProvTreeItemsQueryString(from.toISOString(), until.toISOString(), commits);
        this.dataService.getData(provItemsQueryString).subscribe(this.provTreeItemAttributes$);
        this.provTreeItemAttributes$.subscribe(ptias => {
            let tempElement;
            let tempRemovedTreeItems:ProvParentOperation[] = [];
            let tempAddedTreeItems:ProvParentOperation[] = [];
            let tempMovedTreeItems:ProvParentOperation[] = [];
            ptias.forEach(ptia => {
                if (!tempElement || ptia.element.value != tempElement) {
                    this.removedTreeItems = this.removedTreeItems.concat(tempRemovedTreeItems);
                    this.addedTreeItems = this.addedTreeItems.concat(tempAddedTreeItems);
                    this.movedTreeItems = this.movedTreeItems.concat(tempMovedTreeItems);
                    tempRemovedTreeItems = [];
                    tempAddedTreeItems = [];
                    tempMovedTreeItems = [];
                    tempElement = ptia.element.value;
                }
                if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition") {
                    let negationremove = tempRemovedTreeItems.filter(r => r.oldparent == ptia.parent.value);
                    let negationmove = tempMovedTreeItems.filter(r => r.oldparent == ptia.parent.value);
                    if (negationremove.length > 0) tempRemovedTreeItems.splice(tempRemovedTreeItems.indexOf(negationremove[0]),1);
                    else if (negationmove.length > 0) {
                        tempAddedTreeItems.push({
                            element: tempElement,
                            newparent: negationmove[0].newparent
                        });
                        tempMovedTreeItems.splice(tempMovedTreeItems.indexOf(negationmove[0]),1);
                    }
                    else if (tempRemovedTreeItems.length > 0){
                        let lastremove;
                        if (tempMovedTreeItems.length > 0) lastremove = tempMovedTreeItems[0];
                        else lastremove = tempRemovedTreeItems[tempRemovedTreeItems.length-1];
                        tempMovedTreeItems[0]={
                            element: tempElement,
                            newparent: ptia.parent.value,
                            oldparent: lastremove.oldparent
                        };
                        tempRemovedTreeItems.splice(tempRemovedTreeItems.length-1,1);
                    }
                    else tempAddedTreeItems.push({
                        element: tempElement,
                        newparent: ptia.parent.value
                    })
                }
                if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal") {
                    let negation = tempAddedTreeItems.filter(r => r.newparent == ptia.parent.value);
                    let negationmove = tempMovedTreeItems.filter(r => r.newparent == ptia.parent.value);
                    if (negation.length > 0) tempAddedTreeItems.splice(tempAddedTreeItems.indexOf(negation[0]),1); 
                    else if (negationmove.length > 0) {
                        tempRemovedTreeItems.push({
                            element: tempElement,
                            oldparent: negationmove[0].oldparent
                        });
                        tempMovedTreeItems.splice(tempMovedTreeItems.indexOf(negationmove[0]),1);
                    }                   
                    else if (tempAddedTreeItems.length > 0){
                        let lastadd;
                        if (tempMovedTreeItems.length > 0) lastadd = tempMovedTreeItems[0];
                        else lastadd = tempAddedTreeItems[tempAddedTreeItems.length-1];
                        tempMovedTreeItems[0]={
                            element: tempElement,
                            newparent: lastadd.newparent,
                            oldparent: ptia.parent.value
                        };
                        tempAddedTreeItems.splice(tempAddedTreeItems.length-1,1);
                    }
                    else tempRemovedTreeItems.push({
                        element: tempElement,
                        oldparent: ptia.parent.value
                    })
                }
                /*if (ptia.element.value.indexOf("dition8")>-1) console.log(ptia);
                if (ptia.element.value.indexOf("dition8")>-1) console.log(tempAddedTreeItems.map(a => a.newparent));
                if (ptia.element.value.indexOf("dition8")>-1) console.log(tempRemovedTreeItems.map(a => a.oldparent));
                if (ptia.element.value.indexOf("dition8")>-1) console.log(tempMovedTreeItems.map(a => a.element + ": " +a.oldparent + " => " +a.newparent));*/
            });
            this.removedTreeItems$.next(this.removedTreeItems);
            this.removedTreeItems.concat(this.movedTreeItems).forEach(r=>{
                let attributes = this.removedTreeItemAttributes[r.oldparent] || []
                attributes.push(<TreeItemAttributes>{
                    element: {value: r.element},
                    hasChildren: {value:false},
                    isModifier: {value:false},
                    label: {value:r.element,"xml:lang":'en'},
                    type: {value:"http://www.w3.org/2004/02/skos/core#Concept"}
                });
                this.removedTreeItemAttributes[r.oldparent] = attributes;
            });
            this.addedTreeItems$.next(this.addedTreeItems);
            this.movedTreeItems$.next(this.movedTreeItems);  
        });   
    }

    /**
     * 
     * @param {enum} options.range ["top", "sub", "single"] get top elements or subelements of iri
     * @param {string} options.iri
     */
    public get(options:{range?:"top"|"sub"|"single", iri?:string}):Observable<TreeItemAttributes[]> {
        let {range, iri} = options;
        if (!this.set) {
            this.setProvTreeItemAttributes();
            this.set = true;
        }

        const currentTreeItemsQueryString = this.getCurrentTreeItemsQueryString(range,iri);
        
        return this.dataService.getData(currentTreeItemsQueryString).pipe(
            map((data:TreeItemAttributes[]) => {
                return data.concat(this.removedTreeItemAttributes[iri]||[]);
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

    private getProvTreeItemsQueryString(from:string,until:string,commits:string[]):string{
        return `${prefixes}
SELECT (?lastelement as ?element) ?date (?lastparent as ?parent) ?otherparent ?addorremove
WHERE {	          
    ?commit prov:qualifiedUsage ?cs ;
        prov:endedAtTime ?date .
        ${from&&until&&'FILTER (?date >= "'+from+'"^^xsd:dateTime && ?date <= "'+until+'"^^xsd:dateTime) .'||''}
    ?cs a cs:ChangeSet .

    ?cs ?addorremove [
        a rdf:Statement;
        rdf:subject ?someparent;
        rdf:predicate ?narrower;
        rdf:object ?someelement
    ] .
    ?lastparent prov:wasDerivedFrom* ?someparent .
    FILTER NOT EXISTS {
        ?anyparent prov:wasDerivedFrom ?lastparent
    }
    ?lastelement prov:wasDerivedFrom* ?someelement .
    FILTER NOT EXISTS {
        ?anyelement prov:wasDerivedFrom ?lastelement
    }
        
    FILTER (?addorremove IN (cs:addition,cs:removal) && ?narrower IN (skos:narrower, rdf:hasPart, skos:member)) .
}
ORDER BY ?element ?date DESC(?addorremove)`;        
    }
}

export interface TreeItemAttributes {
    element:JSONResponsePartUriString,
    type:JSONResponsePartUriString,
    label:JSONResponsePartLangString,
    hasChildren:JSONResponsePartBoolean,
    isModifier:JSONResponsePartBoolean,
    status?:JSONResponsePartString
}

export interface ProvTreeItemAttributes {
    element:JSONResponsePartUriString,
    date:JSONResponsePartDate,
    addorremove:JSONResponsePartUriString,
    parent:JSONResponsePartUriString
}

export interface ProvParentOperation {
    element:string,
    oldparent?:string,
    newparent?:string
}