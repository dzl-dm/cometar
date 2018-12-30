import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartBoolean, JSONResponsePartLangString, JSONResponsePartUriString, JSONResponsePartString, prefixes } from '../data.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TreeItemsService {
  constructor(private dataService: DataService) { }

    /**
     * 
     * @param {enum} options.range ["top", "sub"] get top elements or subelements of iri
     * @param {string} options.iri
     */
    public get(options):Observable<TreeItemAttributes[]> {
        let {range, iri} = options;
        const queryString = this.getQueryString(iri);
        return this.dataService.getData(queryString).pipe(map(data=> { return <TreeItemAttributes[]> data }))
    };

    private getQueryString(iri?):string {
        return `
        ${prefixes}
        SELECT ?element ?type ?label (COUNT(?sub)>0 as ?hasChildren) (COUNT(?top)>0 as ?isModifier) ?status
        WHERE {	          
            ${iri?this.getSubElementsFilter(iri):this.getTopElementsFilter()}
            ?element skos:prefLabel ?label FILTER (lang(?label)='en').
            OPTIONAL { ?element skos:narrower ?sub . }
            OPTIONAL { ?element rdf:hasPart ?sub . }
            OPTIONAL { ?element skos:member ?sub . }
            OPTIONAL { ?element rdf:partOf ?top . }
            ?element rdf:type ?type .
            OPTIONAL { ?element :status ?status . }
        } 
        GROUP BY ?element ?label ?type ?status  
        HAVING bound(?element)
        ORDER BY ?label`;
    }
    private getSubElementsFilter(iri):string{
        return `
        { 
            SELECT ?element 
            WHERE { <${iri}> skos:narrower ?element . } 
        }
        UNION 
        { 
            SELECT ?element 
            WHERE { <${iri}> rdf:hasPart ?element . } 
        }
        UNION 
        {
            SELECT ?element 
            WHERE { <${iri}> skos:member ?element . } 
        } `
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
}

export interface TreeItemAttributes {
  element:JSONResponsePartUriString,
  type:JSONResponsePartUriString,
  label:JSONResponsePartLangString,
  hasChildren:JSONResponsePartBoolean,
  isModifier:JSONResponsePartBoolean,
  status:JSONResponsePartString
}
