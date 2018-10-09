var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT 
WHERE {
	
}   
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(e, callback, completeCallback)
	{
		var result = [];
		var queryString = qs;//.replace(/ELEMENT/g, e );
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