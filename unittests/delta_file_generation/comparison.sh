#!/bin/bash

startdir=$PWD
dir=$(dirname $(realpath $0))

cd "$dir/tmp/git"
read -ra commits <<< $(git log --pretty=format:"%H;%s")

pass=1
for (( s=0; s<${#commits[@]}; s++ ))
do	 
	names=${commits[s]}
	IFS=';'
	read -ra namesarray <<< "$names"	
	unset IFS
	if [ "${namesarray[1]:0:5}" == "state" ] && [ -f "$dir/generatedfiles/deltas/${namesarray[0]}.csv" ] && [ -f "$dir/testfiles/test1/output/deltas/${namesarray[1]}.csv" ]; then
		echo "compare $dir/generatedfiles/deltas/${namesarray[0]}.csv and $dir/testfiles/test1/output/deltas/${namesarray[1]}.csv" >&2
		read -ra diffresult <<< $(diff "$dir/generatedfiles/deltas/${namesarray[0]}.csv" "$dir/testfiles/test1/output/deltas/${namesarray[1]}.csv")
		if [ "${#diffresult[@]}" -gt 0 ]; then
			echo "test failed!"
			printf '%s\n' "${diffresult[@]}"
			pass=0
		fi
	fi
done
if [ $pass -eq 1 ]; then
	echo "all tests passed"
else
	echo "tests failed!"
fi