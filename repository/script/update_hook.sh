#!/bin/bash

newrev=master

conffile=$(dirname $0)/../config/conf.cfg
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
"$GITBIN" clone -q "$TTLDIRECTORY" "$TEMPDIR/git"
cd "$TEMPDIR/git"
"$GITBIN" checkout -q $newrev

exitcode=0
echo -------------------------------------
echo "Loading files into fuseki test server..."
"$SCRIPTDIR/add_files_to_dataset.sh" -s -t -c -d "$TEMPDIR/git" -p "$conffile"
insertexitcode=$?
if [ $insertexitcode -eq 0 ]
then
	echo "Files successfully loaded into fuseki test server."
	echo "Performing tests..."
	"$SCRIPTDIR/exec_tests.sh" -p "$conffile"
	testexitcode=$?
	case $testexitcode in
			0)
					echo "All tests passed."
					echo "-------------------------------------"
					;;
			1)
					echo "Tests resulted in errors."
					echo "-------------------------------------"
					exitcode=1
					;;
			2)
					echo "Tests resulted in warnings."
					echo "-------------------------------------"
					;;
	esac
else
	echo "At least one file failed to load."
	exitcode=1
fi
echo -------------------------------------


if [ $exitcode -eq 0 ]
then
	echo "export.ttl is being produced."
	"$SCRIPTDIR/export_rdf.sh" -p "$conffile"
	"$SCRIPTDIR/add_files_to_dataset.sh" -s -c -p "$conffile"
	echo "Writing changefiles."
	"$SCRIPTDIR/write_recent_changes_ttl.sh" -p "$conffile" -n $newrev
	"$SCRIPTDIR/add_files_to_dataset.sh" -s -h -p "$conffile"
	echo "i2b2 import sql is being produced."
	"$TTLTOSQLDIR/write-sql.sh" -p "$conffile"
	echo "Metadata import into i2b2 server part 1..."
	PGPASSWORD=$I2B2METAPW /usr/bin/psql -q --host=$I2B2HOST --username=$I2B2METAUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/meta.sql"
	echo "Metadata import into i2b2 server part 2..."
	PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -f "$TEMPDIR/i2b2-sql/data.sql"
	echo "Refreshing patient count..."
	"$SCRIPTDIR/update_patient_count.sh" -p "$conffile"
	echo -------------------------------------
fi
 
#rm -r $TEMPDIR

echo "-------------"
if [ $exitcode -gt 0 ]; then echo "UPLOAD FAILED"
else echo "UPLOAD SUCCEED"
fi
echo "-------------"
exit $exitcode

