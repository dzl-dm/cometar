# CoMetaR - Colaborative Metadata Repository

## Pre-requisites
We are assuming a clean, linux based (git-bash and other windows based mechanisms should also work) environment with docker already installed and available to the user you are logged in as.

## Deployment
The first step is to copy the essential files from our repo as templates, you will then edit them for you environment (you may prefer to prepare everything on your desktop then copy over to the deployment system)
```sh
wget -O docker-compose.yml https://raw.githubusercontent.com/dzl-dm/cometar/master/docker-compose.yml.example
wget -O .env https://raw.githubusercontent.com/dzl-dm/cometar/master/.env.example
```
> _NOTE:_ If you prefer to build the images yourself (or edit the way they are built), please see our [README-build.md](README-build.md) notes.

### Configuration
Environment variables are set in the `.env` file. The structure and settings in the `docker-compose.yml` file do not need editing for a basic deployment.

Environment variables are used during deployment of containers to apply various configurations, so you should make these changes before deployment. The following sections outline how to make common configuration changes.

#### General rules (of thumb)
There are 2 ways to implement configuration changes:
* Environment variables - We use the `.env` file for these. The container with behave based on the variables, often by setting a config at boot time.
* Overriding files - You may also edit the `docker-compose.yml` file. Including a line like this will override the cometar config file. The same idea can be applied to any file.
```yml
    volumes:
      - custom_config/config.json:/usr/share/nginx/html/cometar_browser/assets/config/config.json:ro
```
Both of these methods let you change the behaviour of your instance of the application while using the same, generic, application image which everyone else is using.

#### Setting the version
Use the `.env` var `COMETAR_VERSION` to let the docker composition know which version of the docker images you want to use. Using `latest` is fine for testing, but please select a tag (from this CoMetaR repo. eg v0.0.1) in production systems to ensure a restart doesn't cause an unexpected upgrade!

#### Branding
To change the branding, you likely want to consider overriding the logos by adding some lines to the `volumes` section of the `web` service in `docker-compose.yml`. eg:
```yml
services:
  ...
  web:
    ...
    volumes:
      - custom_config/src_cometar.png:/usr/share/nginx/html/cometar_browser/assets/img/CoMetaR_Logo.png:ro
      - custom_config/src_cometar_small.png:/usr/share/nginx/html/cometar_browser/assets/img/CoMetaR_Logo_small.png:ro
      - custom_config/src_cometar_c_small.png:/usr/share/nginx/html/cometar_browser/assets/img/cometar_c_small.png:ro
      - custom_config/src_brand.png:/usr/share/nginx/html/cometar_browser/assets/img/DZL_Logo.png:ro
      - custom_config/src_brand_small.png:/usr/share/nginx/html/cometar_browser/assets/img/DZL_Logo_small.png:ro
```
The first part of each line (separated by colons:), is where the file is on your host system. You must create the path and provide a file. The middle part is within the container. Changing this will change the purpose, don't change it unless you know you want to override another file. The last part makes it read only, which is a small layer of security. The CoMetaR logo, displayed in the bottom left of the browser, under the tree, is composed of 2 parts, you might want to set the 'src_cometar_c_small.png' as a 1x1px transparent image and use only the 'src_cometar_small.png' if you are overriding this logo.

You can also set the environment variable `HREF_BRAND` in the `.env` file which is used as a link when clicking on the brand logo in the bottom left section of CoMetaR's web interface.

The env var `TITLE` can be used to set the html `<title>` tag's contents, which affects the browser window's title.

### Deploy with docker compose
Use docker compose to pull and run the components:
```sh
docker compose up -d
```
> _NOTE:_ You may need to install docker's `compose` plugin to use `docker compose`. Older versions may only provide `docker-compose` (which may also need additional installation).

This provides a running system on your server (desktop, virtual, local, cloud, etc) eg. [http://localhost](http://localhost)

### Upgrade the docker composition
When a newer version of CoMetaR is available and you want to upgrade, you will want to update the version reference in your `.env` file, then run this docker command:
```sh
docker compose up -d --force-recreate
```
> _NOTE:_ If you are referencing latest or build latest, you won't change the version reference, but you will need to force docker to pull the latest version with:
```sh
docker compose pull
## Then, as normal, run 'up':
docker compose up -d --force-recreate
```
You can check that the running containers are referencing the new images with:
```sh
docker ps -a
docker image ls
```
You'll see the version tag at the end of the image name, the ID should have changed if you are referencing (build-)latest (You can comare to image ID's with `docker image ls`)

## Initialization
In order to actually add data to CoMetaR, you must provide users' access to the git repository

Authentication is managed by the proxy container, so get a shell inside that container:
```sh
docker exec -it cometar.proxy sh
```

