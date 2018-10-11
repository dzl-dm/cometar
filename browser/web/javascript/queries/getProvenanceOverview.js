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
	filter (?enddate > ONEMONTHBEFORE)
}
order by DESC(?enddate )
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(callback, completeCallback)
	{
		var result = [];
		var dt = new Date(); dt.setMonth(dt.getMonth()-1);
		var queryString = qs.replace(/ONEMONTHBEFORE/g, "'"+dt.toISOString()+"'^^xsd:dateTime");
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