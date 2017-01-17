var QueryManager = (function(){
	var endpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	//var endpoint = "http://localhost:3030/MinimalerDatensatz/query";
	
	var queries = {
		getTopConcepts: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?concept ?label ?notation ?subconcept (lang(?label) as ?lang) \
			WHERE { \
				?concept skos:prefLabel ?label ; \
				skos:topConceptOf ?scheme . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getSubConcepts: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept (lang(?label) as ?lang) \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> skos:narrower ?concept . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				OPTIONAL { ?concept rdf:hasPart ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getModifiers: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept (lang(?label) as ?lang) (true as ?isModifier) \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> rdf:hasPart ?concept . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				OPTIONAL { ?concept rdf:hasPart ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getAllModifiers: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept (lang(?label) as ?lang) (true as ?isModifier) \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> skos:broader* ?ppc . \
				?ppc rdf:hasPart ?concept . \
				OPTIONAL { ?concept skos:narrower* ?subconcept } . \
				OPTIONAL { ?concept rdf:hasPart* ?subconcept } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getConceptInfos: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX dc:		<http://purl.org/dc/elements/1.1/> \
			PREFIX : 		<http://data.dzl.de/ont/dwh#> \
			SELECT (<CONCEPT> as ?concept) ?label ?notation ?description ?unit (lang(?label) as ?lang) ?altlabel (lang(?altlabel) as ?altlang) \
			WHERE { \
				<CONCEPT> skos:prefLabel ?label. \
				OPTIONAL { <CONCEPT> skos:notation ?notation } . \
				OPTIONAL { <CONCEPT> dc:description ?description } . \
				OPTIONAL { <CONCEPT> skos:altLabel ?altlabel } . \
				OPTIONAL { <CONCEPT> :unit ?unit } . \
			}",
		getSearchBySubstring: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX dc:	<http://purl.org/dc/elements/1.1/> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?concept ?label ?notation (lang(?label) as ?lang) (lang(?altlabel) as ?altlang) ?altlabel ?description ?unit \
			WHERE { \
				?concept skos:prefLabel ?label . \
				OPTIONAL { ?concept skos:notation ?notation } . \
				OPTIONAL { ?concept dc:description ?description } . \
				OPTIONAL { ?concept :unit ?unit } . \
				OPTIONAL { ?concept skos:prefLabel ?altlabel . \
					FILTER (lang(?altlabel) != 'en') } . \
				FILTER ((regex(?label, 'EXPRESSION', 'i') \
					|| regex(?altlabel, 'EXPRESSION', 'i') \
					|| regex(?notation, 'EXPRESSION', 'i') \
					|| regex(?description, 'EXPRESSION', 'i') \
					|| regex(?unit, 'EXPRESSION', 'i') ) \
					&& (lang(?label) = 'en') ) . \
			} \
			ORDER BY ASC(lcase(?label))",
		getParentConcept: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?parentconcept ?parentlabel \
			WHERE { \
				?parentconcept skos:prefLabel ?parentlabel . \
				{ ?parentconcept skos:narrower <CONCEPT> } \
				UNION { ?parentconcept rdf:hasPart <CONCEPT> } \
				FILTER (lang(?parentlabel) = 'en') . \
			}",
		getConceptUrlByNotation: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?concept \
			WHERE { \
				?concept skos:notation 'NOTATION' . \
			}",
		getLabelByConceptUrl: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?label \
			WHERE { \
				<CONCEPT> skos:prefLabel ?label \
				FILTER (lang(?label) = 'en'). \
			}",
		getNotationByConceptUrl: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			SELECT ?notation \
			WHERE { \
				<CONCEPT> skos:notation ?notation . \
			}",
	}

	var fusekiQueryGetTreeElements = function(queryString, requestCallback, requestCompleteCallback)
	{
		$.ajax({
			url: endpoint + "?query=" + encodeURIComponent(queryString),
			dataType: "json",
			async: false,
			success: function(json){
				queryCallback(json, requestCallback);
			},
			complete: function(j, k)
			{
				if (requestCompleteCallback != undefined) requestCompleteCallback(j, k);
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