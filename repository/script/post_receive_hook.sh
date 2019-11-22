#!/bin/bash

newrev=master

conffile=$(realpath $(dirname $0)/../config/conf.cfg)
while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$(realpath "$1")
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
branch=$(git name-rev --name-only $newrev | sed -e 's/\(.*\)~[0-9]\+/\1/g' | sed -e 's/remotes\/origin\///g')
cd "$TEMPDIR"
rm -rf "$TEMPDIR/git"

branch_parameter=""
if [ $branch == "ontology_dev" ]; then
	branch_parameter="-b"
fi

echo "$(date +'%d.%m.%y %H:%M:%S') ---------------- POST RECEIVE ---------------------"
echo "$(date +'%d.%m.%y %H:%M:%S') ---------------- POST RECEIVE ---------------------" >> "$LOGFILE"

echo "Adding files to Fuseki Server. Commit: ${newrev}. Branch name: $branch"
echo "Adding files to Fuseki Server. Commit: ${newrev}. Branch name: $branch" >> "$LOGFILE" 
"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p "$conffile" $branch_parameter -e "$LOGFILE" -r $newrev

if [ "$branch" == "master" ]; then
	# calc last hook call
	from_date="2017-01-01 00:00:00"
	shopt -s nullglob
	from_date_number=$(date -d "$from_date" +%s)
	IFS=$'\n'
	for i in $(find "$PROVENANCEFILESDIR/output" -type f -name '*.ttl'); do
		filename=$(basename "$i" .ttl)
		filecheck=$(expr $filename : '^\([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]_[0-9][0-9]_[0-9][0-9] - [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]_[0-9][0-9]_[0-9][0-9]\)')
		if [ "$filecheck" != "" ]; then
			datestring=$(echo ${filename:22} | tr '_' ':')
			if ! testdate=$(date -d "$datestring" +"%Y-%m-%d %H:%M:%S") ; then
				continue
			fi
			datenumber=$(date -d "$datestring" +%s)
			if [ $datenumber -gt $from_date_number ]; then
				from_date=$datestring
				from_date_number=$(date -d "$from_date" +%s)
			fi
		fi
	done
	unset IFS
	# calc last hook call end	
	echo "$(date +'%d.%m.%y %H:%M:%S') Provenance..."
	echo "$(date +'%d.%m.%y %H:%M:%S') Provenance..." >> "$LOGFILE" 
	newrevargument=""
	if [ "$newrev" != "" ]; then
		newrevargument="-n $newrev"
	fi
	"$PROVENANCESCRIPTDIR/write_provenance.sh" -p "$conffile" -f "$from_date" "$newrevargument"
	"$SCRIPTDIR/add_files_to_dataset.sh" -s -h -p "$conffile" -e "$LOGFILE"
	
	
	
	"$SCRIPTDIR/add_files_to_dataset.sh" -s -t -c -p "$conffile" -e "$LOGFILE"
	echo "$(date +'%d.%m.%y %H:%M:%S') export.ttl is being produced."
	echo "$(date +'%d.%m.%y %H:%M:%S') export.ttl is being produced." >> "$LOGFILE" 
	"$SCRIPTDIR/export_rdf.sh" -p "$conffile"

	echo "$(date +'%d.%m.%y %H:%M:%S') i2b2 import sql is being produced."
	echo "$(date +'%d.%m.%y %H:%M:%S') i2b2 import sql is being produced." >> "$LOGFILE" 
	"$TTLTOSQLDIR/write-sql.sh" -p "$conffile"
	echo "$(date +'%d.%m.%y %H:%M:%S') Metadata import into i2b2 server part 1..."
	echo "$(date +'%d.%m.%y %H:%M:%S') Metadata import into i2b2 server part 1..." >> "$LOGFILE" 
	PGPASSWORD=$I2B2METAPW /usr/bin/psql -v ON_ERROR_STOP=1 -v statement_timeout=120000 -L "$TEMPDIR/postgres.log" -q --host=$I2B2HOST --username=$I2B2METAUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/meta.sql"
	if [ $? -eq 1 ] || [ $? -eq 2 ] || [ $? -eq 3 ]; then
		echo "PostgreSQL command failed."
		curl -X POST https://data.dzl.de/biomaterial_request/sendform.php -H "Content-Type: application/x-www-form-urlencoded" -d "formtype=postgresql_fail&log=$(cat '$TEMPDIR/postgres.log')"
	fi
	echo "$(date +'%d.%m.%y %H:%M:%S') Metadata import into i2b2 server part 2..."
	echo "$(date +'%d.%m.%y %H:%M:%S') Metadata import into i2b2 server part 2..." >> "$LOGFILE" 
	PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -v ON_ERROR_STOP=1 -v statement_timeout=120000 -L "$TEMPDIR/postgres.log" -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/data.sql"
	if [ $? -eq 1 ] || [ $? -eq 2 ] || [ $? -eq 3 ]; then
		echo "PostgreSQL command failed."
		curl -X POST https://data.dzl.de/biomaterial_request/sendform.php -H "Content-Type: application/x-www-form-urlencoded" -d "formtype=postgresql_fail&log=$(cat '$TEMPDIR/postgres.log')"
	fi
	echo "$(date +'%d.%m.%y %H:%M:%S') Refreshing patient count..."
	echo "$(date +'%d.%m.%y %H:%M:%S') Refreshing patient count..." >> "$LOGFILE" 
	PGPASSWORD=$I2B2DMPW /usr/bin/psql -v ON_ERROR_STOP=1 -v statement_timeout=120000 -L "$TEMPDIR/postgres.log" -q --host=$I2B2HOST --username=$I2B2DMUSER --dbname=$I2B2DBNAME -f "$SCRIPTDIR/patient_count.sql"
	if [ $? -eq 1 ] || [ $? -eq 2 ] || [ $? -eq 3 ]; then
		echo "PostgreSQL command failed."
		curl -X POST https://data.dzl.de/biomaterial_request/sendform.php -H "Content-Type: application/x-www-form-urlencoded" -d "formtype=postgresql_fail&log=$(cat '$TEMPDIR/postgres.log')"
	fi
	
	
	
	echo "$(date +'%d.%m.%y %H:%M:%S') Sending notifications..."
	"$NOTIFICATIONDIR/notification.sh" -p "$conffile" -f "$from_date"
fi
echo -------------------------------------
chown -R cometar:cometar "$PROVENANCEFILESDIR"
