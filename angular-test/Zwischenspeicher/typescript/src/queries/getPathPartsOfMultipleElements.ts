import Query from "./Query";

export default (iris,callback):JQuery.jqXHR => {  
    let qs = `${Query.prefixes} 
    SELECT DISTINCT ?a
    WHERE
    {
        ?element skos:broader* [ rdf:partOf* [ skos:broader* ?c ] ] .
        ?a skos:member* ?c .
        ?a rdf:type ?type FILTER (?type IN (skos:Concept, skos:Collection)) .
        filter (?a != ?element && ?element IN (${iris.map(e => `<${e}>`).join(',')}))
    }`;
    return Query.exec(qs,(r)=>callback(r.a.value));
}
