BEGIN {
	FS=","
	old_concept="";
	printf "" > output;
}{
	concept=$4;
	if (concept!=old_concept) 
	{
		print "new concept" >> output;
		old_concept=concept;
	}
	print $0 >> output
}
END{
}