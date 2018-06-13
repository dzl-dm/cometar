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
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept (lang(?label) as ?lang) ?status \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> skos:narrower ?concept . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				OPTIONAL { ?concept rdf:hasPart ?subconcept } . \
				OPTIONAL { ?concept :status ?status } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getModifiers: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?concept ?label ?notation (<PARENTCONCEPT> as ?parentconcept) ?subconcept (lang(?label) as ?lang) (true as ?isModifier) ?status \
			WHERE { \
				?concept skos:prefLabel ?label. \
				<PARENTCONCEPT> rdf:hasPart ?concept . \
				OPTIONAL { ?concept skos:narrower ?subconcept } . \
				OPTIONAL { ?concept rdf:hasPart ?subconcept } . \
				OPTIONAL { ?concept :status ?status } . \
				FILTER (lang(?label) = 'en') \
			} \
			ORDER BY ASC(lcase(?label))",
		getAllModifiers: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?subconcept \
			WHERE { \
				<PARENTCONCEPT> skos:broader* ?ppc . \
				?ppc rdf:hasPart ?concept . \
				?concept skos:narrower* ?subconcept . \
			} \
			ORDER BY ASC(lcase(?label))",	
		getConceptInfos: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX dc:		<http://purl.org/dc/elements/1.1/> \
			PREFIX : 		<http://data.dzl.de/ont/dwh#> \
			PREFIX dwh:		<http://sekmi.de/histream/dwh#> \
			SELECT (<CONCEPT> as ?concept) ?label ?notation ?description ?unit (lang(?label) as ?lang) ?altlabel (lang(?altlabel) as ?altlang) ?status ?creator ?domain \
			WHERE { \
				<CONCEPT> skos:prefLabel ?label. \
				OPTIONAL { <CONCEPT> skos:notation ?notation } . \
				OPTIONAL { <CONCEPT> dc:description ?description } . \
				OPTIONAL { <CONCEPT> skos:altLabel ?altlabel } . \
				OPTIONAL { <CONCEPT> :unit ?unit } . \
				OPTIONAL { <CONCEPT> :status ?status } . \
				OPTIONAL { <CONCEPT> dc:creator ?creator } . \
				OPTIONAL { <CONCEPT> dwh:restriction ?domain } . \
			}",
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
		getParentConcepts: "\
			PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
			PREFIX : <http://data.dzl.de/ont/dwh#> \
			PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			SELECT ?parentconcept ?parentlabel \
			WHERE { \
				?parentconcept skos:prefLabel ?parentlabel . \
				{ ?parentconcept skos:narrower* <CONCEPT> } \
				UNION { ?parentconcept rdf:hasPart* <CONCEPT> } \
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
	

	for (var i of ["getTopElements", "getSubElements", "getSearchResults", "getParentElements", "getProperty", "getIsModifierOf"]) 
	{
		$.ajax({
			url: 'queries/'+i+'.query',
			dataType: "text",
			async: false,
			success: function(t){
				queries[i] = t;
			}
		});
	}
	
	var getTopElements = function(callback)
	{
		queryString = queries["getTopElements"];
		syncquery(queryString, function(r){ callback(r["element"].value) });		
	}
	
	var getSubElements = function(e, callback)
	{
		queryString = queries["getSubElements"].replace(/TOPELEMENT/g, "<" + e + ">" );
		syncquery(queryString, function(r){ callback(r["element"].value) });
	}
	
	var getParentElements = function(e, callback)
	{
		queryString = queries["getParentElements"].replace(/TOPELEMENT/g, "<" + e + ">" );
		syncquery(queryString, function(r){ callback(r["element"].value) });
	}
	
	var getProperty = function(e, p, filter)
	{
		var result;
		queryString = queries["getProperty"].replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?property . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		syncquery(queryString, function(r){ result = r["property"].value });
		return result;
	}
	
	var getIsModifierOf = function(e)
	{
		var result;
		queryString = queries["getIsModifierOf"].replace(/MODIFIER/g, "<" + e + ">" );
		syncquery(queryString, function(r){ result = r["concept"].value });
		return result;
	}
	
	var getSearchResults = function(e, callback)
	{
		queryString = queries["getSearchResults"].replace(/EXPRESSION/g, e );
		syncquery(queryString, callback);		
	}
		
	var syncquery = function(queryString, requestCallback, requestCompleteCallback)
	{
		query(queryString, requestCallback, requestCompleteCallback, true)
	}

	var query = function(queryString, requestCallback, requestCompleteCallback, sync)
	{
		async = sync == undefined;
		var rcc = requestCompleteCallback != undefined;
		$.ajax({
			url: endpoint + "?query=" + encodeURIComponent(queryString),
			dataType: "json",
			async: async,
			success: function(json){
				queryCallback(json, requestCallback);
			},
			complete: function(j, k)
			{
				if (rcc) requestCompleteCallback(j, k);
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
		query: query,
		syncquery: syncquery,
		queries: queries,
		getProperty: getProperty,
		getTopElements: getTopElements,
		getSubElements: getSubElements,
		getSearchResults: getSearchResults,
		getIsModifierOf: getIsModifierOf
	}
}());