#!/bin/bash

source $(dirname $(realpath $0))/../config/conf.cfg

screen -dm /usr/lib/jvm/java-8-openjdk-amd64/jre/bin/java -jar $FUSEKIFILE --config=$(realpath $CONFDIR/fuseki_cometar_config.ttl)

sleep 5

rm -rf $TEMPDIR/git
mkdir -p $TEMPDIR/git
env -i -- git clone -q $TTLDIRECTORY $TEMPDIR/git
cd $TEMPDIR/git

for filename in ./*.ttl; do
		echo "Adding file $(basename "$filename")."
		curl -X POST -H "Content-Type: text/turtle;charset=utf-8" -T "$filename" -G $FUSEKILIVEDATASET/data -d default
	done
echo "Adding insertrules.ttl"
curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G "$FUSEKILIVEDATASET/update"

rm -r $TEMPDIR
