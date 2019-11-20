#!/bin/bash

conffile=$(dirname $0)/../config/conf.cfg
cleardata=false
DIRECTORY=`dirname $0`
defaultdirectory=true
port=3030
silentmode=""
testmode=false
loadProvenanceFiles=false
emf="/dev/stderr"
revision="master"

while [ ! $# -eq 0 ]
do
	case "$1" in
		-t)
			port=3031
			testmode=true
			;;
		-d)	
			shift
			DIRECTORY=$1
			defaultdirectory=false
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
		-r)
			shift
			revision=$1
			;;
	esac
	shift
done

source "$conffile"
echo "Adding files to fuseki script called."
EXITCODE=0

SERVERDATA="$FUSEKILIVEDATASET/data"
SERVERUPDATE="$FUSEKILIVEDATASET/update"
RULESFILE="$CONFDIR/insertrules.ttl"
if $testmode; then 
	SERVERDATA="$FUSEKITESTDATASET/data"
	SERVERUPDATE="$FUSEKITESTDATASET/update"
	echo "Operating on test server."
fi
if $defaultdirectory; then
	if $loadProvenanceFiles; then
		DIRECTORY="$PROVENANCEFILESDIR/output"
		RULESFILE="$CONFDIR/provenance_derivations.ttl"
		echo "Operating provenance."
	else
		DIRECTORY="$TEMPDIR/git"
		unset GIT_DIR;
		rm -rf "$TEMPDIR/git"
		mkdir -p "$TEMPDIR/git"
		eval "$GITBIN clone -q \"$TTLDIRECTORY\" \"$TEMPDIR/git\""
		cd "$TEMPDIR/git"
		eval "$GITBIN checkout -q $revision"
	fi
fi

touch "$TEMPDIR/out.txt"
if $cleardata; then
	echo "Clearing data."
	curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G "$SERVER" -d default --data ""
fi

echo "Adding files."
for line in "$DIRECTORY"/*.ttl
do
	filename="$line"
	echo "Adding file $(basename "$filename")."
	STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output "$TEMPDIR/out.txt" -w "%{http_code}" -T "$filename" -G "$SERVERDATA" -d default) 
	if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
	then
		echo "$filename" >> "$emf"
		cat "$TEMPDIR/out.txt" >> "$emf"
		EXITCODE=1
	fi
done
echo "Inserting rules."
curl -X POST -s -T "$RULESFILE" -G "$SERVERUPDATE"

if [[ $defaultdirectory && !$loadProvenanceFiles ]]; then
	rm -rf "$TEMPDIR/git"
fi

exit $EXITCODE