import Query from "./Query";

export default (iri,callback):JQuery.jqXHR => {    
    let qs = `${Query.prefixes} 
    SELECT ?element
    WHERE {
        {
            SELECT ?element
            WHERE {
                <${iri}> a skos:Concept .
                ?element a skos:Concept .
                <${iri}> skos:narrower ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
            }
            ORDER BY ?label
        }
        UNION
        {
            SELECT ?element
            WHERE {
                <${iri}> a skos:Concept . 
                ?element a skos:Concept . 
                <${iri}> rdf:hasPart ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
            }
            ORDER BY ?label
        }
        UNION
        {
            SELECT ?element
            WHERE {
                <${iri}> a skos:Collection .
                ?element a skos:Concept . 
                <${iri}> skos:member ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
            }
            ORDER BY ?label
        }
        UNION
        {
            SELECT ?element
            WHERE {
                <${iri}> a skos:Collection .
                ?element a skos:Collection . 
                <${iri}> skos:member ?element .
                ?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
            }
            ORDER BY ?label
        }
    }`;
    return Query.exec(qs,(r)=>callback(r.element.value));
}
