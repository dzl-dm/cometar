## Currnt stable version at time of writing
FROM nginx:1.24-alpine-slim
ARG GIT_BASE=${GIT_BASE:-/git}

RUN apk add --update --no-cache git-daemon fcgiwrap spawn-fcgi jq curl

COPY config/ /config
COPY config/nginx-git.conf /etc/nginx/conf.d/
VOLUME ["${GIT_BASE}"]

## git init during build is only in container (not mounted volume). Has (system dependant) effect if/when a new vol is created
RUN git init --bare "${GIT_BASE}" && \
    chown -R nginx:nginx "${GIT_BASE}" && \
    rm /etc/nginx/conf.d/default.conf
## Setup world writable outputs for proc 1 for pipe to the real docker outputs
RUN mkfifo /tmp/stdout /tmp/stderr && \
    chmod 0766 /tmp/stdout /tmp/stderr

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV TZ=${TZ:-'Europe/Berlin'}
ENV REST_SERVER=${REST_SERVER:-http://cometar.rest:5000}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar.fuseki:3030}
ENV GIT_BASE=${GIT_BASE:-/git}
ENV I2B2_UPDATEMETA_PATH=${I2B2_UPDATEMETA_PATH:-/i2b2-api/updatemeta}

# CMD /etc/init.d/spawn-fcgi.git && \
CMD spawn-fcgi -s /run/fcgi.sock -u nginx -g nginx /usr/bin/fcgiwrap && \
    /config/configure-git.sh && \
    nginx -g "daemon off;"
