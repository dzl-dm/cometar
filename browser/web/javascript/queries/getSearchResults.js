var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?concept ?label ?notation ?oldnotation (lang(?label) as ?lang) (lang(?altlabel) as ?altlang) ?altlabel ?description ?unit ?label2 (lang(?label2) as ?lang2) ?status ?creator 
WHERE { 
	?concept skos:prefLabel ?label . 
	OPTIONAL { ?concept skos:prefLabel ?label2 . FILTER (!(lang(?label2) = 'en')) } . 
	OPTIONAL { ?concept skos:notation ?notation } .
	OPTIONAL { 
		?concept prov:wasDerivedFrom+ ?oldconcept .
		?cs a cs:ChangeSet ;
			cs:removal [
				a rdf:Statement;
				rdf:subject ?oldconcept;
				rdf:predicate skos:notation;
				rdf:object ?oldnotation
			] .
	} . 	
	OPTIONAL { ?concept dc:description ?description } . 
	OPTIONAL { ?concept :unit ?unit } . 
	OPTIONAL { ?concept skos:altLabel ?altlabel } . 
	OPTIONAL { ?concept :status ?status } . 
	OPTIONAL { ?concept dc:creator ?creator } . 
	OPTIONAL { 
		?concept prov:wasDerivedFrom* [ skos:notation ?oldnotation ] 
	} . 
	FILTER ((regex(?label, 'EXPRESSION', 'i') 
		|| regex(?label2, 'EXPRESSION', 'i') 
		|| regex(?altlabel, 'EXPRESSION', 'i') 
		|| regex(?notation, 'EXPRESSION', 'i') 
		|| regex(?oldnotation, 'EXPRESSION', 'i') 
		|| regex(?description, 'EXPRESSION', 'i') 
		|| regex(?unit, 'EXPRESSION', 'i') 
		|| regex(?status, 'EXPRESSION', 'i') 
		|| regex(?creator, 'EXPRESSION', 'i') ) 
		&& (lang(?label) = 'en')
		&& (?notation != ?oldnotation)) . 
} 
ORDER BY ASC(lcase(?label))  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback)
	{
		queryString = qs.replace(/EXPRESSION/g, e );
		QueryManager.syncquery(queryString, callback);	
	}
});