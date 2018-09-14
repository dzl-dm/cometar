BEGIN {
	RS="\n?new concept\n";
	FS="";
	print "@prefix skos: 	<http://www.w3.org/2004/02/skos/core#> ." > output;
	print "@prefix snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/> ." >> output;
	print "@prefix : <http://data.dzl.de/ont/dwh#> ." >> output;
	print "@prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> ." >> output;
	print "@prefix owl: <http://www.w3.org/2002/07/owl#> ." >> output;
	print "@prefix foaf: <http://xmlns.com/foaf/0.1/> ." >> output;
	print "@prefix xsd:	<http://www.w3.org/2001/XMLSchema#> ." >> output;
	print "@prefix dc: <http://purl.org/dc/elements/1.1/> ." >> output;
	print "@prefix dwh:    <http://sekmi.de/histream/dwh#> ." >> output;
	print "@prefix loinc: <http://loinc.org/owl#> ." >> output;
	print "@prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> ." >> output;
}{
	record = $0;
	#print "\n\n" record;
	while (match(record,"^((removed),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr) || match(record,"\n((removed),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr) || match(record,"^((added),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr) || match(record,"\n((added),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*))",arr))
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
		if (crelation=="skos:narrower") continue;
		searchlanguage = arr[7];
		clanguage = "";
		cminus = "";
		cplus = "";
		itsALiteral = 0;
		if (arr[7] != "")
		{
			itsALiteral = 1;
			if (arr[7] != "\"\"") 
			{
				clanguage = "@" arr[7];
			}
		}
		# if (arr[2] == "removed" && match(record,"(added,"cauthor","searchdate_day","cconcept","crelation","searchlanguage",([^\n]*))",arr2))
		# {
			# record=substr(record,0,arr2[1,"start"]-1) substr(record,arr2[1,"start"]+arr2[1,"length"]+1);
			# if (arr[8] == arr2[2]) continue;
			# caction = "changed";
			# #cobject = "\"from &quot;"arr[8] "&quot;" clanguage " to &quot;" arr2[2] "&quot;" clanguage "\"";
			# cminus = gensub(/\"/,"\\&quot;","g",arr[8]);
			# cplus = gensub(/\"/,"\\&quot;","g",arr2[2]);
			# if (itsALiteral)
			# {
				# cminus = "\"" cminus "\"";
				# cplus = "\"" cplus "\"";
			# }
			# cobject = "[ :minus " cminus clanguage"; :plus " cplus clanguage" ]";
		# }
		# else
		# {
			caction = arr[2];			
			cobject = gensub(/\"/,"\\&quot;","g",arr[8]);
			cobject = gensub(/\r/,"","g",cobject);
			if (itsALiteral) cobject = "\"" cobject "\"" clanguage;
			if (caction == "added") cobject = "[ :plus "cobject" ]";
			else cobject = "[ :minus "cobject" ]";
		# }
		if (caction != "current")
		{
			printf cconcept " skos:changeNote [" >> output;
			printf "\tdc:date \"" cdate "\"^^xsd:dateTimeStamp ;" >> output;
			printf "\tdc:creator [ a foaf:person ; foaf:name \"" cauthor "\" ] ;" >> output;
			print "\trdf:value " cobject " ;" >> output;
			print "\towl:onProperty  " crelation " ;" >> output;
			print "\t:action \"" caction "\" " >> output;
			print "] ." >> output; 
		}
	}
}
END{
}
