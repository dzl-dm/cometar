#!/bin/sh
## Configuration for NginX proxy
echo "---- BEGIN PROXY CONFIGURATION ----"

ORRIG_IFS=$IFS
IFS=,
## Build allow directives for nginx
if [ "$FUSEKI_ADMIN_ALLOW_RANGE" != "" ]; then
  echo "Setting fuseki admin allow range: ${FUSEKI_ADMIN_ALLOW_RANGE}"
  for range in $FUSEKI_ADMIN_ALLOW_RANGE; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE}allow ${range};")
  done
  export FUSEKI_ADMIN_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX fuseki admin allow directive: ${FUSEKI_ADMIN_ALLOW_RANGE}"
fi
if [ "$REST_ALLOW_RANGE" != "" ]; then
  unset TEMP_ALLOW_RANGE
  echo "Setting rest allow range: ${REST_ALLOW_RANGE}"
  for range in $REST_ALLOW_RANGE; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE}allow ${range};")
  done
  export REST_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX rest allow directive: ${REST_ALLOW_RANGE}"
fi
IFS=$ORIG_IFS
envsubst "\$BROWSER_FQDN \$FUSEKI_SERVER \$FUSEKI_ADMIN_ALLOW_RANGE \$GIT_SERVER \$GIT_ALLOW_RANGE \$REST_SERVER \$REST_ALLOW_RANGE \$WEB_SERVER" < /etc/nginx/conf.d/cometar-proxy.tmpl > /etc/nginx/conf.d/cometar.conf

## Disable ssl if file doesn't exist - it'll cause nginx to fail!
echo "Using FQDN: ${BROWSER_FQDN}"
[ -f /etc/letsencrypt/live/${BROWSER_FQDN}/fullchain.pem ] ||
  sed -i -E 's/^(\s*listen\s*443.*|\s*listen\s*\[::\]:443.*)$/#&/' /etc/nginx/conf.d/cometar.conf &&
  sed -i -E 's/^(\s*ssl_certificate.*|\s*include \/etc\/nginx\/conf\.d\/ssl-settings\.inc.*)$/#&/' /etc/nginx/conf.d/cometar.conf

## Create auth file if doesn't already exist
if [ ! -e /etc/nginx/auth/.htpasswd_git ]; then
  mkdir -p /etc/nginx/auth/
  touch /etc/nginx/auth/.htpasswd_git
fi

## Initial run of certbot if its required (not localhost or already setup)
[ ${DOMAIN_LIST} = localhost ] || [ -f /etc/letsencrypt/live/${BROWSER_FQDN}/fullchain.pem ] ||
      ( certbot certonly --standalone --agree-tos -m ${CERTBOT_EMAIL} -n -d ${DOMAIN_LIST} &&
      echo "PATH=$PATH" > /etc/cron.d/certbot-renew  &&
      echo "@weekly certbot renew --nginx >> /var/log/cron.log 2>&1" >>/etc/cron.d/certbot-renew &&
      crontab /etc/cron.d/certbot-renew ) ||
      echo "Something went wrong with the LetsEncrypt certificate setup, please check the details you've entered!"

echo "---- END PROXY CONFIGURATION ----"
