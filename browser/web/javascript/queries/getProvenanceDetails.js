var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT DISTINCT ?subject ?sl ?predicate ?oldobject ?ool ?newobject ?nol
WHERE	
{
	<COMMIT> prov:qualifiedUsage ?usage .
	?usage ?addorremove [ a rdf:Statement; rdf:subject ?subject ] .
	OPTIONAL {?usage cs:addition ?add .
		?add a rdf:Statement; 
			rdf:subject ?subject; 
			rdf:predicate ?predicate; 
			rdf:object ?newobject .
		OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
		OPTIONAL { ?newobject skos:prefLabel ?nol filter (isLiteral(?newobject) || lang(?nol)='en') . }
		FILTER NOT EXISTS { ?add rdf:comment "hidden" } 
		FILTER NOT EXISTS { ?newsubject prov:wasDerivedFrom+ ?subject } 
	}		
	OPTIONAL { ?usage cs:removal ?rem .
		?rem a rdf:Statement; 
			rdf:subject ?subject; 
			rdf:predicate ?predicate; 
			rdf:object ?oldobject .
		OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
		OPTIONAL { ?oldobject skos:prefLabel ?ool filter (isLiteral(?oldobject) || lang(?ool)='en') . }
		FILTER NOT EXISTS { ?rem rdf:comment "hidden" } 
		FILTER NOT EXISTS { ?newsubject prov:wasDerivedFrom+ ?subject } 
	}
	filter (!bound(?oldobject) || !bound(?newobject) || !isLiteral(?oldobject) || !isLiteral(?newobject) || lang(?oldobject) = lang(?newobject))
}
ORDER BY ?sl ?subject ?predicate 
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(commitid, callback, completeCallback)
	{
		var result = [];
		queryString = qs.replace(/<COMMIT>/g, ":commit_"+commitid );
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { callback(r) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result;
		}	
	}
});