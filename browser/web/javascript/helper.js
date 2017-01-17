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

	var paths;
	var pathCallback;
	var getPathsByConceptUrl = function(conceptUrl, callback)
	{
		pathCallback = callback;
		paths = [];
		modExtensionBalance(1);
		getLabelByConceptUrl(conceptUrl, function(label){
			extendPath([conceptUrl], [label]);
		});
	}
	
	var extensionBalance = 0;
	var modExtensionBalance = function(amount)
	{
		extensionBalance+=amount;
		if (extensionBalance == 0)
		{
			pathCallback(paths);
		}
	}
	
	var extendPath = function(pathConceptUrls, pathLabels)
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
			function(k)
			{
				if (pathConceptUrlExtensions.length == 0)
				{
					paths.push([pathConceptUrls.reverse(), pathLabels.reverse()]);
				}
				modExtensionBalance(pathConceptUrlExtensions.length - 1);
				for (var i = 0; i < pathConceptUrlExtensions.length; i++)
				{
					var newPathConceptUrls = $.merge($.merge( [], pathConceptUrls ), [pathConceptUrlExtensions[i]]);
					var newPathLabels = $.merge($.merge( [], pathLabels ), [pathLabelExtensions[i]]);
					extendPath(newPathConceptUrls, newPathLabels);
				}
			}
		);	
	}
	
	return {
		getConceptUrlByNotation: getConceptUrlByNotation,
		getLabelByConceptUrl: getLabelByConceptUrl,
		getPathsByConceptUrl: getPathsByConceptUrl,
		getNotationByConceptUrl: getNotationByConceptUrl
	}
}());