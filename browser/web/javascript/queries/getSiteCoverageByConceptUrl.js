var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT distinct ?r
WHERE {
	?site :uses CONCEPT ;
		prov:label ?r .
}   
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(concepturl, callback, completeCallback)
	{
		var result = [];
		var queryString = qs.replace(/CONCEPT/g, "<" + concepturl + ">" );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r["r"].value) });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r["r"].value) });
			return result;
		}		
	}
});