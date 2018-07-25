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

# RUN SQL FOR CRC
export PGPASSWORD=i2b2dm
psql -h localhost -U i2b2dm i2b2 -f patient_count.sql
