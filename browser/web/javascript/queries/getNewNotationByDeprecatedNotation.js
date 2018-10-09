var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?notation
WHERE 
{
	[ cs:removal [ rdf:Statement [ 
			rdf:subject ?oldconcept;
			rdf:predicate skos:notation;
			rdf:object OLDNOTATION
		] ] ] .
	?newconcept skos:notation ?notation .
	?newconcept prov:wasDerivedFrom* ?oldconcept .
}  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(notation, callback, completeCallback)
	{
		var queryString = qs.replace(/OLDNOTATION/g, "\"" + notation + "\"" );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			var result = [];
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result.length>0?result[0]["notation"].value:"";
		}		
	}
});