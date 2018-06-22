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

source $conffile
cd $(dirname $0)
mkdir -p $TEMPDIR/i2b2-sql
rm -f $TEMPDIR/i2b2-sql/*.sql
"$JAVADIR" -cp dependency/\* de.dzl.dm.meta.SQLWriter ontology.properties $TEMPDIR/i2b2-sql $TEMPDIR/export.ttl
rm $TEMPDIR/export.ttl
