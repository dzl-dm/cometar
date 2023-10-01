# How to build CoMetaR (and its docker images)
Some additional information to help you get started with building the application if you want to make changes to the code or docker images yourself.

To do this, you will want to clone our repository completely:
```sh
git clone https://github.com/dzl-dm/cometar.git
```
Then you will want to un-comment the `build` part of each service and comment the `image` part. eg for web:
```yml
services:
  ...
  web:
    ...
    # image: ${IMAGE_NAMESPACE}/cometar/cometar-web:${APP_VERSION}
    build:
      context: ./web
      dockerfile: Dockerfile
```
Then you are free to start making changes as you please. In some cases, we use .env variables to influence the build stages, so simply changing them and building locally can already have an effect.

## _Optional: How each component works_
Here is a short overview of what each component does to guide you in where you may want to make changes.

### proxy
This is an NginX service which performs authentication and routing to the below services.

### web
This service exposes the interface of the application. Ultimately it produces a docker image of an NginX server serving static files for the Angular SPA. It is a multi-stage build, so the first stage does all the work of building the Angular application.

### git
This is as it says, just a basic git served over http.

### fuseki
This is a triple store. It converts rdf formatted data from git into SPARQL queryable data over http. We have 2 options, 1 with a web interface for running custom queries and viewing the data, the other without a web interface.

### rest
The python (flask) api used internally by the application.

