var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?enlabel (GROUP_CONCAT(DISTINCT ?code; SEPARATOR=", ") AS ?codes) (GROUP_CONCAT(DISTINCT ?unit; SEPARATOR=", ") AS ?units)
WHERE {
	ELEMENT skos:prefLabel ?enlabel FILTER (lang(?enlabel)='en') .
	OPTIONAL { ELEMENT skos:notation ?code } .
	OPTIONAL { ELEMENT :unit ?unit } .
}   
GROUP BY ?enlabel
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		var queryString = qs.replace(/ELEMENT/g, "<"+e+">" );
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result;
		}		
	}
});