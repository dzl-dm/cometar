#!/bin/bash

/bin/bash -c "envsubst '\$REST_SERVER' < '/cometar/update' > '/usr/share/nginx/html/git/hooks/update'"
chown -R nginx:nginx "/usr/share/nginx/html/git"

## Build allow directives for nginx
if [ "$FUSEKI_ADMIN_ALLOW_RANGE" != "" ]; then
  echo "Setting fuseki admin allow range: ${FUSEKI_ADMIN_ALLOW_RANGE}"
  IFS=$',' read -r -a ip_ranges <<< "$FUSEKI_ADMIN_ALLOW_RANGE"
  for range in "${ip_ranges[@]}"; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE}allow ${range};")
  done
  export FUSEKI_ADMIN_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX fuseki admin allow directive: ${FUSEKI_ADMIN_ALLOW_RANGE}"
fi
if [ "$REST_ALLOW_RANGE" != "" ]; then
  unset TEMP_ALLOW_RANGE
  echo "Setting rest allow range: ${REST_ALLOW_RANGE}"
  IFS=$',' read -r -a ip_ranges <<< "$REST_ALLOW_RANGE"
  for range in "${ip_ranges[@]}"; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE:-}allow ${range};")
  done
  export REST_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX rest allow directive: ${REST_ALLOW_RANGE}"
fi
/bin/bash -c "envsubst '\$REST_SERVER \$FUSEKI_SERVER \$FUSEKI_ADMIN_ALLOW_RANGE \$REST_ALLOW_RANGE \$BROWSER_FQDN' < '/cometar/nginx.conf' > /etc/nginx/conf.d/cometar.conf"

if [[ ! -e /etc/nginx/auth/.htpasswd_git ]] ; then
  mkdir -p /etc/nginx/auth/
  touch /etc/nginx/auth/.htpasswd_git
fi

## Generate $BROWSER_FUSEKI_SERVER from components...
BASE_URL=$(echo -e "${BROWSER_SCHEME}://${BROWSER_FQDN}")
if [[ ! "${BROWSER_PORT}" ]] ; then
  BASE_URL=$(echo -e "${BASE_URL}:${BROWSER_PORT}")
fi
export BASE_URL="${BASE_URL}"
export BROWSER_FUSEKI_SERVER=$(echo -e "${BASE_URL}${BROWSER_FUSEKI_PATH}")
# cp -a /usr/share/nginx/html/cometar_browser/assets/config.json /cometar/browser_conf.json
# /bin/bash -c "envsubst '\$BROWSER_FUSEKI_SERVER' < '/cometar/browser_conf.json' > /usr/share/nginx/html/cometar_browser/assets/config.json"
