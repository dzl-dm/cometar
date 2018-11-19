var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?enddate ?action ?predicate ?object
WHERE {
	?commit a prov:Activity ;
		prov:endedAtTime ?enddate ;
		prov:qualifiedUsage [ ?action ?addorremove ] .
		?addorremove a rdf:Statement; 
			rdf:subject ?subject; 
			rdf:predicate ?predicate; 
			rdf:object ?object .
		FILTER NOT EXISTS { ?addorremove rdf:comment "hidden" . }
		FILTER (?subject IN (ELEMENTS) )
} 
ORDER BY DESC(SUBSTR(STR(?enddate),1,10)) DESC(?predicate) DESC(?enddate)    
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var previousConceptIdentifiers = QueryManager.getPreviousConceptIdentifiers(e);
		queryString = qs.replace(/ELEMENTS/g, previousConceptIdentifiers.join() );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result;
		}
	}
});