#!/bin/bash
echo "$0 $@"

revision="master"

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

cd /
unset GIT_DIR;
if [ -e "$COMETAR_TEMP_DIR/checkout" ]; then
	rm -rf "$COMETAR_TEMP_DIR/checkout"
fi
mkdir -p "$COMETAR_TEMP_DIR/checkout"
git clone -q "$COMETAR_REPOSITORY_DIR" "$COMETAR_TEMP_DIR/checkout"
cd "$COMETAR_TEMP_DIR/checkout"
git checkout -q $revision

exit $?
