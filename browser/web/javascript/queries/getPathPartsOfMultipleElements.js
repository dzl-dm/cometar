var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?a
WHERE
{
	?element skos:broader* [ rdf:partOf* [ skos:broader* ?c ] ] .
	?a skos:member* ?c .
	?a rdf:type ?type FILTER (?type IN (skos:Concept, skos:Collection)) .
	filter (?a != ?element && ?element IN (ELEMENTS))
}    
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		var elementsArray = [];
		for (var i = 0; i < e.length; i++)
		{
			var ep = Helper.getPrefixedIri(e[i]);
			if (ep.indexOf("http") == 0) elementsArray[i]="<"+ep+">";
			else elementsArray[i]=ep;
		}
		var elementsString = elementsArray.join(",");
		queryString = qs.replace(/ELEMENTS/g, elementsString );
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { callback(r["a"].value) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r["a"].value) });
			return result;
		}	
	}
});