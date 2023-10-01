FROM nginx:stable-alpine-slim

## Ensure htpasswd command is available
RUN apk add --update --no-cache apache2-utils && \
    rm -rf /var/cache/apk/*

## Get config data and scripts
COPY bootstrap-proxy.sh /bootstrap.sh
COPY conf/ /etc/nginx/conf.d/
RUN rm /etc/nginx/conf.d/default.conf

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV TZ=${TZ:-'Europe/Berlin'}
ENV WEB_SERVER=${WEB_SERVER:-http://cometar.web}
ENV GIT_SERVER=${GIT_SERVER:-http://cometar.git}
ENV BROWSER_GIT_PATH=${BROWSER_GIT_PATH:-/git}
ENV REST_SERVER=${REST_SERVER:-http://cometar.rest:5000}
ENV BROWSER_REST_PATH=${BROWSER_REST_PATH:-/rest}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar.fuseki:3030}
ENV BROWSER_FUSEKI_PATH=${BROWSER_FUSEKI_PATH:-/fuseki}

CMD [ "sh", "-c", "/bootstrap.sh && nginx -g 'daemon off;'" ]
