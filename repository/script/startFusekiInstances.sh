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

screen -dm "$JAVADIR" -jar "$FUSEKIFILE" --config=$(realpath $CONFDIR/fuseki_cometar_config.ttl)

sleep 5

rm -rf "$TEMPDIR/git"
mkdir -p "$TEMPDIR/git"
env -i -- git clone -q "$TTLDIRECTORY" "$TEMPDIR/git"
cd "$TEMPDIR/git"

"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p "$conffile" -e "$LOGFILE"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p -h "$conffile" -e "$LOGFILE"

rm -rf "$TEMPDIR/git"
