#!/bin/sh
## Configuration for CoMetaR application
echo "---- BEGIN WEB CONFIGURATION ----"

envsubst "\$BROWSER_FQDN" < /config/cometar-web.tmpl > /etc/nginx/conf.d/cometar.conf

## Apply application environemnt configuration
## Generate $BROWSER_FUSEKI_SERVER from components...
# BASE_URL=$(echo -e "${BROWSER_SCHEME}://${BROWSER_FQDN}")
# if [[ ! "${BROWSER_PORT}" ]] ; then
#   BASE_URL=$(echo -e "${BASE_URL}:${BROWSER_PORT}")
# fi
# export BASE_URL="${BASE_URL}"
# export BROWSER_FUSEKI_SERVER=$(echo -e "${BASE_URL}${BROWSER_FUSEKI_PATH}")
envsubst "\$HREF_BRAND \$ENDPOINT_BASE" < /config/cometar_config_template.json > /usr/share/nginx/html/cometar_browser/assets/config.json

chown -R nginx:nginx /usr/share/nginx/html/cometar_browser
echo "---- END WEB CONFIGURATION ----"
