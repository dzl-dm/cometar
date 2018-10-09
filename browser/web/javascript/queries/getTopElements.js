var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?element ?type ?label
WHERE {	
	{
		SELECT ?element ('concept' as ?type) ?label
		WHERE {
			?element a skos:Concept .
			?dzl :topLevelNode ?element .
			?element skos:prefLabel ?label FILTER (lang(?label)='en').
		}
	}
	UNION
	{
		SELECT ?element ('collection' as ?type) ?label
		WHERE {
			?element a skos:Collection .
			?dzl :topLevelNode ?element .
			?element skos:prefLabel ?label FILTER (lang(?label)='en').
		}
	}
	UNION
	{
		SELECT ?element ('concept' as ?type) ?label
		WHERE {
			?element a skos:Concept .
			?element skos:topConceptOf :Scheme .
			?element skos:prefLabel ?label FILTER (lang(?label)='en').
		}
	}
}    
ORDER BY ?label  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(callback, completeCallback)
	{
		var result = [];
		var queryString = qs;
		QueryManager.syncquery(queryString, function(r){ callback(r["element"].value) });		
	}
});