var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT (count(distinct ?concept) as ?concepts) (count(?modifier) as ?modifiers)
WHERE {
	ELEMENT skos:member* [ skos:narrower* ?concept ] .	
	OPTIONAL { 
		?concept rdf:hasPart [ skos:narrower* ?modifier ] .
	}
}  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		queryString = qs.replace(/ELEMENT/g, "<" + e + ">" );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r) });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result = r });
			return result;
		}	
	}
});