var QueryManager = (function(){
	var endpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	//var endpoint = "http://localhost:3030/MinimalerDatensatz/query";
	var loglevel = 0; //0 = off, 1 = less detailed, 2 = more detailed

	var queries = [];
	for (var i of ["getTopElements", "getSubElements", "getSearchResults", "getParentElements", "getGeneric", "getIsModifierOf", "getNotes", "getModifiers"]) 
	{
		$.ajax({
			url: 'queries/'+i+'.query',
			dataType: 'text',
			contentType: 'text/plain',
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
	
	var getNotes = function(e, callback)
	{
		var result = [];
		queryString = queries["getNotes"].replace(/ELEMENT/g, "<" + e + ">" );
		if (callback != undefined)
		{
			query(queryString, function(r) { callback(r) });
		}
		else 
		{
			syncquery(queryString, function(r){ result.push(r) });
			return result;
		}
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
		getMultiProperties: getMultiProperties
	}
}());