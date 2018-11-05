#!/bin/bash

newrev=master

conffile=$(realpath $(dirname $0)/../config/conf.cfg)
while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$1
			;;
		-r)
			shift
			newrev=$1
			;;
	esac
	shift
done

source "$conffile"

unset GIT_DIR;
rm -rf "$TEMPDIR/git"
mkdir -p "$TEMPDIR/git"
eval "$GITBIN clone -q \"$TTLDIRECTORY\" \"$TEMPDIR/git\""
cd "$TEMPDIR/git"
eval "$GITBIN checkout -q $newrev"

echo "---------------- POST RECEIVE ---------------------"
echo "POST RECEIVE $(date)" >> "$LOGFILE"
cd "$TEMPDIR/git"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -t -c -d "$TEMPDIR/git" -p "$conffile" -e "$LOGFILE"
echo "export.ttl is being produced."
echo "export.ttl is being produced." >> "$LOGFILE" 
"$SCRIPTDIR/export_rdf.sh" -p "$conffile"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p "$conffile" -e "$LOGFILE"
echo "Provenance..."
echo "Provenance..." >> "$LOGFILE" 
"$PROVENANCESCRIPTDIR/write_provenance.sh" -p "$conffile"
"$SCRIPTDIR/add_files_to_dataset.sh" -s -h -p "$conffile" -e "$LOGFILE"
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
PGPASSWORD=$I2B2DMPW /usr/bin/psql -q --host=$I2B2HOST --username=$I2B2DMUSER --dbname=$I2B2DBNAME -f "$SCRIPTDIR/patient_count.sql"
echo -------------------------------------
