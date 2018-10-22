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
		var pathConceptUrlExtensions = [];
		var pathLabelExtensions = [];
		QueryManager.getParentElements(conceptUrl,
			function(e){
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
		["http://loinc.org/owl#", "loinc/"]
	];
	
	var iriPrefixes = [
		["http://purl.bioontology.org/ontology/SNOMEDCT/", "snomed:"],
		["http://loinc.org/owl#", "loinc:"],
		["http://data.dzl.de/ont/dwh#", ":"]
	];

	var moreUnderstandableStrings = [
		["http://purl.org/dc/elements/1.1/description", "description"],
		["http://www.w3.org/2004/02/skos/core#prefLabel", "label"],
		["http://www.w3.org/2004/02/skos/core#altLabel", "alternative label"],
		["http://www.w3.org/2004/02/skos/core#notation", "code"],
		["http://www.w3.org/2004/02/skos/core#broader", "parent element"],
		["http://www.w3.org/2004/02/skos/core#narrower", "child element"],
		["http://www.w3.org/2004/02/skos/core#Concept", "concept"],
		["http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart", "modifier"],
		["http://sekmi.de/histream/dwh#restriction", "datatype"],
		["http://data.dzl.de/ont/dwh#status", "status"],
		["http://purl.org/dc/elements/1.1/creator", "author"],
		["http://www.w3.org/1999/02/22-rdf-syntax-ns#about", "concept identifier"],
		["http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "classification"],
		["http://sekmi.de/histream/dwh#integerRestriction", "integer"],
		["http://sekmi.de/histream/dwh#stringRestriction", "string"],
		["http://sekmi.de/histream/dwh#floatRestriction", "float"],
		["http://sekmi.de/histream/dwh#partialDateRestriction", "partial date"],
		["http://www.w3.org/2004/02/skos/core#member", "collection member"],
		["http://www.w3.org/2004/02/skos/core#editorialNote", "editorial note"],
		["http://www.w3.org/ns/prov#wasDerivedFrom", "previous concept identifier"],
		["http://data.dzl.de/ont/dwh#", ""],
		["http://sekmi.de/histream/dwh#dateRestriction", "date"]
	];
	
	var getPrefixedIri = function(s)
	{
		var sWithPrefix="";
		for (var i = 0; i < iriPrefixes.length; i++)
		{
			var regex = new RegExp(iriPrefixes[i][0], "g");
			sWithPrefix = s.replace(regex, iriPrefixes[i][1]);
			if (sWithPrefix!=s)return sWithPrefix;
		}	
		return s;
	}
	var getFullIri = function(s)
	{
		var sFull="";
		for (var i = 0; i < iriPrefixes.length; i++)
		{
			var regex = new RegExp(iriPrefixes[i][1], "g");
			s = s.replace(regex, iriPrefixes[i][0]);
			if (sFull!=s)return sFull;
		}	
		return s;
	}
	
	
	var getReadableString = function(s)
	{
		for (var i = 0; i < moreUnderstandableStrings.length; i++)
		{
			var regex = new RegExp(moreUnderstandableStrings[i][0], "g");
			s = s.replace(regex, moreUnderstandableStrings[i][1]);
		}	
		for (var i = 0; i < urlShorts.length; i++)
		{
			var regex = new RegExp(urlShorts[i][0], "g");
			s = s.replace(regex, urlShorts[i][1]);
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
		var options = "";
		if (location.hash.indexOf("?") > -1) options = location.hash.substr(location.hash.indexOf("?"));
		location.hash = getCometarWebUrlByConceptUrl(conceptUrl) + options;
	}
	
	var getCometarWebUrlByConceptUrl = function(conceptUrl)
	{
		for (var i = 0; i < urlShorts.length; i++)
		{
			if (conceptUrl.indexOf(urlShorts[i][0]) > -1) 
			{
				return urlShorts[i][1]+conceptUrl.substr(urlShorts[i][0].length);
			}
		}
	}
	
	var levenstheinDistance = function(a,b) {
		var m = [], i, j, min = Math.min;

		if (!(a && b)) return (b || a).length;

		for (i = 0; i <= b.length; m[i] = [i++]);
		for (j = 0; j <= a.length; m[0][j] = j++);

		for (i = 1; i <= b.length; i++) {
			for (j = 1; j <= a.length; j++) {
				m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
					? m[i - 1][j - 1]
					: m[i][j] = min(
						m[i - 1][j - 1] + 1, 
						min(m[i][j - 1] + 1, m[i - 1 ][j] + 1))
			}
		}

		return m[b.length][a.length];
	}
	
	var customHide = function(div, h)
	{
		expandDiv=$("<div class='expandInformationDiv'>+</div>");
		div.append(expandDiv);
		minHeight = expandDiv.get(0).scrollHeight;
		minHeight = h > minHeight? h : minHeight;
		div.css("height", minHeight+"px").css("overflow","hidden").css("position","relative");
		expandDiv.click(function(){
			$(this).hide();
			div.animate({
				height: div.get(0).scrollHeight
			}, 200);
		});
	}
	
	jQuery.fn.rotate = function(degrees) {
		$(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
					 '-moz-transform' : 'rotate('+ degrees +'deg)',
					 '-ms-transform' : 'rotate('+ degrees +'deg)',
					 'transform' : 'rotate('+ degrees +'deg)'});
		return $(this);
	};
	
	var loadingThings = 0;
	var startLoading = function()
	{
		loadingThings++;
		$("#loadingPng").addClass("active");
	}
	
	var stopLoading = function()
	{
		loadingThings--;
		if (loadingThings == 0) 
		{
			$("#loadingPng").removeClass("active");
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
		getReadableString: getReadableString,
		getQueryParameter: getQueryParameter,
		levenstheinDistance: levenstheinDistance,
		customHide: customHide,
		getCometarWebUrlByConceptUrl: getCometarWebUrlByConceptUrl,
		startLoading: startLoading,
		stopLoading: stopLoading,
		getPrefixedIri: getPrefixedIri,
		getFullIri: getFullIri
	}
}());