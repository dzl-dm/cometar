#!/bin/bash

function print_help {
	echo "Replace notations in source file and write them to output"
	echo ""
	echo "Usage: $0 [notation file] [input xml file] [output xml file]"
	exit 0
}

notations=$1;
input=$2;
output=$3;

if [ ! -f "$notations" ]; then
    echo "Notations file not found!"
	exit 1
fi
if [ ! -f "$input" ]; then
    echo "Input file not found!"
	exit 1
fi
if [ -z "$output" ]; then
    echo "Output file not found!"
	exit 1
fi

while getopts "h" opt
do
   case $opt in
       h) print_help;;
       ?) print_help
   esac
done

counter=0
map=()
replace_command="perl"

IFS=';'
while read -r line ; 
do
	if [ $counter -gt 0 ]; then
		read -ra mapping <<< "$line"
	replace_command+=" -pe 's/\"${mapping[0]}\"/\"${mapping[1]}\"/g;'"
	fi		
	let counter+=1
done < $notations
IFS=' '

replace_command+=" $input > $output"
eval $replace_command