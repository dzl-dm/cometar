BEGIN {
	FS=",";
	old_concept="";
	change="";
	concept="";
	relation="";
	value="";
	changes="";
	currentNotation="";
	print "old;new" > output;
}{
	if (options_detailed) 
	{
		change=$1;concept=$4;relation=$5;value=$7;
	}
	else
	{
		change=$1;concept=$2;relation=$3;value=$5;
	}
	if (relation == "skos:notation") { 
		if (!(old_concept == concept))
		{
			match(changes, "<current<([^>]+)>", c);
			currentNotation=c[1];
			while (match(changes, "(<(current|added|removed)<([^>]+)>)<?", n))
			{
				#print old_concept ":" changes;
				if (n[2] == "removed")
				{
					notation = n[3];
					if (!match(changes, "(<added<" notation ">)", a))
					{
						#changes=substr(changes,ntag_length,a[1, RSTART]-ntag_length) substr(changes, a[1,RSTART]+a[1,RLENGTH]);
						#print "changed " old_concept " notation " notation " to " currentNotation;	
						print notation ";" currentNotation >> output;				
					}
				}
				changes=substr(changes,n[1,"length"]+1);
			}
			changes="";
			currentNotation="";
		}
		changes=changes "<" change "<" value ">";
	
		old_concept=concept;
	}
}
END{
}