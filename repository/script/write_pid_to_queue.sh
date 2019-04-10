#!/bin/bash

pid=$$
gitpid=""
while [ "$gitpid" == "" ]; do
	pid=$(ps -o ppid= $pid)
	commandmatch=$(echo $(ps -p $pid -o "command") | grep "COMMAND /usr/lib/git-core/git-http-backend")
	if [ "$commandmatch" != "" -o $pid -eq 1 ]; then
		gitpid=$pid
	fi
done

echo $gitpid > "$1"