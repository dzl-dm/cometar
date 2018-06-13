BEGIN {
	FS=",";
	old_concept="";
	change="";
	concept="";
	relation="";
	value="";
	changes="";
	currentNotation="";
	print "relation;old;new" > output;
	sql_demodata = "../sql_demodata.sql";
	sql_metadata = "../sql_metadata.sql";
	print "" > sql_demodata;
	print "" > sql_metadata;
	#print "" > "changes.ttl";
}{
	if (options_detailed) 
	{
		change=$1;concept=$4;relation=$5;value=$7;
	}
	else
	{
		change=$1;concept=$2;relation=$3;value=$5;
	}
	if (relation != "dc:description") { 
		if (!(old_concept == concept))
		{
			match(changes, "<current<([^<]+)<([^>]+)>", c);
			currentNotation=c[2];
			while (match(changes, "(<(added|removed)<([^<]+)<([^>]+)>)<?", n))
			{
				#print old_concept ":" changes;
				# if (n[2] == "removed")
				# {
					# removedObject = n[4];
					# if (!match(changes, "(<added<" n[3] "<([^>]+)>)", a))
					# {
						# addedObject = a[2];
						# print a[1];
						# #changes=substr(changes,ntag_length,a[1, RSTART]-ntag_length) substr(changes, a[1,RSTART]+a[1,RLENGTH]);
						# if (n[3] == "skos:notation")
						# {
							# print "notation;" removedObject ";" currentNotation >> output;		
							# print "UPDATE i2b2demodata.concept_dimension set concept_cd = '" currentNotation "' where concept_cd = '" removedObject "';" >> sql_demodata;
							# print "UPDATE i2b2demodata.observation_fact set concept_cd = '" currentNotation "' where concept_cd = '" removedObject "';" >> sql_demodata;
							# print "UPDATE i2b2metadata.i2b2 set c_basecode = '" currentNotation "' where c_basecode = '" removedObject "';" >> sql_metadata;
						# }
						# else print n[3] ";" removedObject ";" addedObject >> output;
					# }
				# }
				if ((n[2] == "removed") && match(changes, "(<added<" n[3] "<([^>]+)>)", a))
				{
					#print concept " skos:changeNote \"changed " n[3] " from &quot;" n[4] "&quot; to &quot;" a[2] "&quot; .\"" > "changes.ttl";
				}
				else
				{
					#print concept " skos:changeNote \"" n[2] " " n[3] " &quot;" n[4] "&quot; .\"" > "changes.ttl";
				}
				changes=substr(changes,n[1,"length"]+1);
			}
			changes="";
			currentNotation="";
		}
		changes=changes "<" change "<" relation "<" value ">";
	
		old_concept=concept;
	}
}
END{
}