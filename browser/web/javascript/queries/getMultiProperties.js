var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT VARIABLES
WHERE {
	CONSTRAINT
}  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, p, callback)
	{
		var result = [];
		var variables = "";
		var constraints = "";
		for (var i in p)
		{
			variables += " ?r" + i;
			constraints += "OPTIONAL { <" + e + ">" + " " + p[i] + " ?r" + i + " } . ";
		}
		queryString = qs.replace(/VARIABLES/, variables).replace(/CONSTRAINT/g, constraints);
		if (callback != undefined)
		{
			return QueryManager.query(queryString, function(r) { if(!jQuery.isEmptyObject(r)) callback(r) });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r) });
			return result;
		}
	}
});