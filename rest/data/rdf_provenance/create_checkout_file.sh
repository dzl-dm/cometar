#!/bin/bash

conffile="/config/conf.cfg"

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

sparql_query="PREFIX skos:    <http://www.w3.org/2004/02/skos/core#> \
		SELECT ?a ?b (lang(?c) as ?d) ?e WHERE {
		{
			?a ?b ?c .
			FILTER (isLiteral(?c))
			BIND(REPLACE(?c, '(\r|\n)*', '', 'i') AS ?e)
		}
		UNION
		{
			?a ?b ?c .
			FILTER (!isLiteral(?c))
			BIND(?c AS ?e)
		}
		FILTER NOT EXISTS {
			?a skos:changeNote ?c .
		}
		FILTER NOT EXISTS {
			?x skos:changeNote [ ?y ?c ] .
		}
		FILTER NOT EXISTS {
			?x skos:changeNote [ ?y1 [ ?y2 ?c ] ] .
		}
	}
	ORDER BY ?a ?b ?d ?c"

function write_triplestore_to_file() {
	filename="$1"
	echo "++ Writing fuseki content to file $filename." >&2
	local success=1
	curl -H "Accept: text/csv" -G "$FUSEKITESTDATASET/query" -s -w "%{http_code}" --data-urlencode query="$sparql_query" >> "$filename"
	echo $success
}

function apply_ttl_rules() {
	echo "++ Applying rules." >&2
	STATUSCODE=$(curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G "$FUSEKITESTDATASET/update" -w "%{http_code}" -o /dev/null)
	local success=0;
	if [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]; then
		success=1
	fi
	echo $success
}

function load_all_ttl_files() {
	echo "++ Loading files into Fuseki Server." >&2
	curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" -G "$FUSEKITESTDATASET/data" -d default -s >&2
	number_of_failed_uploads=0
	shopt -s nullglob
	IFS=$'\n'
	for filename in $(find "$TEMPDIR/git" -type f -name '*.ttl'); do
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" -s -f -w "%{http_code}" -T "$filename" -G "$FUSEKITESTDATASET/data" -d default -o /dev/null)
		echo "Status: $STATUSCODE" >&2
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
       		let number_of_failed_uploads+=1;
			echo "!++ Error during loading of file ${filename}. Statuscode: $STATUSCODE" >&2
			break;
		fi
	done
	unset IFS
	local success=1
	if [ $number_of_failed_uploads -gt 0 ] ; then
		success=0
	fi
	echo $success
}

checkouts_directory="$PROVENANCEFILESDIR/checkouts"
mkdir -p "$checkouts_directory"
output_file="${checkouts_directory}/${checkout_id}.csv"

echo "++ Saving commit $checkout_id to file." >&2
echo "Using shell: $SHELL" >&2
if [ -f "$output_file.invalid" ]; then
	echo "++ File $output_file was marked as invalid commit." >&2
	success=0
else
	if [ -f "$output_file" ]; then
		echo "++ File $output_file exists." >&2
		success=1
	else
		$(cd "$TEMPDIR/git"; unset GIT_DIR; git checkout --quiet $checkout_id)
		success=$(load_all_ttl_files)
		echo "Success: $success" >&2
		if [ $success -eq 1 ]; then
			success=$(apply_ttl_rules)
			if [ $success -eq 1 ]; then
				success=$(write_triplestore_to_file "$output_file")
			fi
		fi
	fi
	if [ $success -eq 1 ]; then
		echo "++ $output_file successfully created." >&2
	else
		echo -n "" > "$output_file.invalid"
		echo "!++ $output_file is now marked as invalid commit." >&2
	fi
fi
echo $success
