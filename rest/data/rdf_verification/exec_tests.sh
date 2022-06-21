#!/bin/bash
echo "$0 $@"

EXITCODE=0
df="[%Y-%m-%d %H:%M:%S]"

echo "$(date +"$df") Verifying dataset."

summary=""
while read line
do
    IFS=';'
    read -r -a params <<< "$line"
	filename="$COMETAR_PROD_DIR/rdf_verification/tests/${params[0]}"
	description="${params[1]}"
	severity="${params[2]}"
	echo "---- Running test: $(basename "$filename") - $description"

    invalid_findings=$(curl -s --data-urlencode query="$(< """$filename""")" -G "$FUSEKI_TEST_SERVER/query" -H 'Accept: text/csv' | tail -n +2)

    if [ ! "$invalid_findings" == "" ]; then
        if [ "$severity" == "error" ]; then
            echo "$invalid_findings"
            EXITCODE=1
        fi
        if [ "$severity" == "hint" ]; then
            echo "$invalid_findings"
        fi
        summary="$summary\n$severity: $filename"
    else
        echo "Test '$filename' OK"
        summary="$summary\nOK: $filename"
    fi
done < "$COMETAR_PROD_DIR/rdf_verification/test.conf"

echo "----$(date +"$df") Test summary ----"
printf "$summary\n\n"
echo "----------------------"

exit $EXITCODE
