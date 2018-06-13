BEGIN {
	RS="\n?new concept\n";
	FS="";
	printf "" > "changes.ttl";
	
}{
	record = $0;
	#print "\n\n" record;
	while (match(record,"((removed),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr) || match(record,"((added),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr))
	{
		#print "\n"record;
		record=substr(record,0,arr[1,"start"]-1) substr(record,arr[1,"start"]+arr[1,"length"]+1);
		caction = "";
		cobject = "";
		cauthor = arr[3];
		cdate = arr[4];#substr(arr[4],0,10);
		searchdate_day = substr(arr[4],0,10) "[^,]*"; #für selben Tag Timestamp-Match
		searchdate_exact = gensub(/\+/, "\\\\+", "g", arr[4]); #für exakten Timestamp-Match
		cconcept = arr[5];
		crelation = arr[6];
		searchlanguage = arr[7];
		clanguage = "";
		if (arr[7] != "" && arr[7] != "\"\"") clanguage = "@" arr[7];
		if (arr[2] == "removed" && match(record,"(added,"cauthor","searchdate_day","cconcept","crelation","searchlanguage",([^\n]*))",arr2))
		{
			record=substr(record,0,arr2[1,"start"]-1) substr(record,arr2[1,"start"]+arr2[1,"length"]+1);
			if (arr[8] == arr2[2]) continue;
			caction = "changed";
			cobject = "from &quot;"arr[8] "&quot;" clanguage " to &quot;" arr2[2] "&quot;" clanguage;
		}
		else
		{
			caction = arr[2];
			cobject = "&quot;"arr[8]"&quot;" clanguage;
		}
		if (caction != "current")
		{
			printf cconcept " skos:changeNote [" >> "changes.ttl";
			printf "\tdc:date \"" cdate "\"^^xsd:dateTimeStamp ;" >> "changes.ttl";
			printf "\tdc:creator [ a foaf:person ; foaf:name \"" cauthor "\" ] ;" >> "changes.ttl";
			print "\trdf:value \"" cobject "\" ;" >> "changes.ttl";
			print "\towl:onProperty  " crelation " ;" >> "changes.ttl";
			print "\t:action \"" caction "\" ;" >> "changes.ttl";
			print "] ." >> "changes.ttl"; 
		}
	}
}
END{
}