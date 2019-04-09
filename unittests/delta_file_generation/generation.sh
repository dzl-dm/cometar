#!/bin/bash

startdir=$PWD
dir=$(dirname $(realpath $0))

rm -rf "$dir/temp_repository"
rm -rf "$dir/temp_checkout_"*
rm -rf "$dir/generatedfiles"
mkdir -p "$dir/generatedfiles"
statecount=0

echo "Initializing Git repository"
git init --bare "$dir/temp_repository"

while read line; do    
	IFS=';'
	read -ra action <<< "$line"	
	unset IFS
	if [ "${action[0]}" != "user" ]; then
		echo ""
		echo "----------------------------------------"
		echo ""
		if [ "${action[1]}" == "checkout" ]; then
			echo "User ${action[0]} checkout Git repository"
			git clone "$dir/temp_repository" "$dir/temp_checkout_${action[0]}"			
		fi
		if [ "${action[1]}" == "commit" ]; then
			echo "User ${action[0]} commit state ${action[2]}"
			state=$(echo "${action[2]}")
			cp -r "$dir/testfiles/test1/input/state${state}/"* "$dir/temp_checkout_${action[0]}"
			cd "$dir/temp_checkout_${action[0]}"
			git add *
			git commit -m "state${action[2]}"		
		fi
		if [ "${action[1]}" == "push" ]; then
			echo "User ${action[0]} push"
			cd "$dir/temp_checkout_${action[0]}"
			git push			
		fi
		if [ "${action[1]}" == "pull" ]; then
			echo "User ${action[0]} pull"
			cd "$dir/temp_checkout_${action[0]}"
			git pull
		fi	
	fi
done < "$dir/testfiles/test1/actions.csv"
