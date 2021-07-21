#!/bin/bash

commit_id=""

while [ ! $# -eq 0 ]
do
	case "$1" in
		-r)
			shift
			commit_id=$1
			;;
		-f)
			shift
			outputfile=$1
			;;
	esac
	shift
done

if [ $outputfile == "" ]; then
	exit 1
fi

pid=$$
gitpid=""
while [ "$gitpid" == "" ]; do
	pid=$(ps -o ppid= $pid)
	commandmatch=$(echo $(ps -p $pid -o "command") | grep "COMMAND /usr/lib/git-core/git-http-backend")
	if [ "$commandmatch" != "" -o $pid -eq 1 ]; then
		gitpid=$pid
		if [ "$commit_id" != "" ]; then
			gitpid="$pid;$commit_id"
		fi
	fi
done

echo $gitpid > $outputfile