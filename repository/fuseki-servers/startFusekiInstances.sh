#!/bin/sh

source $(dirname $0)/../config/conf.cfg

screen -dm /usr/lib/jvm/java-8-openjdk-amd64/jre/bin/java -jar $FUSEKIDIR/fuseki-server.jar --config=$FUSEKIDIR/fuseki_cometar_config.ttl

rm -rf $TEMPDIR/git
mkdir -p $TEMPDIR/git
env -i -- git clone -q $TTLDIRECTORY $TEMPDIR/git
cd $TEMPDIR/git
env -i -- git checkout master

$SCRIPTDIR/add_files_to_dataset.sh -s

rm -r $TEMPDIR