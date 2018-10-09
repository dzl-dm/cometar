var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?result
WHERE {
	CONSTRAINT
}  
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, p, foc1, foc2)
	{
		var result = [];
		var filter = "";
		var callback;
		if (foc1 != undefined) {
			if (typeof foc1 == "string") filter = foc1;
			else if (typeof foc1 == "function") callback = foc1;
		}
		if (foc2 != undefined) {
			if (typeof foc2 == "string") filter = foc2;
			else if (typeof foc2 == "function") callback = foc2;
		}
		queryString = qs.replace(/CONSTRAINT/g, "<" + e + ">" + " " + p + " ?result . " + ( filter? "FILTER (" + filter + ")." : "" ) );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r["result"]) });
		}
		else 
		{
			QueryManager.syncquery(queryString, function(r){ result.push(r["result"]) });
			if (result.length == 1) return result[0];
			return result;
		}
	}
});