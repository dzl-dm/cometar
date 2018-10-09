var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT distinct ?element
WHERE {
	[ cs:removal [ rdf:Statement [ 
		rdf:subject ?element; 
		rdf:predicate skos:notation; 
		rdf:object REMOVEDNOTATION 
		] ] ] .
} 
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(notation, callback, completeCallback)
	{
		var result;
		var queryString = qs.replace(/REMOVEDNOTATION/g, "\""+notation+"\"");
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result = r["element"].value });
			return result;
		}		
	}
});