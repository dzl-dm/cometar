#!/bin/bash

conffile=$(dirname $0)/../config/conf.cfg
while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
	esac
	shift
done

source "$conffile"
endpoint="$FUSEKITESTDATASET/query"
errorfile="$TEMPDIR/fehler.txt"
EXITCODE=0
YELLOW='\033[0;33m'
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
echo "----------Test for exactly one english prefLabel"
curl -s --data-urlencode query="$(< """$TESTDIR/has_not_exactly_one_en_preflabel.query""")" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"concept\"' > "$errorfile"
errorcount=$(wc -l "$errorfile" | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${RED}These concepts do not have exactly one english prefLabel:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" "$errorfile" | sed "s/.*/\\${RED}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
        EXITCODE=1
else
	echo -e "${GREEN}OK${NC}"
fi
echo "----------Test for loose concepts"
curl -s --data-urlencode query="$(< """$TESTDIR/has_no_path_to_top.query""")" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"concept\"' > "$errorfile"
errorcount=$(wc -l "$errorfile" | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${YELLOW}These concepts have no relation to any root element:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" "$errorfile" | sed "s/.*/\\${YELLOW}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
	if [ ! $EXITCODE -eq 1 ]
	then
		EXITCODE=2
	fi
else
	echo -e "${GREEN}OK${NC}"
fi
echo "----------Test for notation unambiguity"
curl -s --data-urlencode query="$(< """$TESTDIR/notation_duplicate.query""")" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"notation\"' > "$errorfile"
errorcount=$(wc -l "$errorfile" | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${RED}These notations are used for multiple different concepts:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" "$errorfile" | sed "s/.*/\\${RED}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
	EXITCODE=1
else
	echo -e "${GREEN}OK${NC}"
fi
exit $EXITCODE
