#!/bin/bash

conffile=$(dirname $0)/../config/conf.cfg
newrev="master"

while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
		-n)
			shift
			newrev=$1
			;;
	esac
	shift
done

source "$conffile"

"$CHANGESDIR/write_changes.sh" -p "$conffile" -n $newrev