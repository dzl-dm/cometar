#!/bin/bash
options_from_date="2000-01-01 00:00:00"
options_until_date="2050-01-01 00:00:00"
options_detailed=0
options_rdfdir=""
options_fusekihost=""
working_directory="$(pwd)"
output_changes="${working_directory}/changes.csv"
output_changes_unsorted="${working_directory}/changes_unsorted.csv"
output_notations=""

function print_help {
	echo "This program checks out versions of the RDF files in the RDF file directory, loads them into Fuseki server, queries all available triples and saves them. Afterwards, the triple-files are compared successively to get all changes made to the ontology. By default, only the oldest and the newest version are compared."
	echo ""
	echo "Usage: $0 [options] [Fuseki host server] [RDF file directory]"
	echo ""
	echo "	-f		from date [YYYY-MM-DD hh:mm:ss]"
	echo "	-u		until date [YYYY-MM-DD hh:mm:ss]"
	echo "	-d		detailed, also fetches all changes made in between the oldest and newest version"
	echo "	-n		file for extraction of changes in notations"
	echo "	-o		output file for sorted changes"
	exit 0
}

while getopts df:n:o:u: opt
do
   case $opt in
       d) options_detailed=1;;
       f) options_from_date=$OPTARG;;
	   n) output_notations=$OPTARG;options_detailed=1;;
       o) output_changes=$OPTARG;;
       u) options_until_date=$OPTARG;;
       ?) print_help
   esac
done

shift "$((OPTIND - 1))"

options_fusekihost=$1
options_rdfdir=$2

if [ -z "$options_fusekihost" ]; then
    echo "Fuseki host not defined!"
	exit 1
fi
if [ ! -d "$options_rdfdir" ]; then
    echo "RDF file directory not found!"
	exit 1
fi

working_directory="$(pwd)"
#ttl_directory="${working_directory}/dzl-ttl"
#output_changes="${working_directory}/changes.csv"
ontology_state_before="${working_directory}/oso.csv"
ontology_state_after="${working_directory}/osn.csv"
sparql_query="SELECT ?a ?b (lang(?c) as ?d) ?e WHERE { \
		{ \
			?a ?b ?c . \
			FILTER (isLiteral(?c)) \
			BIND(REPLACE(?c, '(\r|\n)*', '', 'i') AS ?e) \
		} \
		UNION \
		{ \
			?a ?b ?c . \
			FILTER (!isLiteral(?c)) \
			BIND(?c AS ?e) \
		} \
	} ORDER BY ?a ?b ?d ?c"
# sparql_query="PREFIX skos: 	<http://www.w3.org/2004/02/skos/core#> \
	# PREFIX dc:		<http://purl.org/dc/elements/1.1/> \
	# PREFIX : 		<http://data.dzl.de/ont/dwh#> \
	# PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
	# PREFIX dwh:		<http://sekmi.de/histream/dwh#> \
	# SELECT ?concept ?broader ?narrower ?partof ?haspart ?creator ?plg ?ple ?alg ?ale ?notation ?unit ?status ?description ?restriction WHERE { \
	# ?concept skos:broader ?broader;\
		# OPTIONAL { ?concept skos:narrower ?narrower } . \
		# OPTIONAL { ?concept rdf:partOf ?partof } . \
		# OPTIONAL { ?concept rdf:hasPart ?haspart } . \
		# OPTIONAL { ?concept dc:creator ?creator } . \
		# OPTIONAL { ?concept skos:prefLabel ?plg . FILTER (lang(?plg) = 'de') } . \
		# OPTIONAL { ?concept skos:prefLabel ?ple . FILTER (lang(?ple) = 'en') } . \
		# OPTIONAL { ?concept skos:altLabel ?alg . FILTER (lang(?alg) = 'de') } . \
		# OPTIONAL { ?concept skos:altLabel ?ale . FILTER (lang(?ale) = 'en') } . \
		# OPTIONAL { ?concept skos:notation ?notation } . \
		# OPTIONAL { ?concept :unit ?unit } . \
		# OPTIONAL { ?concept :status ?status } . \
		# OPTIONAL { ?concept dc:description ?description } . \
		# OPTIONAL { ?concept dwh:restriction ?restriction } . \
