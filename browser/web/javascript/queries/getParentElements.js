var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?element
WHERE {
	{
		SELECT ?element
		WHERE {
			SUBELEMENT a skos:Concept .
			?element a skos:Concept .
			?element skos:narrower SUBELEMENT .
		}
	}
	UNION
	{
		SELECT ?element
		WHERE {
			SUBELEMENT a skos:Concept . 
			?element a skos:Concept . 
			?element rdf:hasPart SUBELEMENT .
		}
	}
	UNION
	{
		SELECT ?element
		WHERE {
			SUBELEMENT a skos:Collection .
			?element a skos:Collection . 
			?element skos:member SUBELEMENT .
		}
	}
	UNION
	{
		SELECT ?element
		WHERE {
			?element a skos:Collection .
			SUBELEMENT a skos:Concept . 
			?element skos:member SUBELEMENT .
		}
	}
}    
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		var queryString = qs.replace(/SUBELEMENT/g, e );
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