#!/bin/bash

source $(dirname $0)/../config/conf.cfg
endpoint="$FUSEKITESTDATASET/query"
errorfile=$TEMPDIR/fehler.txt
EXITCODE=0
YELLOW='\033[0;33m'
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
echo "----------test for english label"
curl -s --data-urlencode query="$(< $TESTDIR/has_no_en_label.query)" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"concept\"' > $errorfile
errorcount=$(wc -l $errorfile | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${RED}Folgende Konzepte haben kein englisches Label:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" $errorfile | sed "s/.*/\\${RED}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
        EXITCODE=1
else
	echo -e "${GREEN}OK${NC}"
fi
echo "----------test for path to root label"
curl -s --data-urlencode query="$(< $TESTDIR/has_no_path_to_top.query)" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"concept\"' > $errorfile
errorcount=$(wc -l $errorfile | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${YELLOW}Folgende Konzepte haben keine Anknüpfung an ein Wurzelelement:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" $errorfile | sed "s/.*/\\${YELLOW}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
	if [ ! $EXITCODE -eq 1 ]
	then
		EXITCODE=2
	fi
else
	echo -e "${GREEN}OK${NC}"
fi
echo "----------test for notation duplicate"
curl -s --data-urlencode query="$(< $TESTDIR/notation_duplicate.query)" -G "$FUSEKITESTDATASET/query" | grep '^\s*\"notation\"' > $errorfile
errorcount=$(wc -l $errorfile | cut -d " " -f 1)
if [ $errorcount -gt 0 ]
then
        echo -e "${RED}Folgende Notationen kommen mehrfach vor:${NC}"
        sed -e "s/^.*\"value\":.\"\(.*\)\".*$/\1/" $errorfile | sed "s/.*/\\${RED}\\0\\${NC}/" | sed 's/\\/\\\\/g' | xargs -L 1 echo -e
	EXITCODE=1
else
	echo -e "${GREEN}OK${NC}"
fi
exit $EXITCODE
