var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?subject ?sl ?predicate ?oldobject ?ool ?newobject ?nol
WHERE
{
	OPTIONAL { <COMMIT> prov:qualifiedUsage [ cs:addition ?add ] .
		?add rdf:Statement [ rdf:subject ?subject; rdf:predicate ?predicate; rdf:object ?newobject ] .
		OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
		OPTIONAL { ?newobject skos:prefLabel ?nol filter (isLiteral(?oldobject) || lang(?ool)='en') . }
		FILTER NOT EXISTS { ?add rdf:comment "derived" } 
	}		
	OPTIONAL { <COMMIT> prov:qualifiedUsage [ cs:removal ?rem ] .
		?rem rdf:Statement [ rdf:subject ?subject; rdf:predicate ?predicate; rdf:object ?oldobject ] .
		OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
		OPTIONAL { ?oldobject skos:prefLabel ?ool filter (isLiteral(?oldobject) || lang(?ool)='en') . }
		FILTER NOT EXISTS { ?rem rdf:comment "derived" } 
	}
	filter (!bound(?oldobject) || !bound(?newobject) || lang(?oldobject) = lang(?newobject))
}
ORDER BY ?sl ?predicate 
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(commitid, callback, completeCallback)
	{
		var result = [];
		queryString = qs.replace(/<COMMIT>/g, ":commit_"+commitid );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result;
		}	
	}
});