## Global args:
ARG BUILD_DIR="/opt/cometar_web"

## This is a multi-stage build, this node container is discarded after doing the job of building the angular app
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
FROM nginx:1.20
ARG BUILD_DIR
ARG FCGI_USER=${FCGI_USER:-nginx}
ARG FCGI_GROUP=${FCGI_GROUP:-nginx}

RUN DEBIAN_FRONTEND="noninteractive" apt-get update && \
    apt-get install -y git=1:2.20.1-2+deb10u3 apache2-utils fcgiwrap spawn-fcgi jq curl

## Set fcgi permissions for nginx
RUN echo "\
FCGI_USER=${FCGI_USER}\n\
FCGI_GROUP=${FCGI_GROUP}\n\
FCGI_SOCKET_OWNER=${FCGI_USER}\n\
FCGI_SOCKET_GROUP=${FCGI_GROUP}\n\
" > /etc/default/fcgiwrap

## Copy the app
COPY --from=cometar-build ${BUILD_DIR}/dist /usr/share/nginx/html/cometar_browser

## Get setup scripts and data
COPY docker-config/ /cometar
COPY docker-config/update /usr/share/nginx/html/git/hooks/update

RUN git init --bare "/usr/share/nginx/html/git" && \
    chown -R nginx:nginx "/usr/share/nginx/html/git" && \
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf_OFF

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV REST_SERVER=${REST_SERVER:-http://cometar_rest:5000}
ENV BROWSER_REST_PATH=${BROWSER_REST_PATH:-/rest}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar_fuseki:3030}
ENV BROWSER_FUSEKI_PATH=${BROWSER_FUSEKI_PATH:-/fuseki}

CMD /etc/init.d/fcgiwrap start && \
    /cometar/configure.sh && \
    nginx -g "daemon off;"
