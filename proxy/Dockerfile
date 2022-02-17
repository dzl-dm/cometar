FROM nginx:stable

RUN  apt-get update && \
      apt-get install -y cron certbot python3-certbot-nginx bash wget apache2-utils && \
      apt-get autoremove -y; apt-get clean && \
      rm -rf /var/lib/apt/lists/*

VOLUME /etc/letsencrypt

## Get config data and scripts
COPY bootstrap-proxy.sh /bootstrap.sh
COPY conf/ /etc/nginx/conf.d/
RUN rm /etc/nginx/conf.d/default.conf

## Setup env vars. These could be overriden, but in standard docker deployments will always be the same
ENV TZ=${TZ:-'Europe/Berlin'}
ENV BROWSER_FQDN=${BROWSER_FQDN:-localhost}
ENV WEB_SERVER=${WEB_SERVER:-http://cometar.web}
ENV GIT_SERVER=${GIT_SERVER:-http://cometar.git}
ENV BROWSER_GIT_PATH=${BROWSER_GIT_PATH:-/git}
ENV REST_SERVER=${REST_SERVER:-http://cometar.rest:5000}
ENV BROWSER_REST_PATH=${BROWSER_REST_PATH:-/rest}
ENV FUSEKI_SERVER=${FUSEKI_SERVER:-http://cometar.fuseki:3030}
ENV BROWSER_FUSEKI_PATH=${BROWSER_FUSEKI_PATH:-/fuseki}
ENV DOMAIN_LIST=${BROWSER_FQDN:-localhost}
ENV CERTBOT_EMAIL=${ADMIN_EMAIL:-admin@localhost}

CMD [ "sh", "-c", "/bootstrap.sh && cron && nginx -g 'daemon off;'" ]
