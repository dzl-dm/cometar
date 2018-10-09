BEGIN {
	FS=";";
}{
	print "\n:commit_" $1 >> output;
	print "\ta prov:Activity;" >> output;
	gsub(" ","_",$4);
	print "\tprov:wasAssociatedWith :"$4";" >> output;
	print "\tprov:endedAtTime \"" $3 "\"^^xsd:dateTime ;" >> output;
	label=$5
	for (i = 6; i <= FN; i++)
		label=label";"$i
	print "\tprov:label \"" gensub(/\"/,"\\&quot;","g",label) "\";" >> output;
	print "\tprov:generated [ a prov:Entity; prov:specializationOf :ontology ];" >> output;
	
	split($2, a, " ");
	for (i in a) 
	{
		print "\tprov:wasInfluencedBy :commit_" a[i] ";" >> output;
	}
	
	print "." >> output;
}
END{
}
