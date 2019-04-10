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

for filename in ./*.ttl; do
		echo "Adding file $(basename "$filename")."
		curl -X POST -H "Content-Type: text/turtle;charset=utf-8" -T "$filename" -G "$FUSEKILIVEDATASET/data" -d default
	done
echo "Adding insertrules.ttl"
curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G "$FUSEKILIVEDATASET/update"

rm -rf "$TEMPDIR/git"
