#!/bin/bash
echo "$0 $@"

FUSEKI_SERVER=$FUSEKI_TEST_SERVER

while [ ! $# -eq 0 ]
do
	case "$1" in
		-s|--fuseki-server)
			if [ "$2" ]; then
				FUSEKI_SERVER=$2
			else
				echo "ERROR: No Fuseki server argument given." >&2
				exit 1
			fi
			shift
			;;
	esac
	shift
done

if [ "$FUSEKI_SERVER" == "" ]; then
	echo "ERROR: No Fuseki server defined." >&2
	exit 1
fi

echo "Loading files into fuseki test server."

echo "Clearing data."
STATUSCODE=$(curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" -s -w "%{http_code}" -o /dev/null -G "$FUSEKI_SERVER/data" -d default --data "") 
if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
then
	echo "ERROR: Fuseki server $FUSEKI_SERVER not available." >&2
	exit 1
fi

echo "Adding files."
for line in $COMETAR_TEMP_DIR/checkout/*.ttl
do
	filename="$line"
	echo "Adding file \"$(basename "$filename")\"."
	STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" -s -w "%{http_code}" -o /dev/null -T "$filename" -G "$FUSEKI_SERVER/data" -d default) 
	if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
	then
		echo "ERROR: Error adding $filename." >&2
		EXITCODE=1
	fi
done

echo "Inserting rules."
STATUSCODE=$(curl -X POST -H "Content-Type: application/sparql-update;charset=utf-8" -s -w "%{http_code}" -o /dev/null -T "$COMETAR_PROD_DIR/rdf_loading/insertrules.ttl" -G "$FUSEKI_SERVER/update")
if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
then
	echo "ERROR: Error adding inserting rules." >&2
	EXITCODE=1
fi

exit $EXITCODE
