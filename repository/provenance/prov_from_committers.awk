BEGIN {
	FS=";";
}{
	gsub(" ","_",$1);
	print "\n:"$1"\n\ta prov:Agent, foaf:Person;\n\tfoaf:mbox \""$2"\";\n." >> output;
}
END{
}
