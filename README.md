# CoMetaR - Colaborative Metadata Repository

## Deployment

### Configuration
Environment variables are set in the .env file. You may reference another environment file by editing the `docker-compose.yml` file.
We provide a commented reference of all environment variables available for this application under `.env_reference`

Environment variables are used during deployment of containers to apply various configurations, so you should make these changes before deployment. They can also affect the build stage, however we limit the cases where this applies as the images should be neutral and re-usable for anyone.

### Docker based deployment guide
Clone this repo and cd into the new dir:
```sh
git clone https://github.com/dzl-dm/cometar.git .
cd cometar
```

Use docker compose to build and run the components
```sh
docker compose up -d
```

This provides a running system available at \${BROWSER_SCHEME}://\${BROWSER_FQDN}:\${BROWSER_PORT} eg. [http://localhost](http://localhost)
You may want to edit some settings in `docker-compose.yml` before deploying, and for production deployments more substantial changes could be desired including running behind an https terminating proxy

### Building
If you would like to build the docker images yourself (allowing you to modify them), this section outlines how the services work together. The `Dockerfile`s are in the repo and the `docker-compose.yml` can be edited to use them instead of the published images (see the comments)

#### web
This service exposes the interface of the application. It is essentially an NginX server serving static files (for the Angular SPA) and proxying traffic for fuseki and git. All access controls are within this container

#### git
This is as it says, just a basic git served over http

#### fuseki
This is a triple store. It converts rdf formatted data from git into SPARQL queryable data over http

#### rest
The python (flask) api used internally by the application


## Initialization
In order to actually add data to CoMetaR, you must provide users' access to the git repository

Get a shell inside the docker container for git:
```sh
docker exec -it cometar_web sh
```

Once inside, run the following to add a user, you will be prompted for a password:
```sh
cd /etc/nginx/auth
htpasswd .htpasswd_git username
```

## First steps
Choose a location for the git repository

Then clone the repo from CoMetaR:
```sh
git clone ${BROWSER_SCHEME}://${BROWSER_FQDN}:${BROWSER_PORT}/git
```
eg `http://localhost/git`

Then create or add some data saved as *.ttl file.

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
