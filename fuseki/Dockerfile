## See: https://github.com/stain/jena-docker/blob/master/jena-fuseki/Dockerfile
FROM stain/jena-fuseki

## Tools for debugging
# RUN DEBIAN_FRONTEND="noninteractive" apt-get update && \
#     apt-get install -y --no-install-recommends procps less vim

COPY fuseki_cometar_config.ttl /jena-fuseki
COPY shiro.ini /jena-fuseki/shiro.ini
COPY shiro.ini /fuseki/shiro.ini
COPY qonsole-config.js /jena-fuseki/webapp/js/app/qonsole-config.js

CMD ["/jena-fuseki/fuseki-server", "--config", "/jena-fuseki/fuseki_cometar_config.ttl"]

## Old entry point sets admin password and creates datasets by ENVs
ENTRYPOINT []
