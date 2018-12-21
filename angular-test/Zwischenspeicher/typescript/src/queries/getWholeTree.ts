import Query from "./Query";

export default (callback:({element,subelement})=>void):JQuery.jqXHR => {    
    let qs = `${Query.prefixes} 
    SELECT DISTINCT ?element ?subelement
    WHERE {
        { ?element skos:member ?subelement }
        UNION { ?element skos:narrower ?subelement }
        UNION { ?element rdf:hasPart ?subelement }
        ?element skos:prefLabel ?l1 .
        ?subelement skos:prefLabel ?l2 .
        FILTER (bound(?element) && bound(?subelement) && lang(?l1)='en' && lang(?l2)='en')
        bind (EXISTS{?element rdf:hasPart ?subelement} AS ?modifier)
    }
    ORDER BY ?modifier ?l1 ?l2`;
    return Query.exec(qs,(r)=> callback({
        element: r.element.value,
        subelement: r.subelement.value
    }));
}
