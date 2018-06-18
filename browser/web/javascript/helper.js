var Helper = (function()
{	
	var getPathsByConceptUrl = function(conceptUrl, pathCallback)
	{
		var label = QueryManager.getProperty(conceptUrl, "skos:prefLabel", "lang(?result) = 'en'").value;
		extendPath([conceptUrl], [label], pathCallback);
	}
	
	var extendPath = function(pathConceptUrls, pathLabels, pathCallback, paths)
	{
		var conceptUrl = pathConceptUrls[pathConceptUrls.length-1];
		var queryString = QueryManager.queries.getParentElements.replace(/SUBELEMENT/g, "<" + conceptUrl + ">");
		var pathConceptUrlExtensions = [];
		var pathLabelExtensions = [];
		QueryManager.query(
			queryString, 
			function(resultItem){
				var e = resultItem["element"].value;
				pathConceptUrlExtensions.push(e);
				var label = QueryManager.getProperty(e, "skos:prefLabel", "lang(?result) = 'en'").value;
				pathLabelExtensions.push(label);
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
		["http://loinc.org/owl#", "loinc/"],
	];

	var moreUnderstandableStrings = [
		["http://www.w3.org/1999/02/22-rdf-syntax-ns#about", "identifier"],
		["http://purl.org/dc/elements/1.1/description", "description"],
		["http://www.w3.org/2004/02/skos/core#prefLabel", "label"],
		["http://www.w3.org/2004/02/skos/core#altLabel", "alternative label"],
		["http://www.w3.org/2004/02/skos/core#notation", "code"],
		["http://data.dzl.de/ont/dwh#status", "status"]
	];
	
	var getReadableString = function(s)
	{
		for (var i = 0; i < moreUnderstandableStrings.length; i++)
		{
			s = s.replace(moreUnderstandableStrings[i][0], moreUnderstandableStrings[i][1])
		}	
		return s;		
	}
	
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
		getPathsByConceptUrl: getPathsByConceptUrl,
		getAuthenticationToken: getAuthenticationToken,
		getAuthenticationUsername: getAuthenticationUsername,
		authenticated: authenticated,
		setCookie: setCookie,
		getCookie: getCookie,
		getCurrentConceptUrl: getCurrentConceptUrl,
		setCurrentConceptUrl: setCurrentConceptUrl,
		getReadableString: getReadableString
	}
}());