Once inside, run the following to add a user, you will be prompted for a password:
```sh
cd /etc/nginx/auth
htpasswd .htpasswd_git username
```

## First steps
Choose a location for the git repository which is to hold the CoMetaR thesaurus data

Then clone the repo from CoMetaR (You can manage your git credentials in multiple ways, you can optionally specify them within the url when cloning - shown below):
```sh
git clone ${BROWSER_SCHEME}://${BROWSER_FQDN}:[${BROWSER_PORT}]/git
## eg:
http://localhost/git
## Demonstration including credentials - not recommended
git clone ${BROWSER_SCHEME}://[${user}:${password}@]${BROWSER_FQDN}:[${BROWSER_PORT}]/git
```
eg `git clone http://user:password@localhost/git`

### Add display configuration data
Since version v0.6.3, CoMetaR's layout and labels can be adjusted with RDF data loaded with the metadata. We call these _"predicates"_ and provide a template `predicates.ttl.example` file.

There are 2 types of predicate recognised...
#### dwh:*Restriction
This allows you to define how a data type restriction is displayed in the CoMetaR interface. eg
```
dwh:integerRestriction 
	rdf:label "Integer"@en;
	rdf:label "Ganzzahl"@de;
.
dwh:stringRestriction 
	rdf:label "String"@en;
	rdf:label "Zeichenkette"@de;
.
```
Currently only english language is used, but labels for any language can be defined and can be supported by the interface in the future.

#### dzl:cometarAttribute
This structure allows more control over the core and detailed elements and attributes of a metadata concept. You can use these structures to change the name, visibility and position of each attribute. eg
```
skos:prefLabel a dzl:cometarAttribute;
	rdf:label "Label"@en;
	rdf:label "Bezeichnung"@de;
	dzl:cometarDisplayIndex "1:1";
.

skos:altLabel a dzl:cometarAttribute;
	rdf:label "Alternative label"@en;
	rdf:label "Alternative Bezeichnung"@de;
	dzl:cometarDisplayIndex "1:2";
.

dc:description a dzl:cometarAttribute;
	rdf:label "Description"@en;
	rdf:label "Beschreibung"@de;
	dzl:cometarDisplayIndex "2:4";
.
prov:endedAtTime a dzl:cometarAttribute;
	rdf:label "Last Changes Date"@en;
	rdf:label "Datum der letzten Änderung"@de;
	dzl:cometarDisplayIndex "2:9";
.
```
The purpose and usage of _'rdf:label'_ property is self explanatory, the _'dzl:cometarDisplayIndex'_ is also easy to use after a short explanation.

The first number represents which column the attribute will be displayed in, `1` represents a core attribute and will be displayed on the narrower right column, while `2` represents extended or detailed attributes shown only when available in the centre of the page.

The second number is used to order the attributes, lower numbers are displayed closer to the top of the column. The eventual order is indeterminte if 2 attributes share the same column and order number.

Commenting or removing the _'dzl:cometarDisplayIndex'_ line means the attribute will not be displayed.

### Add your own metadata
Then create or add some data saved as `*.ttl` file. The extension __must__ be `.ttl` otherwise it will be ignored. Its also possible to split the linked data over multiple `.ttl` files.

Here we provide a basic example to get you up and running:
```
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix DZL: <http://data.dzl.de/ont/dwh#> .
@prefix : <http://data.custom.de/ont/dwh#> .
@prefix dc: <http://purl.org/dc/elements/1.1/> .

[
  DZL:topLevelNode :DemoData ;
] .

:DemoData a skos:Concept ;
  skos:prefLabel "Demodaten"@de ;
  skos:prefLabel "Demo Data"@en ;
  DZL:displayLabel "Demo"@en ;
  dc:description "This is the root node of the demo metadata."@en ;
  skos:altLabel "Demonstration" ;
.
:SubCategory a skos:Concept ;
  skos:broader :DemoData ;
  skos:prefLabel "Sub Category 1"@en ;
  skos:prefLabel "Subkategorie 1"@de ;
  dc:description "This is the first sub category of the demo metadata."@en ;
  skos:notation "CODESYS:CAT1" ;
  skos:altLabel "First Category" ;
  DZL:unit "L" ;
.
:SubCategory2 a skos:Concept ;
  skos:broader :DemoData ;
  skos:prefLabel "Sub Category 2"@en ;
  skos:prefLabel "Subkategorie 2"@de ;
  dc:description "This is the second sub category of the demo metadata."@en ;
  skos:notation "CODESYS:CAT2" ;
  skos:altLabel "Second Category" ;
  DZL:unit "years" ;
.
```

Then commit and push:
```sh
git add .
git commit -m "New data"
git push
```
You should see some feedback on the verification process and ultimately if its successful or not. Then you can check the browser for the new data
