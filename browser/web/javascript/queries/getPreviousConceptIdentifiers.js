var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?a
WHERE {
	ELEMENT prov:wasDerivedFrom ?a
}      
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, previousConceptIdentifiers)
	{
		var result = [];
		if (previousConceptIdentifiers.indexOf("<"+e+">") == -1) 
		{
			previousConceptIdentifiers.push("<"+e+">");
			queryString = qs.replace(/ELEMENT/g, "<" + e + ">" );
			QueryManager.syncquery(queryString, function(r){
				QueryManager.getPreviousConceptIdentifiers(r["a"].value, previousConceptIdentifiers);
			});
		}		
	}
});