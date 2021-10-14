## Global args:
ARG BUILD_DIR="/opt/cometar_web"

## This is a multi-stage build, this node container is discarded after doing the job of building the angular app
## Currnt stable version at time of writing
FROM node:16-alpine as cometar-build
  ARG BUILD_DIR
  WORKDIR ${BUILD_DIR}
  ENV PATH ${BUILD_DIR}/node_modules/.bin:$PATH

  ## Get source
  COPY . ./

  ## Install dependencies
  RUN echo -e "Using node: '$(node -v)' and npm: '$(npm -v)'" && \
      npm cache verify && \
      npm update && \
      npm install

  ## Build cometar node/angular app
  RUN ng build --configuration production --output-path=dist

## Production container, copies pre-built app from 1st container
## Currnt stable version at time of writing
FROM nginx:1.20-alpine
ARG BUILD_DIR

## For htpasswd utility
RUN apk add --update --no-cache apache2-utils

## Copy the app
COPY --from=cometar-build ${BUILD_DIR}/dist /usr/share/nginx/html/cometar_browser

## Get setup scripts and data
COPY docker-config/ /config
COPY src/assets/config/config_template.json /config/cometar_config_template.json

RUN rm /etc/nginx/conf.d/default.conf

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV TZ="Europe/Berlin"
ENV BROWSER_FQDN=${BROWSER_FQDN:-localhost}
ENV GIT_SERVER=${GIT_SERVER:-http://cometar_git}
ENV BROWSER_GIT_PATH=${BROWSER_GIT_PATH:-/git}
ENV REST_SERVER=${REST_SERVER:-http://cometar_rest:5000}
ENV BROWSER_REST_PATH=${BROWSER_REST_PATH:-/rest}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar_fuseki:3030}
ENV BROWSER_FUSEKI_PATH=${BROWSER_FUSEKI_PATH:-/fuseki}

## Application config
ENV HREF_BRAND=${HREF_BRAND:-https://www.dzl.de/forschung/plattformen/plattform-biobanking-datenmanagement}
ENV BASE_PREFIX=${BASE_PREFIX:-http://data.dzl.de/ont/dwh#}
ENV ENDPOINT_BASE=${ENDPOINT_BASE:-/fuseki/}

CMD /config/configure-web.sh && \
    nginx -g "daemon off;" || \
    sleep 3600
