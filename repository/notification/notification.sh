#!/bin/bash

conffile=$(realpath $(dirname $0)/../config/conf.cfg)
from_date=$(date +'%Y-%m-%d %H:%M:%S')
until_date=$(date +'%Y-%m-%d %H:%M:%S')
while [ ! $# -eq 0 ]
do
	case "$1" in
		-p)
			shift
			conffile=$(realpath $1)
			;;
		-f)
			shift
			if ! from_date=$(date -d "$1" +"%Y-%m-%d %H:%M:%S") ; then
				echo "Please enter valid date (yyyy-mm-dd hh:mm:ss)"
				exit
			fi
			;;
		-u)
			shift
			if ! until_date=$(date -d "$1" +"%Y-%m-%d %H:%M:%S") ; then
				echo "Please enter valid date (yyyy-mm-dd hh:mm:ss)"
				exit
			fi
			;;
	esac
	shift
done

source "$conffile"

#get all commit ids since the last check
cd "$TEMPDIR/git"
read -r -a commitids <<< $(git log --pretty=format:"%H" --since="$from_date" --before="$until_date")
rdfcommitids=""
for i in ${commitids[@]}; do
	if [ "$rdfcommitids" == "" ]; then
		rdfcommitids=":commit_${i}"
	else
		rdfcommitids+=",:commit_${i}"
	fi
done
#rdfcommitids=":commit_d5dc768e7178271c26cbc96c8a52c44208dde520,:commit_d3b8670bed93bc4e9191a8c22a3762a0a54a2b56,:commit_c24f2465d61e511e136dc1c85646a269e94c88de,:commit_1c50bf64b61fa4763087eef85242479a1c5f7d65,:commit_d9e914bdb10e6f056bd054f8369a45f7ae0b4467,:commit_70368931c6f7b50896cbefc769894ef348be4bc3,:commit_1db94a5bbf8eac28fe01e88b54e42f1ed68bfd67,:commit_3a69fa90336f18f1f2eb8bbd5dcbc5c14d7c413c,:commit_21d61c0fd7af25c7454d39a08a737f21a2deda41,:commit_b8d31f0af2e0e77913de2b36741e01d23efbb697,:commit_ab3350e0199098924893b2546e26a38d2af9b1e3,:commit_b177006ba650b48b1fa8f9bbe22f3ddde668500e,:commit_e5881e6dba40f0fbacaf385a11ddfe6ac1e23ce7,:commit_cb4cd1cf23febb0fc1c73702d498ad435fa31fb1,:commit_1a5d8bdd153005d3a327398d00557a5f31b32763,:commit_25093894f519edecae67a7ae0898a9edf7344236,:commit_e0c004b71342feb392381c9201b03135eea7999d,:commit_c5873906b621c0e432d0ca772a847e17cfa491a7,:commit_73f4e0b45f10b58dd65792377a8bb01f6269515a,:commit_437591ce837ae3dbef879a09c450ea5c56dc49d1,:commit_83811d799c39ae9debda5ac8abeb493e1d7368d9,:commit_bd3611603a357c9fd2f884529024540f2e720c2a,:commit_bc8fc902d56c38470ea1ea72e25aed46b0b4db61,:commit_2412a1e38263c743446cfd46ef709a0becb52285,:commit_5e10024245c1466688064d5e5bea4f7f30d50c87,:commit_2ff1764a5090b774f6988ce9f2453bb3cd2568be,:commit_fe27e7109b8bea7f2bdf48cc2f77945a26a52ced,:commit_a561b84bdee2509f51fff5780a4fefd0c7b870bd,:commit_5094c9138cc9d081eedcbd2bfee5cf0f459407d4,:commit_1e4d52f2cd6cb784610a29db03c37955296a8feb,:commit_cd97fe99e5a941489394a3af002e7f5b98b2506d,:commit_4ad575f1d6ef349fb03003d2ef38d4266746bac3,:commit_c5f756130d94b4e7eb479c55e37819b2011348d5,:commit_a5ead70664fbb80bc19258842130fd1f5e76f8bc,:commit_088624a0d3ba9b608316006c9609e739eeb0aac7,:commit_a9927f29859f13240a75c9afe68df4731882e918,:commit_b7796bea8bdd386b6bce9679f3da011d3b6ac4e5,:commit_ec68790c0086f865cb45841f84dccef22573e427,:commit_c23bf4f7e8c22d8352e9891d98f2c3106ccb38f0,:commit_3a80300d6802afc87d2e3d3133190ccf8db4de17,:commit_1a42e0a82238842d59d0ff9f76489a37c4f190b5,:commit_6a403c5e07887cd6d72c8447e93ed365f5032ea2,:commit_9a515be55ef33712a3c437d0374fbea7a5d1d543,:commit_3bbece44f47b54138d2be94b3093467478ecf5e6,:commit_c420363454911d777e6313c81d9f9a1cd80920d1,:commit_adaf7b6526e042d50ac611ca4ba2dc724541170c,:commit_a197cda3d5b87f98d925640ef9a3b0ff2d2708bc,:commit_057a0936a94a7663b2cf54bb38e13a2d233a2434,:commit_af369e93ca62490abfdca1952dff08a6bc8cee6a,:commit_95cda8d08912406bb64caac761612f3522ae94a5,:commit_6795cde8ac5010503aab121d356a4de521b8b132,:commit_a2da29c9a4f94e4fa33ee35992b39ebceb5ba199,:commit_63de790a312c0ba6e23eefc39148821d7eabc5f5,:commit_4448fa8d0f286c5546307907accf851090f688ee,:commit_9a2658e4e1da606b8106a6f9726345aa61d803de,:commit_2aba7bffeb2f4741e78ead4db5750cdf9a7b83e2,:commit_bf1521ee91e3ecb6cfe5e32c7c84cd5591a4e325,:commit_83bdf05e014cf5597576096752a31f6428514277,:commit_034961cdc7266720c96e8a8737f79ef2a641e7da,:commit_b39ca78207a6d5aefd7855a457887cb1c51a48b1,:commit_ffc959070ab9a01d63a4b6d43eb3dc3029f8bc4b,:commit_069800e4965fda63a14825d27c022037f949f1b7,:commit_6b441540bd92f8a3a6f3c894a38ac73498415e13,:commit_2cdfeb3e03c5fa4ea99184d06dd9cba837886b86,:commit_94c4517c1cd647ae7c42221340bad68bcdcc23e5,:commit_e436655983a61a2a40e267d6e758f91811c1295a,:commit_f843dc253da85fd9529479df696349c1d19f6508,:commit_dc73e4ee823557164ffd1a955305fccb4f6b33da,:commit_e18cfa5b04f90bd1a884bbaf9b6df9b5bdebe94b,:commit_4cfd8b2e96ff0dfb1b394853fa7c55fd466e51e3,:commit_4d8ddb9d5d0bb9bbf3c1a16521bf7dfe4e739936,:commit_dd0691e21c338f723f7e745c08e755866d846cc6,:commit_9863257e70d13c0de4308c21575b84e3109278b0"

