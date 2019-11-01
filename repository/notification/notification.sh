#!/bin/bash

conffile=$(realpath $(dirname $0)/../config/conf.cfg)
from_date=$(date +'%Y-%m-%d %H:%M:%S')
until_date=$(date +'%Y-%m-%d %H:%M:%S')
while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$(realpath $1)
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
	esac
	shift
done

source "$conffile"

#get all commit ids since the last check
cd "$TEMPDIR/git"
read -r -a commitids <<< $(git log --pretty=format:"%H" --since="$from_date" --before="$until_date")
rdfcommitids=""
for i in ${commitids[@]}; do
	if [ "$rdfcommitids" == "" ]; then
		rdfcommitids=":commit_${i}"
	else
		rdfcommitids+=",:commit_${i}"
	fi
done

### get all notations that have been removed since the last check
query=$(sed 's/<COMMITIDS>/'$rdfcommitids'/' "$NOTIFICATIONDIR/notationupdates.query")
code=""
while read i; do
	IFS=","
	if [ "$code" == "" ]; then #omit first line
		code=" "
	else
		read -r -a triple <<< "$i"
		code=$(echo ${triple[2]} | tr -d '\r')
		if [ "$notations" == "" ]; then
			notations="'${code}'"
		else
			notations="$notations,'$code'"
		fi
	fi
	unset IFS
done < <(curl -s -H "Accept: text/csv;charset=utf-8" -G "https://data.dzl.de/fuseki/cometar_live/query" --data-urlencode query="$query")

#if [ "$notations" == "" ]; then
	#exit 0
#fi
echo "Removed/changed notations since last check: $notations"

### get all affected sources and loose concepts
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_affected_sources_by_notation.sql")
affectedsourcesbynotation=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_affected_sources_by_source.sql")
affectedsourcesbysource=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_loose_mappings.sql")
loosemappingstable=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")
loosemappingstablewithoutblanks=$(echo $loosemappingstable | sed 's/&nbsp;//g')

### suggestion sql update
query=$(cat "$NOTIFICATIONDIR/get_loose_notations.sql")
loosenotations=""
while read n; do
	if [ "$loosenotations" == "" ]; then
		loosenotations="'${n}'"
	else
		loosenotations="$loosenotations,'$n'"
	fi
done < <(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -t -A -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")

echo "Loose notations: $loosenotations"

query=$(sed 's|<NOTATIONS>|'"${loosenotations}"'|' "$NOTIFICATIONDIR/get_new_notation.query")
suggestedsql=""
while read i; do
	IFS=","
	read -r -a triple <<< "$i"
	concept=$(echo ${triple[0]} | tr -d '\r')
	notation=$(echo ${triple[1]} | tr -d '\r')
	newnotation=$(echo ${triple[2]} | tr -d '\r')
	if [ "$newnotation" != "newnotation" ]; then
		suggestedsql+="UPDATE i2b2demodata.observation_fact SET concept_cd = '${newnotation}' WHERE concept_cd = '${notation}'; <br>"
	fi
	unset IFS
done < <(curl -s -H "Accept: text/csv;charset=utf-8" -G "https://data.dzl.de/fuseki/cometar_live/query" --data-urlencode query="$query")

curl -X POST https://data.dzl.de/biomaterial_request/sendform.php -H "Content-Type: application/x-www-form-urlencoded" -d "formtype=notation_changes&commit_ids=${rdfcommitids}&affected_sources_by_source=${affectedsourcesbysource}&affected_sources_by_notation=${affectedsourcesbynotation}&loose_mappings=${loosemappingstablewithoutblanks}&suggested_sql=${suggestedsql}"

exit 0
