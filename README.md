# CoMetaR - a Collaborative Metadata Repository
CoMetaR is a platform that automatically deploys turtle-notated skos ontologies to a fuseki instance and an i2b2 server.

##requirements
* 2 apache jena fuseki instances, one for tests, one live server. the seperation guarantees that the live server always keeps a correctly running version

##installation
1. clone the CoMetaR git repository
2. adjust configuration in [path to cometar git clone]/config/conf.cfg
  * FUSEKITESTDATASET the dataset ttl-files are uploaded to for tests and rule application
  * FUSEKILIVEDATASET the dataset ttl-files are uploaded to after tests were successfully
  * TEMPDIR the directory that temporary files are put in
3. configure the hook in the ttl-file git repository
  1. `touch [path to ttl-file git repository]/hooks/update`
  2. add following command to the update file: `[path to cometar git clone]/script/update_hook.sh $1 $2 $3`
  3. in case you want to deny update if tests fail add: `exit $?`

##automatic procedure
following steps happen before the ttl-file repository is actually updated:
1. the new repository is checked out into the temporary directory
2. the ttl files are loaded into the fuseki test instance
3. rules are applied to the test dataset (e.g. `INSERT { ?a skos:narrower ?b } WHERE {	?b skos:broader ?a };`)
4. tests are performed (e.g. does every concept have an english label?)
5. the (verified) test dataset is exported into export.ttl
6. export.ttl is loaded into the fuseki live instance
7. export.ttl is translated into sql-statements for the i2b2 server
8. sql-statements are performed