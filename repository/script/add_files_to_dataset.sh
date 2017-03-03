#!/bin/bash

source $(dirname $0)/../config/conf.cfg
cleardata=false
directory=`dirname $0`
port=3030
silentmode=""
testmode=false

while [ ! $# -eq 0 ]
do
	case "$1" in
		-t)
			port=3031
			testmode=true
			;;
		-d)	
			shift
			directory=$1
			;;
		-c)
			cleardata=true
			;;
		-s)
			silentmode="--silent"
			;;
	esac
	shift
done

s=""
if $cleardata; then
	s="Clearing data. " 
fi
s=$s"Adding files from $directory to fuseki server on port ${port}."
#echo $s

EXITCODE=0

if $cleardata; then
	if $testmode; 
	then
		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G $FUSEKITESTDATASET/data -d default --data ""
	else
  		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G $FUSEKILIVEDATASET/data -d default --data ""
	fi
fi

if $testmode; then
	for filename in $directory/*.ttl; do
		echo "Adding file $(basename "$filename")."
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output /dev/stderr -w "%{http_code}" -T "$filename" -G $FUSEKITESTDATASET/data -d default) 
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
       		 	EXITCODE=1
		fi
	done
	echo "Inserting rules"
	endpoint="$FUSEKITESTDATASET/update"
	curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G $endpoint
else
        echo "Loading dataset into live server."
        STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output /dev/stderr -w "%{http_code}" -T "$TEMPDIR/export.ttl" -G $FUSEKILIVEDATASET/data -d default)
        if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
        then
		EXITCODE=1
       	fi
fi

exit $EXITCODE
