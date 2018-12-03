var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?a
WHERE {
	ELEMENT prov:wasDerivedFrom* ?a
}      
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		
		var result = [];
		queryString = qs.replace(/ELEMENT/g, "<" + e + ">" );	
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { callback("<"+r["a"].value+">") }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push("<"+r["a"].value+">") });
			return result;
		}	
	}
});