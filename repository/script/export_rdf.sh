#!/bin/bash

conffile="$(dirname $0)/../config/conf.cfg"
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
curl -s -X GET -G "$FUSEKITESTDATASET/data?default" > "$TEMPDIR/export.ttl"
