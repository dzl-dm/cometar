var QueryManager = (function(){
	//var endpoint = "http://gbn.data.dzl.de/fuseki/MinimalerDatensatz/query";
	var endpoint = "http://localhost:3030/MinimalerDatensatz/query";
	
	var queries = {
		getTopConcepts: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?concept ?label ?notation ?subconcept \
			WHERE { \
				?concept skos:prefLabel ?label ; \
				skos:topConceptOf ?scheme . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			}",
		getSubConcepts: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> skos:narrower ?concept . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			}",
		getConceptInfos: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT (<CONCEPT> as ?concept) ?label ?notation (lang(?label) as ?lang) \
			WHERE { \
				<CONCEPT> skos:prefLabel ?label. \
				OPTIONAL { <CONCEPT> skos:notation ?notation } . \
			}"
	}

	var fusekiQueryGetTreeElements = function(queryString, requestCallback)
	{
		$.ajax({
			url: endpoint + "?query=" + encodeURIComponent(queryString),
			dataType: "json",
			async: false,
			success: function(json){
				queryCallback(json, requestCallback);
			}
		});
	}

	var queryCallback = function(json, requestCallback)
	{
		$.each(json.results.bindings, function(i, item) {
			requestCallback(item);
		});
	}
	
	return {
		query: fusekiQueryGetTreeElements,
		queries: queries
	}
}());