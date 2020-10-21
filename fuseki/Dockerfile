FROM stain/jena-fuseki

COPY fuseki_cometar_config.ttl /jena-fuseki

RUN apt-get update && \
    apt-get install -y --no-install-recommends procps

COPY shiro.ini /jena-fuseki/shiro.ini
COPY shiro.ini /fuseki/shiro.ini
COPY qonsole-config.js /jena-fuseki/webapp/js/app/qonsole-config.js

CMD ["/jena-fuseki/fuseki-server", "--config", "/jena-fuseki/fuseki_cometar_config.ttl"]

#Old entry point sets admin password and creates datasets by ENVs
ENTRYPOINT []
