#!/bin/bash

conffile="$(dirname $0)/../config/conf.cfg"
#from_date="2017-01-01 00:00:00"
#problem at this point: server datetime is not always the same as commiting client datetime
until_date=$(date +'%Y-%m-%d %H:%M:%S')
until_date_is_now=1

while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
		-f)
			shift
			if ! from_date=$(date -d "$1" +"%Y-%m-%d %H:%M:%S") ; then
				echo "Please enter valid date (yyyy-mm-dd hh:mm:ss)"
				exit
			fi
			;;
		-u)
			shift
			if ! until_date=$(date -d "$1" +"%Y-%m-%d %H:%M:%S") ; then
				echo "Please enter valid date (yyyy-mm-dd hh:mm:ss)"
				exit
			fi
			until_date_is_now=0
			;;
		-o)
			shift
			output_file=$1
			;;
	esac
	shift
done

source "$conffile"

output_directory="$PROVENANCEFILESDIR/output"
mkdir -p "$output_directory"

echo "Writing deltas from $from_date to ${until_date}."
echo "$(date +'%d.%m.%y %H:%M:%S') Writing deltas from $from_date to ${until_date}." >> "$LOGFILE"
while read line || [ -n "$line" ]; do #second expression is needed cause the last git log line does not end with a newline
	echo ""
	echo $line
	checkout_id=$line
	success=$("$PROVENANCESCRIPTDIR/create_delta_file.sh" -p "$conffile" -i $checkout_id)
done < <(
	cd "$TEMPDIR/git"; 
	unset GIT_DIR; 
	git checkout -q master; 
	if [ $until_date_is_now -eq 0 ]; then
		git log --pretty=format:"%H" --since="$from_date" --before="$until_date"
	else
		git log --pretty=format:"%H" --since="$from_date"
	fi
)

output_file="$PROVENANCEFILESDIR/output/$(echo $from_date | tr ':' '_') - $(echo $until_date | tr ':' '_').ttl"
echo "@prefix skos: 	<http://www.w3.org/2004/02/skos/core#> ." > "$output_file";
echo "@prefix snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/> ." >> "$output_file";
echo "@prefix : <http://data.dzl.de/ont/dwh#> ." >> "$output_file";
echo "@prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> ." >> "$output_file";
echo "@prefix owl: <http://www.w3.org/2002/07/owl#> ." >> "$output_file";
echo "@prefix foaf: <http://xmlns.com/foaf/0.1/> ." >> "$output_file";
echo "@prefix xsd:	<http://www.w3.org/2001/XMLSchema#> ." >> "$output_file";
echo "@prefix dc: <http://purl.org/dc/elements/1.1/> ." >> "$output_file";
echo "@prefix dwh:    <http://sekmi.de/histream/dwh#> ." >> "$output_file";
echo "@prefix loinc: <http://loinc.org/owl#> ." >> "$output_file";
echo "@prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> ." >> "$output_file";
echo "@prefix prov: 	<http://www.w3.org/ns/prov#> ." >> "$output_file";
echo "@prefix cs: 	<http://purl.org/vocab/changeset/schema#> ." >> "$output_file";
echo "" >> "$output_file";
echo ":ontology a prov:Entity ." >> "$output_file";

echo "Writing provenance statements for ..."
concepts_file="$output_directory/concepts.csv"
echo -n "" > "$concepts_file"
echo "... committers (Agents)."
gawk -f "$PROVENANCESCRIPTDIR/prov_from_committers.awk" -v output="$output_file" "$PROVENANCEFILESDIR/output/committers.csv"
echo "... commits (Activities)."
gawk -f "$PROVENANCESCRIPTDIR/prov_from_commits.awk" -v output="$output_file" "$PROVENANCEFILESDIR/output/commits.csv"
echo "... changes (Qualified activities)."
while read id || [ -n "$id" ]; do
	if [ -f "$PROVENANCEFILESDIR/deltas/$id.csv" ]; then
		gawk -f "$PROVENANCESCRIPTDIR/prov_from_changefile.awk" -v output="$output_file" -v concepts="$concepts_file" -v id="$id" "$PROVENANCEFILESDIR/deltas/$id.csv"
	fi
done < <(cd "$TEMPDIR/git"; unset GIT_DIR; git checkout -q master; if [ -n "$recent_line" ] ; then echo "$recent_line"; fi; git log --pretty=format:"%H" --since="$from_date" --before="$until_date")

# echo "... concepts (Entities)."
# while read concept || [ -n "$concept" ]; do 
	# echo "<${concept}> a prov:Entity." >> "$output_file";
# done < <(sort "$concepts_file" | uniq)

rm "$concepts_file"
rm "$PROVENANCEFILESDIR/output/committers.csv"
rm "$PROVENANCEFILESDIR/output/commits.csv"
