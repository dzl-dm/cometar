#!/bin/bash

conffile=$(dirname $0)/../config/conf.cfg
cleardata=false
directory=`dirname $0`
port=3030
silentmode=""
testmode=false
loadProvenanceFiles=false
emf="/dev/stderr"

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
		-e)	
			shift
			emf=$1
			;;
		-c)
			cleardata=true
			;;
		-s)
			silentmode="--silent"
			;;
		-h)
			loadProvenanceFiles=true
			;;
		-p)
			shift
			conffile=$1
			;;
	esac
	shift
done

source "$conffile"
echo "Adding files to fuseki script called."
EXITCODE=0

touch "$TEMPDIR/out.txt"
if $cleardata; then
	if $testmode; 
	then
		echo "Clearing test server data."
		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G "$FUSEKITESTDATASET/data" -d default --data ""
	else
		echo "Clearing live server data."
  		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G "$FUSEKILIVEDATASET/data" -d default --data ""
	fi
fi
if $testmode; then
	echo "Adding files to test server."
	shopt -s nullglob
	while read line ; do
		filename=$line
		echo "Adding file $(basename "$filename")."
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output "$TEMPDIR/out.txt" -w "%{http_code}" -T "$filename" -G "$FUSEKITESTDATASET/data" -d default) 
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
			echo "$filename" >> "$emf"
			cat "$TEMPDIR/out.txt" >> "$emf"
       		EXITCODE=1
		fi
	done < <(find "$directory" -iname '*.ttl')
	echo "Inserting rules"
	endpoint="$FUSEKITESTDATASET/update"
	curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G "$endpoint"
else
	echo "Adding files to live server."
	endpoint="$FUSEKILIVEDATASET/update"
	if $loadProvenanceFiles; then
		echo "Loading provenance files into live server."
		shopt -s nullglob
		while read line ; do
			filename=$line
			echo "Adding file $(basename "$filename")."
			STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output "$TEMPDIR/out.txt" -w "%{http_code}" -T "$filename" -G "$FUSEKILIVEDATASET/data" -d default) 
			if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
			then
				echo "$filename" >> "$emf"
				cat "$TEMPDIR/out.txt" >> "$emf"
				EXITCODE=1
			fi
		done < <(find "$PROVENANCEFILESDIR/output" -iname '*.ttl')
		echo "Inserting derivations"
		curl -X POST -s -T "$CONFDIR/provenance_derivations.ttl" -G "$endpoint" 
	else
		echo "Loading dataset into live server."
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output "$TEMPDIR/out.txt" -w "%{http_code}" -T "$TEMPDIR/export.ttl" -G "$FUSEKILIVEDATASET/data" -d default)
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
			echo "$filename" >> "$emf"
			cat "$TEMPDIR/out.txt" >> "$emf"
			EXITCODE=1
		fi
	fi
fi

exit $EXITCODE
