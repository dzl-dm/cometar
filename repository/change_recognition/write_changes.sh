#!/bin/bash

conffile="$(dirname $0)/../config/conf.cfg"
from_date="2017-01-01 00:00:00"
until_date=$(date +'%Y-%m-%d %H:%M:%S')
only_recent_changes=0

while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
		-n)
			shift
			only_recent_changes=1
			newrev=$1
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
			;;
		-o)
			shift
			output_file=$1
			;;
	esac
	shift
done

source "$conffile"

if [ $only_recent_changes -eq 1 ]; then
	shopt -s nullglob
	from_date_number=$(date -d "$from_date" +%s)
	IFS=$'\n'
	for i in $(find "$CHANGESDIR/output" -type f -name '*.ttl'); do
		filename=$(basename "$i" .ttl)
		datestring=$(echo ${filename:22} | tr '_' ':')
		datenumber=$(date -d "$datestring" +%s)
		if [ $datenumber -gt $from_date_number ]; then
			from_date=$datestring
			from_date_number=$(date -d "$from_date" +%s)
		fi
	done
	unset IFS
	recent_line="$(git log -n 1 --pretty=format:"%H;%aI;%an" ${newrev})"
fi
echo "writing changes from $from_date to $until_date"

checkouts_directory="$CHANGESDIR/checkouts"
mkdir -p "$checkouts_directory"
output_csv="$CHANGESDIR/output/$(echo $from_date | tr ':' '_') - $(echo $until_date | tr ':' '_').csv"
output_ttl="$CHANGESDIR/output/$(echo $from_date | tr ':' '_') - $(echo $until_date | tr ':' '_').ttl"
echo -n "" > "$output_csv"

while read line || [ -n "$line" ]; do #second expression is needed cause the last git log line does not end with a newline
	echo $line
	IFS=$';'; 
	read -r -a array <<< "$line"
	unset IFS;	
	checkout_id=${array[0]}	
	commit_author=${array[2]}	
	commit_date=${array[1]}	
	echo $("$CHANGESDIR/extract_changes_from_checkout.sh" -p "$conffile" -i $checkout_id -a "$commit_author" -d "$commit_date" -o "$output_csv" -c "$checkouts_directory")
done < <(cd "$TEMPDIR/git"; unset GIT_DIR; git checkout -q master; if [ -n "$recent_line" ] ; then echo "$recent_line"; fi; git log --pretty=format:"%H;%aI;%an" --since="$from_date" --before="$until_date" --no-merges)

sort -t $',' -k 2,2 -k 3,3 -k 4,4 -k 1,1 "$output_csv" > "$CHANGESDIR/output/changes_sorted.csv"
gawk -f "$CHANGESDIR/insert_changes_record_splitter.awk" -v output="$CHANGESDIR/output/changes_sorted_splitted.csv" "$CHANGESDIR/output/changes_sorted.csv"
gawk -f "$CHANGESDIR/extract_changes_from_changefile.awk" -v output="$output_ttl" "$CHANGESDIR/output/changes_sorted_splitted.csv"
rm "$CHANGESDIR/output/changes_sorted.csv"
rm "$CHANGESDIR/output/changes_sorted_splitted.csv"
rm "$output_csv"