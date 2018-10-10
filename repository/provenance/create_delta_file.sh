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
	esac
	shift
done

source "$conffile"

checkouts_directory="$PROVENANCEFILESDIR/checkouts"

function compare_checkouts {
		filename_subtrahend="${checkouts_directory}/${1}.csv" #das wird vom minuend abgezogen
		filename_minuend="${checkouts_directory}/${2}.csv" #hiervon wird abgezogen
		echo "== Comparing checkout $1 and ${2}." >&2
		while read -r line ; 
		do
			echo "${line}" 
			let not_first_line_counter+=1
		done < <(grep -v -F -x -f "$filename_subtrahend" "$filename_minuend" )
}

function find_working_parents(){
	local checkout_id=$1
	#Im Falle eines nicht parse-baren Merges als Parent kommen hier mindestens zwei Parents des Merges heraus. Dann muss verglichen werden, welche Konzepte sich im Vergleich zu allen Parents verändert haben.
	#ich muss die compares für jeden Pfad erstellen und dann mit grep -f A B die gemeinsamen Änderungen finden
	checkout_ids_ancestors_string=$(cd "$TEMPDIR/git"; unset GIT_DIR; git log -n 1 --pretty=format:"%P" ${checkout_id})
	if [ -z "$checkout_ids_ancestors_string" ]; then
		echo ""
		return
	fi
	IFS=$'\ '; 
	read -r -a checkout_ids_ancestors_array <<< "$checkout_ids_ancestors_string"
	unset IFS;	
	for checkout_id_ancestor in ${checkout_ids_ancestors_array[@]}; do
		echo ">> $checkout_id_ancestor identified as parent of $checkout_id." >&2
		success=$("$PROVENANCESCRIPTDIR/create_checkout_file.sh" -p "$conffile" -i $checkout_id_ancestor)
		if [ $success -eq 1 ]; then
			echo -n " $checkout_id_ancestor"
		else
			echo "!>> Trying next ancestor" >&2		
			echo $(find_working_parents $checkout_id_ancestor)
		fi		
	done
}


mkdir -p "$PROVENANCEFILESDIR/deltas"
output_file="$PROVENANCEFILESDIR/deltas/${checkout_id}.csv"

echo "-- Creating delta file for $checkout_id" >&2

#committers.csv output (Name, Email)
author_string=$(cd "$TEMPDIR/git"; unset GIT_DIR; git log -n 1 --pretty=format:"%cn;%ce" ${checkout_id})
echo "?? $author_string" >&2
if ! grep -q "${author_string}" "$PROVENANCEFILESDIR/output/committers.csv"; then
	echo "$author_string" >> "$PROVENANCEFILESDIR/output/committers.csv"
fi

#commits.csv output (CommitID, Parents, Date, Name, Commit Message)
commit_string=$(cd "$TEMPDIR/git"; unset GIT_DIR; git log -n 1 --pretty=format:"%H;%P;%cI;%cn;%s" ${checkout_id})
echo "?? $commit_string" >&2
if ! grep -q "${commit_string}" "$PROVENANCEFILESDIR/output/commits.csv"; then
	echo "$commit_string" >> "$PROVENANCEFILESDIR/output/commits.csv"
fi		

#delta.csv output (add/remove, concept, relation, language, value)
if [ -f "$output_file" ]; then
	echo "-- File $output_file exists." >&2
	success=1
else
	success=$("$PROVENANCESCRIPTDIR/create_checkout_file.sh" -p "$conffile" -i "$checkout_id")
	echo -n "" > "$output_file.tmp"
	if [ $success -eq 1 ]; then
		#get all ids of all parsable ancestors
		checkout_ids_ancestors_string=$(find_working_parents $checkout_id)
		if [ -z "$checkout_id_ancestor_string" ]; then #happens only for the very first checkout
			checkout_id_ancestor_string=$checkout_id
		fi
		IFS=$'\ '; 
		read -r -a checkout_ids_ancestors_array <<< "$checkout_ids_ancestors_string"
		unset IFS;	
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
		echo "-- Delta file for $checkout_id successfully created." >&2
	else
		echo "!-- Delta file for $checkout_id left empty." >&2
	fi
fi

echo $success