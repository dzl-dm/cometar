FROM stain/jena-fuseki

COPY fuseki_cometar_config.ttl /jena-fuseki

# ENV FUSEKI_DATASET_1 cometar_live
# ENV FUSEKI_DATASET_2 cometar_test

COPY shiro.ini /jena-fuseki/shiro.ini

CMD ["/jena-fuseki/fuseki-server", "--config", "/jena-fuseki/fuseki_cometar_config.ttl"]
