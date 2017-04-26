var Helper = (function()
{	
	var getConceptUrlByNotation = function(notation, callback)
	{
		var queryString = QueryManager.queries.getConceptUrlByNotation.replace(/NOTATION/g, notation);
		QueryManager.query(queryString, function(resultItem){
			callback(resultItem["concept"].value);
		});
	}
	
	var getNotationByConceptUrl = function(conceptUrl, callback)
	{
		var queryString = QueryManager.queries.getNotationByConceptUrl.replace(/CONCEPT/g, conceptUrl);
		QueryManager.query(queryString, function(resultItem){
			callback(resultItem["notation"].value);
		});
	}
	
	var getLabelByConceptUrl = function(conceptUrl, callback)
	{
		var queryString = QueryManager.queries.getLabelByConceptUrl.replace(/CONCEPT/g, conceptUrl);
		QueryManager.query(queryString, function(resultItem){
			callback(resultItem["label"].value);
		});
	}

	var getPathsByConceptUrl = function(conceptUrl, pathCallback)
	{
		getLabelByConceptUrl(conceptUrl, function(label){
			extendPath([conceptUrl], [label], pathCallback);
		});
	}
	
	var extendPath = function(pathConceptUrls, pathLabels, pathCallback, paths)
	{
		var conceptUrl = pathConceptUrls[pathConceptUrls.length-1];
		var queryString = QueryManager.queries.getParentConcept.replace(/CONCEPT/g, conceptUrl);
		var pathConceptUrlExtensions = [];
		var pathLabelExtensions = [];
		QueryManager.query(
			queryString, 
			function(resultItem){
				if (resultItem["parentconcept"]) pathConceptUrlExtensions.push(resultItem["parentconcept"].value);
				if (resultItem["parentlabel"]) pathLabelExtensions.push(resultItem["parentlabel"].value);
			},
			function()
			{
				if (pathConceptUrlExtensions.length == 0)
				{
					pathCallback([pathConceptUrls.reverse(), pathLabels.reverse()]);
				}
				for (var i = 0; i < pathConceptUrlExtensions.length; i++)
				{
					var newPathConceptUrls = $.merge($.merge( [], pathConceptUrls ), [pathConceptUrlExtensions[i]]);
					var newPathLabels = $.merge($.merge( [], pathLabels ), [pathLabelExtensions[i]]);
					extendPath(newPathConceptUrls, newPathLabels, pathCallback);
				}
			}
		);	
	}
	
	var setCookie = function(cname, cvalue, exminutes) {
		var d = new Date();
		d.setTime(d.getTime() + (exminutes*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	} 	
	var getCookie = function(cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	} 
	var getQueryParameter = function(name, url) {
		if (!url) {
		  url = window.location.href;
		}
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
		
	/* for testing begin */
	var authenticationToken = getQueryParameter("cat");
	var authenticationUsername = getQueryParameter("un");
	if (authenticationToken)
	{
		setCookie("cometarAuthenticationToken", authenticationToken, 15);
		setCookie("cometarUsername", authenticationUsername, 15);
	}
	/* for testing end */
	authenticationToken = getCookie("cometarAuthenticationToken");	
	if (authenticationToken != ""){
		setCookie("cometarAuthenticationToken", authenticationToken, 15);
	}
	var getAuthenticationUsername = function(){
		if (authenticationUsername && authenticationUsername != "") return authenticationUsername;
		else return "";
	}
	var getAuthenticationToken = function(){
		if (authenticationToken && authenticationToken != "") return authenticationToken;
		else return "";
	}
	var authenticated = function(){
		return getAuthenticationToken() != "";
	}
	
	var urlShorts = [
		["http://data.dzl.de/ont/dwh#", "dzl/"],
		["http://purl.bioontology.org/ontology/SNOMEDCT/", "snomed/"],
		["http://loinc.org/owl#", "loinc/"]
	];
	
	var getCurrentConceptUrl = function(){
		for (var i = 0; i < urlShorts.length; i++)
		{
			if (location.hash.indexOf(urlShorts[i][1]) == 1) 
			{
				var result = urlShorts[i][0] + decodeURIComponent(location.hash).substring(urlShorts[i][1].length+1);
				if (result.indexOf("?") > -1) result = result.substr(0,result.indexOf("?"));
				return result;
			}
		}
	}
	
	var setCurrentConceptUrl = function(conceptUrl){
		for (var i = 0; i < urlShorts.length; i++)
		{
			if (conceptUrl.indexOf(urlShorts[i][0]) > -1) 
			{
				location.hash = urlShorts[i][1]+conceptUrl.substr(urlShorts[i][0].length);
				return;
			}
		}
	}
	
	return {
		getConceptUrlByNotation: getConceptUrlByNotation,
		getLabelByConceptUrl: getLabelByConceptUrl,
		getPathsByConceptUrl: getPathsByConceptUrl,
		getNotationByConceptUrl: getNotationByConceptUrl,
		getAuthenticationToken: getAuthenticationToken,
		getAuthenticationUsername: getAuthenticationUsername,
		authenticated: authenticated,
		setCookie: setCookie,
		getCookie: getCookie,
		getCurrentConceptUrl: getCurrentConceptUrl,
		setCurrentConceptUrl: setCurrentConceptUrl
	}
}());