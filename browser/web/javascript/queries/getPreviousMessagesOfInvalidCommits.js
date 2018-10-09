var Query = (function(prefixes){
	var qs = prefixes + (function () {/*
SELECT ?message
WHERE 
{
	{
		SELECT ?valid_commit
		WHERE
		{
			:commit_d24614903e4eacd64434733fd659343ab6851d32 prov:wasInfluencedBy+ ?valid_commit .
			?valid_commit prov:endedAtTime ?date ;
				cs:ChangeSet  [ ?thing [] ] .
		}
		ORDER BY DESC(?date)
		LIMIT 1
	}
	:commit_d24614903e4eacd64434733fd659343ab6851d32 prov:wasInfluencedBy+ ?invalid_commit .	
	?invalid_commit prov:label ?message ;
		prov:endedAtTime ?date .
	?valid_commit prov:influenced+ ?invalid_commit .
}  
order by desc(?date)
	*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
	
	return function(commit, callback, completeCallback)
	{
		var queryString = qs.replace(/COMMIT/g, ":commit_"+commit );
		if (callback != undefined)
		{
			QueryManager.query(queryString, function(r) { callback(r["message"].value) }, function(){ if (completeCallback != undefined) completeCallback() });
		}
		else 
		{
			var result = [];
			QueryManager.syncquery(queryString, function(r){ result.push(r["message"].value) });
			return result;
		}		
	}
});