import Query from "./Query";

export default (callback):JQuery.jqXHR => {    
    let qs = `${Query.prefixes} 
    SELECT ?element ?type ?label
    WHERE {	
        {
            SELECT ?element ('concept' as ?type) ?label
            WHERE {
                ?element a skos:Concept .
                ?dzl :topLevelNode ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label)='en').
            }
        }
        UNION
        {
            SELECT ?element ('collection' as ?type) ?label
            WHERE {
                ?element a skos:Collection .
                ?dzl :topLevelNode ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label)='en').
            }
        }
        UNION
        {
            SELECT ?element ('concept' as ?type) ?label
            WHERE {
                ?element a skos:Concept .
                ?element skos:topConceptOf :Scheme .
                ?element skos:prefLabel ?label FILTER (lang(?label)='en').
            }
        }
    }    
    ORDER BY ?label`;
    return Query.exec(qs,(r)=>callback(r.element.value));
}
