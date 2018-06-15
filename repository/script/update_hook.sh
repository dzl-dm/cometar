#!/bin/bash

source $(dirname $0)/../config/conf.cfg

refname=$1
oldrev=$2
newrev=$3

rm -rf $TEMPDIR/git
mkdir -p $TEMPDIR/git
env -i -- git clone -q $TTLDIRECTORY $TEMPDIR/git
cd $TEMPDIR/git
env -i -- git checkout -q $newrev

exitcode=0
echo -------------------------------------
echo "Loading files into fuseki test server..."
$SCRIPTDIR/add_files_to_dataset.sh -s -t -c -d $TEMPDIR/git
insertexitcode=$?
if [ $insertexitcode -eq 0 ]
then
        echo "Files successfully loaded into fuseki test server."
else
        echo "At least one file failed to load."
        exitcode=1
fi
echo -------------------------------------
echo "Performing tests..."
$SCRIPTDIR/exec_tests.sh
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

if [ $testexitcode -ne 1 ]
then
	echo "export.ttl is being produced."
	$SCRIPTDIR/export_rdf.sh
	$SCRIPTDIR/add_files_to_dataset.sh -s -c
	echo "i2b2 import sql is being produced."
	$TTLTOSQLDIR/write-sql.sh
	echo "Metadata import into i2b2 server part 1..."
	PGPASSWORD=i2b2metadata /usr/bin/psql -q --host=localhost --username=i2b2metadata --dbname=i2b2 -f $TEMPDIR/i2b2-sql/meta.sql
	echo "Metadata import into i2b2 server part 2..."
	PGPASSWORD=i2b2demodata /usr/bin/psql -q --host=localhost --username=i2b2demodata --dbname=i2b2 -f $TEMPDIR/i2b2-sql/data.sql
	echo "Refreshing patient count..."
	cd $SCRIPTDIR
	./update_patient_count.sh
	echo -------------------------------------
fi
 
rm -r $TEMPDIR
exit $exitcode

