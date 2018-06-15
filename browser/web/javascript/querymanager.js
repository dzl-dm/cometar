var QueryManager = (function(){
	var endpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	//var endpoint = "http://localhost:3030/MinimalerDatensatz/query";

	var queries = [];
	for (var i of ["getTopElements", "getSubElements", "getSearchResults", "getParentElements", "getGeneric", "getIsModifierOf", "getNote", "getModifiers"]) 
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
	
	var getModifiers = function(e, callback)
	{
		var result = [];
		queryString = queries["getModifiers"].replace(/CONCEPT/g, "<" + e + ">" );
		syncquery(queryString, function(r){ result.push(r["modifier"].value) });
		return result;
	}
	
	var getNote = function(e)
	{
		var result;
		queryString = queries["getNote"].replace(/ELEMENT/g, "<" + e + ">" );
		syncquery(queryString, function(r){ result = r });
		return result;
	}
	
	var getProperty = function(e, p, filter)
	{
		var result;
		queryString = queries["getGeneric"].replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?result . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		syncquery(queryString, function(r){ result = r["result"].value });
		return result;
	}
	var getProperties = function(e, p, filter)
	{
		var result = [];
		queryString = queries["getGeneric"].replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?result . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		syncquery(queryString, function(r){ result.push(r["result"]) });
		return result;
	}	
	
	var getByProperty = function(p,v)
	{
		var result;
		queryString = queries["getGeneric"].replace(/CONSTRAINT/g, "?result " + p + " '" + v + "' . " );
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
		queries: queries,
		syncquery: syncquery,
		getProperty: getProperty,
		getProperties: getProperties,
		getTopElements: getTopElements,
		getSubElements: getSubElements,
		getSearchResults: getSearchResults,
		getIsModifierOf: getIsModifierOf,
		getNote: getNote,
		getModifiers: getModifiers
	}
}());