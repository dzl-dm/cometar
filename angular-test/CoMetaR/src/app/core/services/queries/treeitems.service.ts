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
    ) {  }

    private set = false;
    private provTreeItemAttributes$ = new ReplaySubject<ProvTreeItemAttributes[]>();
    private removedTreeItems:string[] = [];
    private addedTreeItems:string[] = [];

    public setProvTreeItemAttributes(from?:Date, until?:Date, commits?:string[]) {
        from = new Date("2018-01-08T10:15:22+01:00");
        until=until || new Date(Date.now());
        until.setHours(0);until.setSeconds(0);until.setMilliseconds(0);until.setMinutes(0); //else it refreshes endlessly
        const provItemsQueryString = this.getProvTreeItemsQueryString(from.toISOString(), until.toISOString(), commits);
        this.dataService.getData(provItemsQueryString).subscribe(this.provTreeItemAttributes$);
        this.provTreeItemAttributes$.subscribe(ptias => {
            ptias.forEach(ptia => {
                let provadditions = ptias.filter(ptia2 => ptia2.addorremove.value == "http://purl.org/vocab/changeset/schema#addition" && ptia2.element.value == ptia.element.value);
                let provremovals = ptias.filter(ptia2 => ptia2.addorremove.value == "http://purl.org/vocab/changeset/schema#removal" && ptia2.element.value == ptia.element.value);
                if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition" 
                    && provadditions.length > provremovals.length
                    && !this.addedTreeItems.includes(ptia.element.value)) this.addedTreeItems.push(ptia.element.value);
                else if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal" 
                    && provadditions.length < provremovals.length
                    && !this.removedTreeItems.includes(ptia.element.value)) this.removedTreeItems.push(ptia.element.value);
            });
            console.log(ptias.filter(ptia => 
            true//ptia.element.value == "http://data.dzl.de/ont/dwh#Schadstoffexposition" || ptia.element.value.indexOf("418715001")>-1
            ));
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
        
        return combineLatest(
            this.dataService.getData(currentTreeItemsQueryString),
            this.provTreeItemAttributes$
        ).pipe(
            map((data:[TreeItemAttributes[],ProvTreeItemAttributes[]]) => {
                if ( true || iri && iri.indexOf("substance")>-1){
                    data[0].map(d => d.element.value).forEach((subiri => {
                        if (this.addedTreeItems.includes(subiri)) return;
                        //moves
                        let provdata = data[1].filter(ptia => ptia.element.value == subiri);
                        let provadddata = provdata.filter(ptia => ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition");
                        let provremovedata = provdata.filter(ptia => ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal");
                        if (provadddata.length > 0 && provremovedata.length > 0) {
                            data[0].filter(tia => tia.element.value == subiri).forEach(tia => {
                                if (provadddata[0].parent.value == iri && provremovedata[provremovedata.length - 1].parent.value != iri) {
                                    tia.prov_movedFrom = {value:provremovedata[provremovedata.length - 1].parent.value}
                                }
                                else if (provremovedata[0].parent.value == iri && provadddata[0].parent.value != iri) {
                                    tia.prov_movedTo = {value:provadddata[0].parent.value}
                                }
                            })
                        }             
                    }))
                }
                //additions
                data[0].filter(tia => 
                    this.addedTreeItems.includes(tia.element.value)
                ).forEach(tia => tia.prov_added = {value:true})
                //removals
                data[1].filter(ptia => 
                    ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal" 
                    && ptia.parent.value == iri
                    && this.removedTreeItems.includes(ptia.element.value)
                ).forEach(ptia => {
                    if (data[0].map(tia => tia.element.value).includes(ptia.element.value)) return;
                    data[0].push({
                        element: ptia.element,
                        hasChildren: {value:false},
                        isModifier: {value:false},
                        label: {value:ptia.element.value,"xml:lang":'en'},
                        type: {value:"http://www.w3.org/2004/02/skos/core#Concept"},
                        prov_removed: {value:true}
                    })
                })  
                return data[0];
            })
        );
        //if(!from&&!commits) {
        //    return this.dataService.getData(currentTreeItemsQueryString)
        /*}
        const removedTreeItemsQueryString = this.getRemovedTreeItemsQueryString(iri,from.toISOString(),until.toISOString(),commits);
        const addedTreeItemsQueryString = this.getAddedTreeItemsQueryString(iri,from.toISOString(),until.toISOString(),commits);
        const movedTreeItemsQueryString = this.getMovedToTreeItemsQueryString(iri,from.toISOString(),until.toISOString(),commits);
        const provItemsQueryString = this.getProvTreeItemsQueryString(iri,from.toISOString(),until.toISOString(),commits);
        // if (iri && iri.indexOf("substance")>-1)this.dataService.getData(addedTreeItemsQueryString).subscribe(data => console.log(data));
        return combineLatest(
            this.dataService.getData(currentTreeItemsQueryString),
            this.dataService.getData(removedTreeItemsQueryString),
            this.dataService.getData(addedTreeItemsQueryString),
            this.dataService.getData(movedTreeItemsQueryString),
            this.dataService.getData(provItemsQueryString)
        ).pipe(
            map((data:[TreeItemAttributes[],RemovedTreeItemAttributes[],AddedTreeItemAttributes[],MovedTreeItemAttributes[],ProvTreeItemAttributes[]]) => { 
                //additions
                data[4].filter(ptia => ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition" && !ptia.otherparent).forEach(ptia => {
                    data[0].filter(tia => ptia.element && tia.element.value == ptia.element.value).forEach(tia => tia.prov_added = {value:true})
                });
                //moves
                if (iri && iri.indexOf("substance")>-1)console.log(data[4]);
                data[4].filter(ptia => ptia.otherparent != undefined).forEach(ptia => {
                    data[0].filter(tia => ptia.element && tia.element.value == ptia.element.value).forEach(tia => {
                        if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition") tia.prov_movedFrom = ptia.otherparent;
                        else tia.prov_movedTo = ptia.otherparent;
                    });
                });
                //removes
                data[4].filter(ptia => ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal" && !ptia.otherparent).forEach(ptia => {
                    if (data[0].map(tia => tia.element.value).includes(ptia.element.value)) return;
                    data[0].push({
                        element: ptia.element,
                        hasChildren: {value:true},
                        isModifier: {value:false},
                        label: {value:ptia.element.value,"xml:lang":'en'},
                        type: {value:"http://www.w3.org/2004/02/skos/core#Concept"},
                        prov_removed: {value:true}
                    })
                });
                /*data[2].forEach(atia => {
                    data[0].filter(tia => atia.element && tia.element.value == atia.element.value).forEach(tia => tia.prov_added = {value:true})
                });
                data[3].forEach(mtia => {
                    data[0].filter(tia => mtia.element && tia.element.value == mtia.element.value).forEach(tia => {
                        if (mtia.newparent.value == iri) tia.prov_movedFrom = mtia.oldparent;
                        else if (mtia.oldparent.value == iri) tia.prov_movedTo = mtia.newparent;
                    })
                });
                data[1].forEach(rtia => {
                    if (!rtia.element || data[0].map(tia => tia.element.value).includes(rtia.element.value)) return;
                    data[0].push({
                        element: rtia.element,
                        hasChildren: {value:true},
                        isModifier: {value:false},
                        label: rtia.label || {value:rtia.element.value,"xml:lang":'en'},
                        type: rtia.type || {value:"http://www.w3.org/2004/02/skos/core#Concept"},
                        prov_removed: {value:true}
                    })
                });
                return data[0]
            })
        )*/
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
ORDER BY DESC(?date)`;        
    }
}

export interface TreeItemAttributes {
    element:JSONResponsePartUriString,
    type:JSONResponsePartUriString,
    label:JSONResponsePartLangString,
    hasChildren:JSONResponsePartBoolean,
    isModifier:JSONResponsePartBoolean,
    status?:JSONResponsePartString,
    prov_movedFrom?:JSONResponsePartUriString,
    prov_movedTo?:JSONResponsePartUriString,
    prov_removed?:JSONResponsePartBoolean,
    prov_added?:JSONResponsePartBoolean
}

export interface ProvTreeItemAttributes {
    element:JSONResponsePartUriString,
    date:JSONResponsePartDate,
    addorremove:JSONResponsePartUriString,
    parent:JSONResponsePartUriString
}