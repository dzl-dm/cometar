#!/bin/bash

newrev=master
exec_post_receive=1

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
		-e)
			exec_post_receive=0
			;;
	esac
	shift
done

source "$conffile"

if [ ! -f "$LOGFILE" ]; then 
	echo -n "" > "$LOGFILE" 
fi
echo "Update hook triggered for $newrev." >> "$LOGFILE" 
unset GIT_DIR;
rm -rf "$TEMPDIR/git"
mkdir -p "$TEMPDIR/git"
eval "$GITBIN clone -q \"$TTLDIRECTORY\" \"$TEMPDIR/git\""
cd "$TEMPDIR/git"
eval "$GITBIN checkout -q $newrev"

exitcode=0
errorsummary="$TEMPDIR/errorsummary.txt"
echo "" > "$errorsummary"
echo -------------------------------------
echo "Loading files into fuseki test server..."
"$SCRIPTDIR/add_files_to_dataset.sh" -s -t -c -d "$TEMPDIR/git" -p "$conffile" -e "$errorsummary"
insertexitcode=$?
if [ $insertexitcode -eq 0 ]
then
	echo "Files successfully loaded into fuseki test server."
	echo "Performing tests..."
	"$SCRIPTDIR/exec_tests.sh" -p "$conffile" -e "$errorsummary"
	testexitcode=$?
	case $testexitcode in
			0)
					echo "All tests passed."
					;;
			1)
					echo "Tests resulted in errors."
					exitcode=1
					;;
			2)
					echo "Tests resulted in warnings."
					;;
	esac
else
	echo "At least one file failed to load."
	exitcode=1
fi
echo -------------------------------------
 
echo "-------------"
if [ $exitcode -gt 0 ]; then 
	echo "UPLOAD FAILED"
	cat "$errorsummary"
	cat "$errorsummary" >> "$LOGFILE" 
else 
	echo "UPLOAD SUCCEED"	
	echo "UPLOAD SUCCEED" >> "$LOGFILE" 
	if [ $exec_post_receive -eq 1 ]; then
		"$SCRIPTDIR/write_pid_to_queue.sh" "$TEMPDIR/gitpid"
	fi
fi
echo "-------------"

cd "$TEMPDIR"
rm -rf "$TEMPDIR/git"
rm -f "$TEMPDIR/errorsummary.txt"
rm -f "$TEMPDIR/out.txt"
rm -f "$TEMPDIR/error.txt"

exit $exitcode

