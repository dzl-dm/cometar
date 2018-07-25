#!/bin/bash

conffile="$(dirname $0)/../config/conf.cfg"

while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
		-i)
			shift
			checkout_id=$1
			;;
		-a)
			shift
			commit_author=$1
			;;
		-d)
			shift
			commit_date=$1
			;;
		-o)
			shift
			output_file=$1
			;;
		-c)
			shift
			checkouts_directory=$1
			;;
	esac
	shift
done

source "$conffile"

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
		filename_subtrahend="${checkouts_directory}/${1}.csv" #das wird vom minuend abgezogen
		filename_minuend="${checkouts_directory}/${2}.csv" #hiervon wird abgezogen
		echo "comparing checkout $1 and $2" >&2
		#not_first_line_counter=1
		while read -r line ; 
		do
			#if [ $not_first_line_counter -gt 1 ]; then
				echo "${commit_author},${commit_date},${line}" 
			#fi		
			let not_first_line_counter+=1
		done < <(grep -v -F -x -f "$filename_subtrahend" "$filename_minuend" | prefix_replacement )
}

function find_working_parent(){
	local checkout_id_ancestor=$1
	#Im Falle eines nicht parse-baren Merges als Parent kommen hier mindestens zwei Parents des Merges heraus. Dann muss verglichen werden, welche Konzepte sich im Vergleich zu allen Parents verändert haben.
	#ich muss die compares für jeden Pfad erstellen und dann mit grep -f A B die gemeinsamen Änderungen finden
	checkout_ids_ancestors_string=$(cd "$TEMPDIR/git"; unset GIT_DIR; git log -n 1 --pretty=format:"%P" ${checkout_id_ancestor})
	if [ -z "$checkout_ids_ancestors_string" ]; then
		echo ""
		return
	fi
	IFS=$'\ '; 
	read -r -a checkout_ids_ancestors_array <<< "$checkout_ids_ancestors_string"
	unset IFS;	
	for checkout_id_ancestor in ${checkout_ids_ancestors_array[@]}; do
		success=$("$CHANGESSCRIPTDIR/save_ontology_state_from_checkout.sh" -p "$conffile" -i $checkout_id_ancestor -c "$checkouts_directory")
		if [ $success -eq 1 ]; then
			echo $checkout_id_ancestor
			break
		else
			echo "$checkout_id_ancestor not parsable, trying next ancestor" >&2		
			echo $(find_working_parent $checkout_id_ancestor)
		fi		
	done
}

success=$("$CHANGESSCRIPTDIR/save_ontology_state_from_checkout.sh" -p "$conffile" -i $checkout_id -c "$checkouts_directory")
if [ $success -eq 1 ]; then
	#get all ids of all parsable ancestors
	checkout_ids_ancestors_string=$(find_working_parent $checkout_id)
	if [ -z "$checkout_id_ancestor" ]; then #happens only for the very first checkout
		checkout_id_ancestor=$checkout_id
	fi
	IFS=$'\ '; 
	read -r -a checkout_ids_ancestors_array <<< "$checkout_ids_ancestors_string"
	unset IFS;	
	echo -n "" > "$output_file.tmp"
	for checkout_id_ancestor_i in ${checkout_ids_ancestors_array[@]}; do
		#Die Änderungen bzgl. des ersten Zweigs werden einfach übernommen
		if [ "$checkout_id_ancestor_i" = "${checkout_ids_ancestors_array[0]}" ]; then
			#Gesucht werden hierdurch alle Zeilen, die in im parent auftauchen, aber nicht im child, also entfernt wurden.
			compare_checkouts "$checkout_id" "$checkout_id_ancestor_i" | sed -e 's/^/removed,/' >> "$output_file.tmp"
			#Gesucht werden hierdurch alle Zeilen, die in _after auftauchen, aber nicht in _before, also hinzugefügt wurden.
			compare_checkouts "$checkout_id_ancestor_i" "$checkout_id" | sed -e 's/^/added,/' >> "$output_file.tmp"
		#Die Änderungen der folgenden Zweige werden verglichen und nur gemeinsame Änderungen beibehalten.
		else
			echo -n "" > "$output_file.tmp2"
			echo -n "" > "$output_file.tmp3"
			compare_checkouts "$checkout_id" "$checkout_id_ancestor_i" | sed -e 's/^/removed,/' >> "$output_file.tmp2"
			compare_checkouts "$checkout_id_ancestor_i" "$checkout_id" | sed -e 's/^/added,/' >> "$output_file.tmp2"
			grep -f "$output_file.tmp" "$output_file.tmp2" > "$output_file.tmp3"
			cat "$output_file.tmp3" > "$output_file.tmp"
			rm "$output_file.tmp2"
			rm "$output_file.tmp3"
		fi
	done
	cat "$output_file.tmp" >> "$output_file"
	rm "$output_file.tmp"
else
	echo "$checkout_id not parsable" >&2			
fi