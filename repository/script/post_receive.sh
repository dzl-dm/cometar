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

echo "---------------- POST RECEIVE ---------------------"
echo "export.ttl is being produced."
echo "export.ttl is being produced." >> "$LOGFILE" 
"$SCRIPTDIR/export_rdf.sh" -p "$conffile"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p "$conffile"
echo "Provenance..."
echo "Provenance..." >> "$LOGFILE" 
"$PROVENANCESCRIPTDIR/write_provenance.sh" -p "$conffile"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -h -p "$conffile"
echo "i2b2 import sql is being produced."
echo "i2b2 import sql is being produced." >> "$LOGFILE" 
"$TTLTOSQLDIR/write-sql.sh" -p "$conffile"
echo "Metadata import into i2b2 server part 1..."
echo "Metadata import into i2b2 server part 1..." >> "$LOGFILE" 
PGPASSWORD=$I2B2METAPW /usr/bin/psql -q --host=$I2B2HOST --username=$I2B2METAUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/meta.sql"
echo "Metadata import into i2b2 server part 2..."
echo "Metadata import into i2b2 server part 2..." >> "$LOGFILE" 
PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/data.sql"
echo "Refreshing patient count..."
echo "Refreshing patient count..." >> "$LOGFILE" 
"$SCRIPTDIR/update_patient_count.sh" -p "$conffile"
echo -------------------------------------