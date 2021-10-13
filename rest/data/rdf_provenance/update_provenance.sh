#!/bin/bash
## Description: Get the date of the most recent provenance data file, then write the file(s) to bring it up to date

newrev=master

conffile="/config/conf.cfg"
while [[ ! $# -eq 0 ]]
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

echo "$(date +'%d.%m.%y %H:%M:%S') ---------------- UPDATE PROVENANCE ---------------------"
echo "$(date +'%d.%m.%y %H:%M:%S') ---------------- UPDATE PROVENANCE ---------------------" >> "$LOGFILE"

# calc last hook call
from_date="2017-01-01 00:00:00"
shopt -s nullglob
from_date_number=$(date -d "$from_date" +%s)
IFS=$'\n'
for i in $(find "$PROVENANCEFILESDIR/output" -type f -name '*.ttl'); do
filename=$(basename "$i" .ttl)
filecheck=$(expr $filename : '^\([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]_[0-9][0-9]_[0-9][0-9] - [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]_[0-9][0-9]_[0-9][0-9]\)')
if [[ "$filecheck" != "" ]] ; then
	datestring=$(echo ${filename:22} | tr '_' ':')
	if ! testdate=$(date -d "$datestring" +"%Y-%m-%d %H:%M:%S") ; then
		continue
	fi
	datenumber=$(date -d "$datestring" +%s)
	if [[ $datenumber -gt $from_date_number ]] ; then
		from_date=$datestring
		from_date_number=$(date -d "$from_date" +%s)
	fi
fi
done
unset IFS
# calc last hook call end
echo "$(date +'%d.%m.%y %H:%M:%S') Provenance will be updated since $from_date."
echo "$(date +'%d.%m.%y %H:%M:%S') Provenance will be updated since $from_date." >> "$LOGFILE"
newrevargument=""
if [[ "$newrev" != "" ]] ; then
	newrevargument="-n $newrev"
fi

"${PROVENANCESCRIPTDIR}/write_provenance.sh" -p "$conffile" -f "$from_date" "$newrevargument"