### get all notations that have been removed since the last check
query=$(sed 's/<COMMITIDS>/'$rdfcommitids'/' "$NOTIFICATIONDIR/notationupdates.query")
code=""
while read i; do
	IFS=","
	if [ "$code" == "" ]; then #omit first line
		code=" "
	else
		read -r -a triple <<< "$i"
		code=$(echo ${triple[2]} | tr -d '\r')
		if [ "$notations" == "" ]; then
			notations="'${code}'"
		else
			notations="$notations,'$code'"
		fi
	fi
	unset IFS
done < <(curl -s -H "Accept: text/csv;charset=utf-8" -G "https://data.dzl.de/fuseki/cometar_live/query" --data-urlencode query="$query")

if [ "$notations" == "" ]; then
	exit 0
fi
echo "Removed/changed notations since last check: $notations"

### get all affected sources and loose concepts
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_affected_sources_by_notation.sql")
affectedsourcesbynotation=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_affected_sources_by_source.sql")
affectedsourcesbysource=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")
query=$(sed 's/<NOTATIONS>/'"$notations"'/' "$NOTIFICATIONDIR/get_loose_mappings.sql")
loosemappingstable=$(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -H -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")

### suggestion sql update
query=$(cat "$NOTIFICATIONDIR/get_loose_notations.sql")
loosenotations=""
while read n; do
	if [ "$loosenotations" == "" ]; then
		loosenotations="'${n}'"
	else
		loosenotations="$loosenotations,'$n'"
	fi
done < <(PGPASSWORD=$I2B2DEMOPW /usr/bin/psql -t -A -q --host=$I2B2HOST --username=$I2B2DEMOUSER --dbname=$I2B2DBNAME -c "$query")

echo "Loose notations: $loosenotations"

query=$(sed 's|<NOTATIONS>|'"${loosenotations}"'|' "$NOTIFICATIONDIR/get_new_notation.query")
suggestedsql=""
while read i; do
	IFS=","
	read -r -a triple <<< "$i"
	concept=$(echo ${triple[0]} | tr -d '\r')
	notation=$(echo ${triple[1]} | tr -d '\r')
	newnotation=$(echo ${triple[2]} | tr -d '\r')
	if [ "$newnotation" != "newnotation" ]; then
		suggestedsql+="UPDATE i2b2demodata.observation_fact SET concept_cd = '${newnotation}' WHERE concept_cd = '${notation}'; <br>"
	fi
	unset IFS
done < <(curl -s -H "Accept: text/csv;charset=utf-8" -G "https://data.dzl.de/fuseki/cometar_live/query" --data-urlencode query="$query")

curl -X POST https://data.dzl.de/biomaterial_request/sendform.php -H "Content-Type: application/x-www-form-urlencoded" -d "formtype=notation_changes&commit_ids=${rdfcommitids}&affected_sources_by_source=${affectedsourcesbysource}&affected_sources_by_notation=${affectedsourcesbynotation}&loose_mappings=${loosemappingstable}&suggested_sql=${suggestedsql}"

exit 0
