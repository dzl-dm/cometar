#!/bin/bash
echo "$0 $@"

revision=""

while [ ! $# -eq 0 ]
do
	case "$1" in
		-r|--revision)
			if [ "$2" ]; then
				revision=$2
			else
				echo "ERROR: No revision argument given." >&2
				exit 1
			fi
			shift
			;;
	esac
	shift
done

if [ "$revision" == "" ]; then
    echo "ERROR: No revision defined" >&2
    exit 1
fi

echo "Time to load revision $revision"
