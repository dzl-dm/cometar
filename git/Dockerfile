## Currnt stable version at time of writing
FROM nginx:1.20-alpine
ARG GIT_BASE=${GIT_BASE:-/git}

RUN apk add --update --no-cache git-daemon fcgiwrap spawn-fcgi jq curl

COPY config/ /config
VOLUME ["${GIT_BASE}"]
VOLUME ["/etc/nginx/auth"]

## git init during build is only in container (not mounted volume). Has (system dependant) effect if/when a new vol is created
RUN git init --bare "${GIT_BASE}" && \
    chown -R nginx:nginx "${GIT_BASE}" && \
    rm /etc/nginx/conf.d/default.conf

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV TZ=${TZ:-'Europe/Berlin'}
ENV BROWSER_FQDN=${BROWSER_FQDN:-localhost}
ENV REST_SERVER=${REST_SERVER:-http://cometar.rest:5000}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar.fuseki:3030}
ENV GIT_BASE=${GIT_BASE:-/git}

# CMD /etc/init.d/spawn-fcgi.git && \
CMD spawn-fcgi -s /run/fcgi.sock -u nginx -g nginx /usr/bin/fcgiwrap && \
    /config/configure-git.sh && \
    nginx -g "daemon off;"
