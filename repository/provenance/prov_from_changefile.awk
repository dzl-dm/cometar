BEGIN {
	RS="\n";
	FS="\n";
	#FPAT = "([^,]*)|\"\"|(\"[^\n]+\")";
	print "\n:commit_" id >> output;
	print "\tprov:qualifiedUsage [" >> output;
	print "\t\ta prov:Usage, cs:ChangeSet;" >> output;
}{		
	match($0,"([^,]*),([^,]*),([^,]*),([^,]*),([^\n]*)",a);
	print a[2] >> concepts;	
	relation = a[3]
	language = "";
	itsALiteral = 0;
	if (a[4] != "")
	{
		itsALiteral = 1;
		if (a[4] != "\"\"") 
		{
			language = "@" a[4];
		}
	}
	
	object = gensub(/\"/,"\\&quot;","g",a[5]);
	object = gensub(/\r/,"","g",object);		
	if (itsALiteral) object = "\"" object "\"" language;
	else object = "<" object ">";
	if (a[1] == "added") {
		object2 = "[ :plus "object" ]";
		action = "addition";
	}
	else {
		object2 = "[ :minus "object" ]";	
		action = "removal";
	}
	
	# print "\tprov:qualifiedUsage [" >> output;
	# print "\t\ta prov:Usage;" >> output;
	# print "\t\tprov:entity [" >> output;
	# print "\t\t\t a prov:Entity;" >> output;
	# print "\t\t\t prov:specializationOf <"$2">;" >> output;
	# print "\t\t]" >> output;
	# print "\t]" >> output;
	
	# print "\tprov:qualifiedGeneration [" >> output;
	# print "\t\ta prov:Generation;" >> output;
	# print "\t\tprov:entity [" >> output;
	# print "\t\t\t a prov:Entity;" >> output;
	# print "\t\t\t prov:specializationOf <"$2">;" >> output;
	# print "\t\t]" >> output;
	# print "\t]" >> output;
	
	print "\t\tcs:"action" [" >> output;
	print "\t\t\trdf:Statement [" >> output;
	print "\t\t\t\trdf:subject <"a[2]">;" >> output;
	print "\t\t\t\trdf:predicate <"a[3]">;" >> output;
	print "\t\t\t\trdf:object "object >> output;
	print "\t\t\t]" >> output;
	print "\t\t];" >> output;	

	
	# print "\t\tskos:changeNote [" >> output;
	# print "\t\t\trdf:value " object2 " ;" >> output;
	# print "\t\t\towl:onProperty <" a[3] "> ;" >> output;
	# print "\t\t]" >> output; 
}
END{
	print "\t]" >> output;
	print "." >> output;
}
