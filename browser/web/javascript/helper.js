var Helper = (function()
{	
	var getPathsByConceptIri = function(conceptIri, pathCallback)
	{
		QueryManager.getProperty(conceptIri, "skos:prefLabel", "lang(?result) = 'en'",function(label){
			extendPath([conceptIri], [label.value], pathCallback);
		});
	}
	
	var extendPath = function(pathConceptIris, pathLabels, pathCallback, paths)
	{
		var conceptIri = pathConceptIris[pathConceptIris.length-1];
		var pathConceptIriExtensions = [];
		var pathLabelExtensions = [];
		QueryManager.getParentElements(conceptIri,
			function(e){
				pathConceptIriExtensions.push(e["element"].value);
				pathLabelExtensions.push(e["label"].value);
			},
			function()
			{
				if (pathConceptIriExtensions.length == 0)
				{
					pathCallback([pathConceptIris.reverse(), pathLabels.reverse()]);
				}
				for (var i = 0; i < pathConceptIriExtensions.length; i++)
				{
					var newPathConceptIris = $.merge($.merge( [], pathConceptIris ), [pathConceptIriExtensions[i]]);
					var newPathLabels = $.merge($.merge( [], pathLabels ), [pathLabelExtensions[i]]);
					extendPath(newPathConceptIris, newPathLabels, pathCallback);
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
		["http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf", "specification of concept"],
		["http://www.w3.org/2004/02/skos/core#topConceptOf", "top concept of"],
		["http://www.w3.org/2004/02/skos/core#Collection", "collection"],
		//["http://data.dzl.de/ont/dwh#", ""],
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
	
	var getCurrentConceptIri = function(){
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
	
	var setCurrentConceptIri = function(conceptIri){
		var options = "";
		if (location.hash.indexOf("?") > -1) options = location.hash.substr(location.hash.indexOf("?"));
		location.hash = getCometarWebUrlByConceptIri(conceptIri) + options;
	}
	
	var getCometarWebUrlByConceptIri = function(conceptIri)
	{
		for (var i = 0; i < urlShorts.length; i++)
		{
			if (conceptIri.indexOf(urlShorts[i][0]) > -1) 
			{
				return urlShorts[i][1]+conceptIri.substr(urlShorts[i][0].length);
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
		getPathsByConceptIri: getPathsByConceptIri,
		getAuthenticationToken: getAuthenticationToken,
		getAuthenticationUsername: getAuthenticationUsername,
		authenticated: authenticated,
		setCookie: setCookie,
		getCookie: getCookie,
		getCurrentConceptIri: getCurrentConceptIri,
		setCurrentConceptIri: setCurrentConceptIri,
		getReadableString: getReadableString,
		getQueryParameter: getQueryParameter,
		levenstheinDistance: levenstheinDistance,
		customHide: customHide,
		getCometarWebUrlByConceptIri: getCometarWebUrlByConceptIri,
		startLoading: startLoading,
		stopLoading: stopLoading,
		getPrefixedIri: getPrefixedIri,
		getFullIri: getFullIri
	}
}());


//zum Testen
var Configuration = Configuration || {};
$.extend(Configuration, {
	Display: {
		iriToHumanReadable: {	
			"http://purl.org/dc/elements/1.1/description": "description",
			"http://www.w3.org/2004/02/skos/core#prefLabel": "label",
			"http://www.w3.org/2004/02/skos/core#altLabel": "alternative label",
			"http://www.w3.org/2004/02/skos/core#notation": "code",
			"http://www.w3.org/2004/02/skos/core#broader": "parent element",
			"http://www.w3.org/2004/02/skos/core#narrower": "child element",
			"http://www.w3.org/2004/02/skos/core#Concept": "concept",
			"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": "modifier",
			"http://sekmi.de/histream/dwh#restriction": "datatype",
			"http://data.dzl.de/ont/dwh#status": "status",
			"http://data.dzl.de/ont/dwh#unit": "unit",
			"http://purl.org/dc/elements/1.1/creator": "author",
			"http://www.w3.org/1999/02/22-rdf-syntax-ns#about": "concept identifier",
			"http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "classification",
			"http://sekmi.de/histream/dwh#integerRestriction": "integer",
			"http://sekmi.de/histream/dwh#stringRestriction": "string",
			"http://sekmi.de/histream/dwh#floatRestriction": "float",
			"http://sekmi.de/histream/dwh#partialDateRestriction": "partial date",
			"http://www.w3.org/2004/02/skos/core#member": "collection member",
			"http://www.w3.org/2004/02/skos/core#editorialNote": "editorial note",
			"http://www.w3.org/ns/prov#wasDerivedFrom": "previous concept identifier",
			"http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf": "specification of concept",
			"http://www.w3.org/2004/02/skos/core#topConceptOf": "top concept of",
			"http://www.w3.org/2004/02/skos/core#Collection": "collection",
			//"http://data.dzl.de/ont/dwh#", "",
			"http://sekmi.de/histream/dwh#dateRestriction": "date"
		},
		shortDate: function(date){
			return date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
		}
	},
	readable: function(s){
		$.each(Configuration.display.iriToHumanReadable, function(key, value) {
			var regex = new RegExp(key, "g");
			s = s.replace(regex, value);
		});
		$.each(Configuration.display.urlShorts, function(key, value) {
			var regex = new RegExp(key, "g");
			s = s.replace(regex, value);
		});
		return s;		
	}
});

var testfunction = function(){	
	// var d = $("<div style='position:fixed;width:1000px;height:1000px;background-color:white;border:1px solid black;z-index:100000000'>");
	// $("body").append(d);
	// Provenance.loadOverview(new Date("2018-11-01"))
	// .then(function(){
		// d.append(Provenance.getCommitsVisualization());
		// Provenance.loadDetails(function(){
			// /*var vrc = Provenance.commits["4644493494f4fced17e8b6793a6d4dcfd41d1689"].visualRepresentation();
			// console.log(vrc.html());
			// var vrd = Provenance.days["09.01.2018"].getVisualRepresentation();
			// console.log(vrd);
			// var vra = Provenance.atomicChanges["Fri, 19 Jan 2018 08:59:31 GMThttp://data.dzl.de/ont/dwh#COPD1Ahttp://purl.org/dc/elements/1.1/description"].getVisualRepresentation();
			// console.log(vra);*/
		// });
	// });
}