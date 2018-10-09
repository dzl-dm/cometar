var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?result
WHERE {
	CONSTRAINT
}  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(p,v)
	{
		var result;
		queryString = qs.replace(/CONSTRAINT/g, "?result " + p + " '" + v + "' . " );
		QueryManager.syncquery(queryString, function(r){ result = r["result"].value });
		return result;
	}
});