var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?modifier 
WHERE { 
	CONCEPT skos:broader* ?c . 
	?c rdf:hasPart ?m . 
	?m skos:narrower* ?modifier . 
}   
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		queryString = qs.replace(/CONCEPT/g, "<" + e + ">" );
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { callback(r["modifier"].value) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r["modifier"].value) });
			return result;
		}		
	}
});