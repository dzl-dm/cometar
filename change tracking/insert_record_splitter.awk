BEGIN {
	FS=","
	old_concept="";
	printf "" > "changes2.csv";
}{
	concept=$4;
	if (concept!=old_concept) 
	{
		print "new concept" >> "changes2.csv";
		old_concept=concept;
	}
	print $0 >> "changes2.csv"
}
END{
}