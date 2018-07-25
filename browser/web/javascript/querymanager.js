var QueryManager = (function(){
	var endpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	var loglevel = 0; //0 = off, 1 = less detailed, 2 = more detailed
	
	var queries = [];
	
	var useLocalFuseki = function()
	{
		endpoint = "http://localhost:3030/cometar_live/query";
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
		queryString = queries["getParentElements"].replace(/SUBELEMENT/g, "<" + e + ">" );
		syncquery(queryString, function(r){ callback(r["element"].value) });
	}
	
	var getAncestors = function(e, callback)
	{
		getParentElements(e, function(pe){
			callback(pe);
			getAncestors(pe, callback);
		});
	}
	
	var getModifiers = function(e, callback)
	{
		var result = [];
		queryString = queries["getModifiers"].replace(/CONCEPT/g, "<" + e + ">" );
		if (callback != undefined)
		{
			query(queryString, function(r) { callback(r["modifier"].value) });
		}
		else 
		{
			syncquery(queryString, function(r){ result.push(r["modifier"].value) });
			return result;
		}
	}
	
	var getNotes = function(e, callback, completeCallback)
	{
		var result = [];
		queryString = queries["getNotes"].replace(/ELEMENT/g, "<" + e + ">" );
		if (callback != undefined)
		{
			query(queryString, function(r) { callback(r) }, function() { completeCallback() });
		}
		else 
		{
			syncquery(queryString, function(r){ result.push(r) });
			return result;
		}
	}
	
	var getNewNotation = function(notation)
	{
		var result;
		queryString = queries["getNewNotation"].replace(/OLDNOTATION/g, "\""+notation+"\"" );
		syncquery(queryString, function(r){ result = r["newnotation"].value });
		return result;
	}
	
	var getProperty = function(e, p, foc1, foc2)
	{
		var result = [];
		var filter = "";
		var callback;
		if (foc1 != undefined) {
			if (typeof foc1 == "string") filter = foc1;
			else if (typeof foc1 == "function") callback = foc1;
		}
		if (foc2 != undefined) {
			if (typeof foc2 == "string") filter = foc2;
			else if (typeof foc2 == "function") callback = foc2;
		}
		queryString = queries["getGeneric"].replace(/VARIABLES/, "?result").replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?result . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		if (callback != undefined)
		{
			query(queryString, function(r) { callback(r["result"]) });
		}
		else 
		{
			syncquery(queryString, function(r){ result.push(r["result"]) });
			if (result.length == 1) return result[0];
			return result;
		}
	}
	/*var getProperties = function(e, p, filter)
	{
		var result = [];
		queryString = queries["getGeneric"].replace(/VARIABLES/, "?result").replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?result . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		syncquery(queryString, function(r){ result.push(r["result"]) });
		return result;
	}	*/
	var getMultiProperties = function(e, p, callback)
	{
		var result = [];
		var variables = "";
		var constraints = "";
		for (var i in p)
		{
			variables += " ?r" + i;
			constraints += "OPTIONAL { <" + e + ">" + " " + p[i] + " ?r" + i + " } . ";
		}
		queryString = queries["getGeneric"].replace(/VARIABLES/, variables).replace(/CONSTRAINT/g, constraints);
		if (callback != undefined)
		{
			query(queryString, function(r) { if(!jQuery.isEmptyObject(r)) callback(r) });
		}
		else 
		{
			syncquery(queryString, function(r){ result.push(r) });
			return result;
		}
	}
	
	var getByProperty = function(p,v)
	{
		var result;
		queryString = queries["getGeneric"].replace(/VARIABLES/, "?result").replace(/CONSTRAINT/g, "?result " + p + " '" + v + "' . " );
		syncquery(queryString, function(r){ result = r["result"].value });
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
		query(queryString, requestCallback, requestCompleteCallback, true);
	}

	var query = function(queryString, requestCallback, requestCompleteCallback, sync)
	{
		if (loglevel > 0) {
			var c = arguments.callee.caller;
			if (c.name == "syncquery") c = c.caller;
			var s = c.name;
			for (var i = 0; i < c.arguments.length; i++) s+= ", " + c.arguments[i];
			console.log("start " + s);
		}
		async = sync == undefined;
		var rcc = requestCompleteCallback != undefined;
		$.ajax({
			url: endpoint + "?query=" + encodeURIComponent(queryString),
			dataType: "json",
			async: async,
			success: function(json){
				queryCallback(json, requestCallback);
				if (loglevel > 0) {
					console.log("result " + s);
					console.log(json.results.bindings);
				}
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
	
	var prefixes = (function () {/*
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>  
PREFIX snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/>
PREFIX xsd:	<http://www.w3.org/2001/XMLSchema#>
PREFIX dwh:    <http://sekmi.de/histream/dwh#>
PREFIX loinc: <http://loinc.org/owl#>
PREFIX rdfs:	<http://www.w3.org/2000/01/rdf-schema#> 
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	queries = {
		getTopElements: prefixes + (function () {/*
SELECT ?element ?type
WHERE {
	{
		SELECT ?element ('concept' as ?type)
		WHERE {
			?element a skos:Concept .
			?element skos:topConceptOf ?scheme .
			?element skos:prefLabel ?label FILTER (lang(?label)='en').
		}
		ORDER BY ?label
	}
	UNION
	{
		SELECT (:root as ?element) ('collection' as ?type)
		WHERE {}
	}
}      
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getSubElements: prefixes + (function () {/*
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
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getSearchResults: prefixes + (function () {/*
SELECT ?concept ?label ?notation (lang(?label) as ?lang) (lang(?altlabel) as ?altlang) ?altlabel ?description ?unit ?label2 (lang(?label2) as ?lang2) ?status ?creator 
WHERE { 
	?concept skos:prefLabel ?label . 
	OPTIONAL { ?concept skos:prefLabel ?label2 . FILTER (!(lang(?label2) = 'en')) } . 
	OPTIONAL { ?concept skos:notation ?notation } . 
	OPTIONAL { ?concept dc:description ?description } . 
	OPTIONAL { ?concept :unit ?unit } . 
	OPTIONAL { ?concept skos:altLabel ?altlabel } . 
	OPTIONAL { ?concept :status ?status } . 
	OPTIONAL { ?concept dc:creator ?creator } . 
	FILTER ((regex(?label, 'EXPRESSION', 'i') 
		|| regex(?label2, 'EXPRESSION', 'i') 
		|| regex(?altlabel, 'EXPRESSION', 'i') 
		|| regex(?notation, 'EXPRESSION', 'i') 
		|| regex(?description, 'EXPRESSION', 'i') 
		|| regex(?unit, 'EXPRESSION', 'i') 
		|| regex(?status, 'EXPRESSION', 'i') 
		|| regex(?creator, 'EXPRESSION', 'i') ) 
		&& (lang(?label) = 'en')) . 
} 
ORDER BY ASC(lcase(?label))      
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getParentElements: prefixes + (function () {/*
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
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getGeneric: prefixes + (function () {/*
SELECT VARIABLES
WHERE {
	CONSTRAINT
}       
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getIsModifierOf: prefixes + (function () {/*
SELECT ?concept
WHERE {
	?concept rdf:hasPart [ skos:narrower* MODIFIER ] .
}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getNewNotation: prefixes + (function () {/*
SELECT ?newnotation
WHERE {
	{
		SELECT ?newnotation
		WHERE {
			?concept skos:changeNote ?note .
			?note owl:onProperty skos:notation .
			?note rdf:value ?value .
			?value :minus OLDNOTATION ;
				:plus ?newnotation .
		}
	}
	UNION
	{
		SELECT ?newnotation
		WHERE {
			?concept skos:changeNote ?note ;
				skos:notation ?newnotation .
			?note owl:onProperty skos:notation .
			?note rdf:value ?value .
			?value :minus OLDNOTATION .
		}
	}
}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getNotes: prefixes + (function () {/*
SELECT ?note ?date ?author ?value ?property ?action ?minus (lang(?minus) as ?minuslang) ?plus (lang(?plus) as ?pluslang) ?reason
WHERE {
	ELEMENT skos:changeNote ?note .
	OPTIONAL { ?note dc:date ?date ;
		dc:creator ?b ;
		rdf:value ?value ;
		owl:onProperty ?property ;
		:action ?action .
		OPTIONAL { ?value :minus ?minus }
		OPTIONAL { ?value :plus ?plus }
		OPTIONAL { ?value :reason ?reason }
		?b foaf:name ?author . } 
} 
ORDER BY DESC(?date) DESC(?author) DESC(?property) DESC(?action)     
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
		getModifiers: prefixes + (function () {/*
SELECT ?modifier 
WHERE { 
	CONCEPT skos:broader* ?c . 
	?c rdf:hasPart ?m . 
	?m skos:narrower* ?modifier . 
}        
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
	};	
	
	return {
		query: query,
		queries: queries,
		syncquery: syncquery,
		getProperty: getProperty,
		getTopElements: getTopElements,
		getSubElements: getSubElements,
		getSearchResults: getSearchResults,
		getIsModifierOf: getIsModifierOf,
		getNotes: getNotes,
		getModifiers: getModifiers,
		getMultiProperties: getMultiProperties,
		getByProperty: getByProperty,
		getAncestors: getAncestors,
		useLocalFuseki: useLocalFuseki,
		getNewNotation: getNewNotation
	}
}());