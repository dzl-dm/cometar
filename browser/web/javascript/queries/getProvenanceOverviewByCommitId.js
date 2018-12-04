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
	filter (substr(str(?commit), 35) IN (COMMITS))
}
order by DESC(?enddate )
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(commits, callback, completeCallback)
	{
		var result = [];
		var commits = commits.split(",").join("','");
		var queryString = qs.replace(/COMMITS/g, "'"+commits+"'");
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