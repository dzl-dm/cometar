var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?element (SUBSTR(STR(?tempdate),1,10) as ?timestamp) ?author ?label ?predicate
WHERE { 
	?commit prov:qualifiedUsage [ 
			?addororem [ rdf:Statement [ 
				rdf:subject ?element;
				rdf:predicate ?predicate
			] ]
		] ;
		prov:endedAtTime ?tempdate ;
		prov:wasAssociatedWith ?author .
	?element skos:prefLabel ?label FILTER (lang(?label)='en') .
	FILTER (?tempdate > ONEMONTHBEFORE )
}   
ORDER BY DESC(?tempdate)
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