var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?a
WHERE {
	ELEMENT prov:wasDerivedFrom* ?a
}      
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e)
	{
		var result = [];
		queryString = qs.replace(/ELEMENT/g, "<" + e + ">" );	
		QueryManager.syncquery(queryString, function(r){
			result.push("<"+r["a"].value+">");
		});	
		return result;
	}
});