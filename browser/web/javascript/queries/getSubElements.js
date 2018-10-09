var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?element
WHERE {
	{
		SELECT ?element
		WHERE {
			TOPELEMENT a skos:Concept .
			?element a skos:Concept .
			TOPELEMENT skos:narrower ?element .
			?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
		}
		ORDER BY ?label
	}
	UNION
	{
		SELECT ?element
		WHERE {
			TOPELEMENT a skos:Concept . 
			?element a skos:Concept . 
			TOPELEMENT rdf:hasPart ?element .
			?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
		}
		ORDER BY ?label
	}
	UNION
	{
		SELECT ?element
		WHERE {
			TOPELEMENT a skos:Collection .
			?element a skos:Concept . 
			TOPELEMENT skos:member ?element .
			?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
		}
		ORDER BY ?label
	}
	UNION
	{
		SELECT ?element
		WHERE {
			TOPELEMENT a skos:Collection .
			?element a skos:Collection . 
			TOPELEMENT skos:member ?element .
			?element skos:prefLabel ?label FILTER (lang(?label) = 'en') .
		}
		ORDER BY ?label
	}
}      
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		queryString = qs.replace(/TOPELEMENT/g, "<" + e + ">" );
		QueryManager.syncquery(queryString, function(r){ callback(r["element"].value) });	
	}
});