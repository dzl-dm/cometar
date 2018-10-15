var QueryManager = (function(){
	var endpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	var loglevel = 0; //0 = off, 1 = less detailed, 2 = more detailed
	
	var useLocalFuseki = function()
	{
		endpoint = "http://localhost:3030/cometar_live/query";
	}
	
	var queriesReturnObject = {};
	
	function loadQuery(queryName){
		var deferred = $.Deferred();
		var url = "javascript/queries/"+queryName+".js";
		var onload = function(){
			queriesReturnObject[queryName] = Query(prefixes);			
		}
		var script = document.createElement("script")
		script.type = "text/javascript";

		if (script.readyState){  //IE
			script.onreadystatechange = function(){
				if (script.readyState == "loaded" ||
						script.readyState == "complete"){
					script.onreadystatechange = null;
					onload();
					deferred.resolve();
				}
			};
		} else {  //Others
			script.onload = function(){
				onload();
				deferred.resolve();
			};
		}
		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
		return deferred.promise();
	}
	
	var init = function(){
		return $.Deferred(function( dfd ) {
			$.when(
				loadQuery("getNotes"),
				loadQuery("getPreviousConceptIdentifiers"),
				loadQuery("getProvenanceOverview"),
				loadQuery("getProvenanceDetails"),
				loadQuery("getPathParts"),
				loadQuery("getTopElements"),
				loadQuery("getSubElements"),
				loadQuery("getParentElements"),
				loadQuery("getModifiers"),
				loadQuery("getProperty"),
				loadQuery("getMultiProperties"),
				loadQuery("getByProperty"),
				loadQuery("getSearchResults"),
				loadQuery("getStartPageOverview"),
				loadQuery("getElementByRemovedNotation"),
				loadQuery("getPreviousMessagesOfInvalidCommits"),
				loadQuery("getTotalNumberOfSubConcepts"),
				loadQuery("getNewNotationByDeprecatedNotation"),
				loadQuery("getPathPartsOfMultipleElements"),
				loadQuery("getSiteCoverageByConceptUrl")
			).done(dfd.resolve);
		}).promise();
	}	
	
	var syncquery = function(queryString, requestCallback, requestCompleteCallback)
	{
		query(queryString, requestCallback, requestCompleteCallback, true);
	}

	var query = function(queryString, requestCallback, requestCompleteCallback, sync)
	{
		Helper.startLoading();
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
				Helper.stopLoading();
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
PREFIX prov: 	<http://www.w3.org/ns/prov#>
PREFIX cs:		<http://purl.org/vocab/changeset/schema#>
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return $.extend(queriesReturnObject,{
		init: init,
		query: query,
		syncquery: syncquery,
		useLocalFuseki: useLocalFuseki
	})
}());