var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?commit ?author ?message ?enddate
WHERE
{
	?commit a prov:Activity ;
		prov:wasAssociatedWith ?author ;
		prov:endedAtTime ?enddate ;
		prov:label ?message ;
	.	
	filter (?enddate >= FROMDATE && ?enddate <= UNTILDATE)
}
order by DESC(?enddate )
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(fromDate, untilDate, callback, completeCallback)
	{
		var result = [];
		var queryString = qs.replace(/FROMDATE/g, "'"+fromDate.toISOString()+"'^^xsd:dateTime").replace(/UNTILDATE/g, "'"+untilDate.toISOString()+"'^^xsd:dateTime");
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