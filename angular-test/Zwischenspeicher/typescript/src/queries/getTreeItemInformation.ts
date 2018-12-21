import Query from "./Query";

export default (iri,callback:({label,hasChildren,isModifier,status})=>void):JQuery.jqXHR => {    
    let qs = `${Query.prefixes} 
    SELECT ?label ?type ?status (COUNT(?top)>0 as ?isModifier) (COUNT(?sub)>0 as ?hasChildren)
    WHERE
    {
        <${iri}> skos:prefLabel ?label FILTER (lang(?label)='en') .
        OPTIONAL { <${iri}> skos:narrower ?sub . }
        OPTIONAL { <${iri}> rdf:hasPart ?sub . }
        OPTIONAL { <${iri}> skos:member ?sub . }
        OPTIONAL { <${iri}> rdf:partOf ?top . }
        <${iri}> rdf:type ?type .
        OPTIONAL { <${iri}> :status ?status . }
    }
    GROUP BY ?label ?type ?status`;
    return Query.exec(qs,(r)=>callback({
        label:r.label.value,
        hasChildren:r.hasChildren.value=="true",
        isModifier:r.isModifier.value=="true",
        status:r.status?r.status.value:null
    }));
}
