#!/bin/bash

/bin/bash -c "envsubst '\$REST_SERVER' < '/cometar/update' > '/usr/share/nginx/html/git/hooks/update'"
if [ "$NGINX_LOCATION_FUSEKI_ADMIN_ALLOW_HOSTNAMES" != "" ]; then
    IFS=$',' read -r -a names <<< "$NGINX_LOCATION_FUSEKI_ADMIN_ALLOW_HOSTNAMES"
    for name in "${names[@]}"
    do
        host_ip=$(dig +short $name)
        if [ "$host_ip" != "" ]; then
            export NGINX_LOCATION_FUSEKI_ADMIN_ALLOW=$(echo "${NGINX_LOCATION_FUSEKI_ADMIN_ALLOW}allow $host_ip;")
        fi
    done
fi
if [ "$NGINX_LOCATION_REST_ALLOW_HOSTNAMES" != "" ]; then
    IFS=$',' read -r -a names <<< "$NGINX_LOCATION_REST_ALLOW_HOSTNAMES"
    for name in "${names[@]}"
    do
        host_ip=$(dig +short $name)
        if [ "$host_ip" != "" ]; then
            export NGINX_LOCATION_REST_ALLOW=$(echo "${NGINX_LOCATION_REST_ALLOW}allow $host_ip;")
        fi
    done
fi
/bin/bash -c "envsubst '\$NGINX_REST_SERVER \$NGINX_FUSEKI_SERVER \$NGINX_LOCATION_FUSEKI_ADMIN_ALLOW \$NGINX_LOCATION_REST_ALLOW' < '/cometar/nginx.conf' > /etc/nginx/nginx.conf"
/bin/bash -c "envsubst '\$BROWSER_FUSEKI_SERVER' < '/cometar/browser_conf.json' > /usr/share/nginx/html/cometar_browser/assets/config.json"