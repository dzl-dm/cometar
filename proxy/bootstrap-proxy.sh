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

## Create auth file if doesn't already exist
if [ ! -e /etc/nginx/auth/.htpasswd_git ]; then
  mkdir -p /etc/nginx/auth/
  touch /etc/nginx/auth/.htpasswd_git
fi

echo "---- END PROXY CONFIGURATION ----"