# }"
function prefix_replacement { sed -r -e 's,http://www.w3.org/1999/02/22-rdf-syntax-ns#,rdf:,g' \
			-e 's,http://www.w3.org/2000/01/rdf-schema#,rdfs:,g' \
			-e 's,http://www.w3.org/2002/07/owl#,owl:,g' \
			-e 's,http://purl.org/dc/elements/1.1/,dc:,g' \
			-e 's,http://www.w3.org/2004/02/skos/core#,skos:,g' \
			-e 's,http://www.w3.org/2001/XMLSchema#,xsd:,g' \
			-e 's,http://sekmi.de/histream/dwh#,dwh:,g' \
			-e 's,http://purl.bioontology.org/ontology/SNOMEDCT/,snomed:,g' \
			-e 's,http://loinc.org/owl#,loinc:,g' \
			-e 's,http://data.dzl.de/ont/dwh#,:,g' 
}
function compare_checkouts {
		filename_subtrahend="../checkouts/${1}.csv" #das wird vom minuend abgezogen
		filename_minuend="../checkouts/${2}.csv" #hiervon wird abgezogen
		echo "comparing checkout $1 and $2" > /dev/tty
		not_first_line_counter=1
		while read -r line ; 
		do
			if [ $not_first_line_counter -gt 1 ]; then
				if [[ $options_detailed -eq 1 ]]; then
					echo -n "${commit_author},${commit_date},"
				fi
				echo "${line}" 
			fi		
			let not_first_line_counter+=1
		done < <(grep -v -F -x -f "$filename_subtrahend" "$filename_minuend" | prefix_replacement )
}
function get_current_notations {
		while read -r line ; 
		do
				if [[ $options_detailed -eq 1 ]]; then
					echo -n ",,"
				fi
				echo "${line}" 
			let not_first_line_counter+=1
		done < <(grep "http://www.w3.org/2004/02/skos/core#notation" "$1" | prefix_replacement )
}
function load_all_ttl_files() {
	echo "loading files into fuseki" > /dev/tty
	curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" -G "$options_fusekihost/data" -d default -s
	number_of_failed_uploads=0
	for filename in ./*.ttl; do
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" -s -f -w "%{http_code}" -T "$filename" -G "$options_fusekihost/data" -d default)
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
       		let number_of_failed_uploads+=1;
			echo "Error during loading of file ${filename}. Statuscode: $STATUSCODE" > /dev/tty
			break;
		fi	
	done
	local success=1
	if [ $number_of_failed_uploads -gt 0 ] ; then
		success=0
	fi
	echo $success
}
function apply_ttl_rules() {
	echo "applying rules" > /dev/tty
	STATUSCODE=$(curl -X POST -s -T "$working_directory/insertrules.ttl" -G "$options_fusekihost/update" -w "%{http_code}")
	local success=0;
	if [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]; then
		success=1
	fi
	echo $success
}
function write_triplestore_to_file() {
	checkout_id=$1
	filename="../checkouts/${checkout_id}.csv"
	echo "writing fuseki content to file $filename" > /dev/tty
	local success=1	
	curl -H "Accept: text/csv" -G "$options_fusekihost/query" -s -w "%{http_code}" --data-urlencode query="$sparql_query" >> "$filename"
	echo $success
}
function from_checkout_id_to_file() {
	checkout_id=$1	
	echo "from checkout id $checkout_id to file" > /dev/tty
	filename="../checkouts/${checkout_id}.csv"
	local success=1
	if [ -f $filename ]; then
		echo "File $filename exists." > /dev/tty
	else
		git checkout --quiet $checkout_id
		success=$(load_all_ttl_files)
		if [ $success == 1 ]; then
			success=$(apply_ttl_rules)
			if [ $success -eq 1 ]; then
				success=$(write_triplestore_to_file $checkout_id)
			fi
		fi
	fi
	echo $success
}
function find_working_parent(){
	local checkout_id_ancestor=$1
	echo "$checkout_id_ancestor not parsable, trying next ancestor" > /dev/tty
	while [ 1 == 1 ] ; do
		checkout_id_ancestor=$(git log -n 1 ${checkout_id_ancestor}^ | head -n 1 | sed -r "s/^commit\s([^\s]+)$/\1/")
		success=$(from_checkout_id_to_file $checkout_id_ancestor)
		if [ $success -eq 1 ]; then
			echo $checkout_id_ancestor
			break
		fi
	done
}

echo -n "" > "$output_changes_unsorted"
echo -n "" > "$ontology_state_before"
echo -n "" > "$ontology_state_after"
counter=1
commit_author=""
commit_date=""
commit_comment=""
git_n_command=""
if [[ $options_detailed -eq 0 ]]; then
	git_n_command="-n 1"
fi
cd $options_rdfdir
git checkout --quiet master

while read -r line ; do
	echo "---------------------"
	echo "$line"
	IFS=$'\t'; 
	read -r -a array <<< "$line"
	unset IFS;	
	checkout_ids=${array[0]}	
	checkout_ids_array=($checkout_ids)
	checkout_id_child=${checkout_ids_array[0]}
	commit_author=${array[1]}	
	commit_date=${array[2]}	
	commit_comment=${array[3]}	
	
	parents_counter=0
	child_success=0
	for i in "${checkout_ids_array[@]}"
	do
		if [ $parents_counter == 0 -o  $child_success == 1 ] ; then
			success=$(from_checkout_id_to_file $i)
			if [ $parents_counter == 0 -a $success == 1 ]; then
				child_success=1
			fi
			if [ $parents_counter -ge 1 ]; then
				checkout_id_parent=$i
				if [ $success -eq 0 ]; then
					checkout_id_parent=$(find_working_parent $checkout_id_parent)
				fi
				#Gesucht werden hierdurch alle Zeilen, die in im parent auftauchen, aber nicht im child, also entfernt wurden.
				compare_checkouts "$checkout_id_child" "$checkout_id_parent" | sed -e 's/^/removed,/' >> "$output_changes_unsorted"
				#Gesucht werden hierdurch alle Zeilen, die in _after auftauchen, aber nicht in _before, also hinzugefügt wurden.
				compare_checkouts "$checkout_id_parent" "$checkout_id_child" | sed -e 's/^/added,/' >> "$output_changes_unsorted"
			fi
		fi
		let parents_counter+=1
	done
	
	
	
	

	

	
	
	
	
		# In ontology_state_before stehen die Konzepte vor dem entsprechenden commit, in ontology_state_after stehen die Konzepte nach dem commit.
		# ontology_state_after wird aber vor _before bearbeitet, da git log chronologisch rückwärts abläuft.
		# if [ $counter -gt 1 ]; then
			# #commit_author, _date, _comment entsprechen immer dem von ontology_state_after
			# echo "comaprison $((counter - 1)) ($commit_date to $commit_after_date)"

		# else
			# if [ -n "$output_notations" ]; then
				# echo "collecting current notations"
				# get_current_notations "$ontology_state_before" | sed -e 's/^/current,/' >> "$output_changes_unsorted"
			# fi
		# fi
		# cp "$ontology_state_before" "$ontology_state_after"
		# cp "$ontology_state_before" "$working_directory/output_${counter}_${commit_date}.csv"
		# commit_after_author=$commit_author
		# commit_after_date=$commit_date
		# commit_after_comment=$commit_comment
		# let counter+=1	
done <<< "$((git log --parents --date=iso --since="\"$options_from_date\"" --before="\"$options_until_date\"" $git_n_command; git log --date=iso --before="$options_from_date" -n 1) | \
	gawk 'BEGIN {RS="commit "; FS=""}{ match($0,/([^\n]+)\n([^\n]+\n)?Author:[[:blank:]]*([^[:blank:]]+)[^\n]*\nDate:[[:blank:]]*([^\n]+)[^\n]*\n\n(.*)/,arr); \
	comment = arr[5]; gsub(/\n/,"",comment); gsub(/[[:blank:]]+/," ",comment); \
	if (NR > 1 && !match(arr[2],/Merge: /)) print arr[1] "\t" arr[3] "\t" arr[4] "\t" comment }')"

if [[ $options_detailed -eq 0 ]]; then
	sort -t $',' -k 2,2 -k 3,3 -k 4,4 -k 1,1 "$output_changes_unsorted" > "$output_changes"
else
	sort -t $',' -k 4,4 -k 3,3 -k 5,5 -k 6,6 -k 1,1 "$output_changes_unsorted" > "$output_changes"
fi

rm "$ontology_state_before"
rm "$ontology_state_after"
rm "$output_changes_unsorted"

if [ -n "$output_notations" ]; then
	gawk -v options_detailed="$options_detailed" -v output="$working_directory/$output_notations" -f "$working_directory/get_notation_changes.awk" "$output_changes"
	#sed -i '/^current/ d' $output_changes
fi
