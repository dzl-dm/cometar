#!/bin/bash

source $(dirname $0)/../config/conf.cfg
cd $(dirname $0)
mkdir -p $TEMPDIR/i2b2-sql
rm -f $TEMPDIR/i2b2-sql/*.sql
/usr/lib/jvm/java-8-openjdk-amd64/jre/bin/java -cp dependency/\* de.dzl.dm.meta.SQLWriter ontology.properties $TEMPDIR/i2b2-sql $TEMPDIR/export.ttl
rm $TEMPDIR/export.ttl
