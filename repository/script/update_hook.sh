#!/bin/bash

source $(dirname $0)/../config/conf.cfg

refname=$1
oldrev=$2
newrev=$3

repdir=$(pwd)

rm -rf $TEMPDIR/git
mkdir -p $TEMPDIR/git
env -i -- git clone -q $repdir $TEMPDIR/git
cd $TEMPDIR/git
env -i -- git checkout -q $newrev

exitcode=0
echo -------------------------------------
echo "Dokumente werden in Fuseki-Testinstanz geladen..."
$SCRIPTDIR/add_files_to_dataset.sh -s -t -c -d $TEMPDIR/git
insertexitcode=$?
if [ $insertexitcode -eq 0 ]
then
        echo "Dokumente erfolgreich in Fuseki-Testinstanz geladen."
else
        echo "Mindestens ein Dokument konnte nicht geladen werden."
        exitcode=1
fi
echo -------------------------------------
echo "Tests werden durchgeführt..."
$SCRIPTDIR/exec_tests.sh
testexitcode=$?
case $testexitcode in
        0)
                echo "Alle Tests wurden erfolgreich bestanden."
                echo "-------------------------------------"
                ;;
        1)
                echo "Bei den Tests traten Fehler auf."
                echo "-------------------------------------"
                exitcode=1
                ;;
        2)
                echo "Bei den Tests traten Warnungen auf."
                echo "-------------------------------------"
                ;;
esac

if [ $testexitcode -ne 1 ]
then
	echo "export.ttl wird erzeugt."
	$SCRIPTDIR/export_rdf.sh
	$SCRIPTDIR/add_files_to_dataset.sh -s -c
	echo "i2b2 import sql wird erzeugt."
	$TTLTOSQLDIR/write-sql.sh
	echo "Metadaten werden in i2b2 importiert.."
	PGPASSWORD=i2b2metadata /usr/bin/psql -q --host=localhost --username=i2b2metadata --dbname=i2b2 -f $TEMPDIR/i2b2-sql/meta.sql
	echo "Metadaten Teil 2.."
	PGPASSWORD=i2b2demodata /usr/bin/psql -q --host=localhost --username=i2b2demodata --dbname=i2b2 -f $TEMPDIR/i2b2-sql/data.sql
	echo -------------------------------------
fi
 
exit $exitcode

