#!/bin/bash

conffile="$(dirname $0)/../config/conf.cfg"
source "$conffile"

command=$1

function wait_for_process_end() {
	echo "Waiting until $1 finished..."
	while [ -e "/proc/$1" ]; do sleep 0.1; done
	echo "Process $1 finished, calling update script." >> "$LOGFILE"
	echo "Process $1 finished, calling update script."
	commit_id_parameter=""
	if [ "$2" != "" ]; then
		commit_id_parameter="-r $2"
	fi
	$command $commit_id_parameter
	wait_for_process_hook
}

function wait_for_process_hook() {
	echo "Waiting for new process..."
	while ! [[ -e "/var/tmp/cometar/gitpid" ]]; do sleep 1; done
	while read line; do
		echo "New process: $line" >> "$LOGFILE"
		echo "New process: $line"
		pid=$(echo "$line" | cut -d';' -f1)
		commit_id=""
		if [ $pid != $line ]; then
			commit_id="$(echo $line | cut -d';' -f2)"
		fi
	done < "/var/tmp/cometar/gitpid"
	echo "Removing gitpid file" >> "$LOGFILE"
	rm -f "/var/tmp/cometar/gitpid"
	wait_for_process_end "$pid" "$commit_id"
}

wait_for_process_hook