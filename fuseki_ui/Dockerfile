#   Licensed to the Apache Software Foundation (ASF) under one or more
#   contributor license agreements.  See the NOTICE file distributed with
#   this work for additional information regarding copyright ownership.
#   The ASF licenses this file to You under the Apache License, Version 2.0
#   (the "License"); you may not use this file except in compliance with
#   the License.  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

## Adapted from:
# https://github.com/stain/jena-docker/tree/master/jena-fuseki


# FROM openjdk:11-jre-slim-buster
FROM openjdk:11-jre-slim-bullseye
# MAINTAINER Stian Soiland-Reyes <stain@apache.org>

ENV LANG C.UTF-8
ARG DEBIAN_FRONTEND="noninteractive"
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
       bash curl ca-certificates findutils coreutils gettext pwgen procps tini \
    ; \
    rm -rf /var/lib/apt/lists/*


# Update below according to https://jena.apache.org/download/ 
# and checksum for apache-jena-fuseki-4.x.x.tar.gz.sha512
ENV FUSEKI_SHA512 21850b9d106d40962cb8358cf5731509ed9f38be7f47a0fc7e2fa22247d89faf7b4ef3ecb58cac590b7592b3b8340b80214ab7ca67b9d1231acb68df62b8bd3d
ENV FUSEKI_VERSION 4.4.0
# No need for https due to sha512 checksums below
ENV ASF_MIRROR http://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=
ENV ASF_ARCHIVE http://archive.apache.org/dist/

LABEL org.opencontainers.image.documentation https://jena.apache.org/documentation/fuseki2/
LABEL org.opencontainers.image.title "Apache Jena Fuseki"
LABEL org.opencontainers.image.description "Fuseki is a SPARQL 1.1 server with a web interface, backed by the Apache Jena TDB RDF triple store."
LABEL org.opencontainers.image.version ${FUSEKI_VERSION}
LABEL org.opencontainers.image.licenses "(Apache-2.0 AND (GPL-2.0 WITH Classpath-exception-2.0) AND GPL-3.0)"
LABEL org.opencontainers.image.authors "Apache Jena Fuseki by https://jena.apache.org/"

# Config and data
ENV FUSEKI_BASE /fuseki
# Installation folder
ENV FUSEKI_HOME /jena-fuseki

## Pass settings:
ENV COMETAR_FUSEKI_JVM_ARGS=$COMETAR_FUSEKI_JVM_ARGS
ENV COMETAR_FUSEKI_ADMIN_PASSWORD=$COMETAR_FUSEKI_ADMIN_PASSWORD


WORKDIR /tmp
# published sha512 checksum
RUN echo "$FUSEKI_SHA512  fuseki.tar.gz" > fuseki.tar.gz.sha512
# Download/check/unpack/move in one go (to reduce image layers and size)
RUN     (curl --location --silent --show-error --fail --retry-connrefused --retry 3 --output fuseki.tar.gz ${ASF_MIRROR}jena/binaries/apache-jena-fuseki-$FUSEKI_VERSION.tar.gz || \
         curl --fail --silent --show-error --retry-connrefused --retry 3 --output fuseki.tar.gz $ASF_ARCHIVE/jena/binaries/apache-jena-fuseki-$FUSEKI_VERSION.tar.gz) && \
        sha512sum -c fuseki.tar.gz.sha512 && \
        tar zxf fuseki.tar.gz && \
        mv apache-jena-fuseki* $FUSEKI_HOME && \
        rm fuseki.tar.gz* && \
        cd $FUSEKI_HOME && rm -rf fuseki.war && chmod 755 fuseki-server

COPY shiro.ini $FUSEKI_HOME/shiro.ini
COPY docker-entrypoint.sh /
COPY fuseki_cometar_config.ttl ${FUSEKI_BASE}/config.ttl
COPY fuseki_cometar_config.ttl /etc/fuseki/
RUN chmod 755 /docker-entrypoint.sh


COPY load.sh $FUSEKI_HOME/
COPY tdbloader $FUSEKI_HOME/
COPY tdbloader2 $FUSEKI_HOME/
RUN chmod 755 $FUSEKI_HOME/load.sh $FUSEKI_HOME/tdbloader $FUSEKI_HOME/tdbloader2
#VOLUME /staging


# Where we start our server from
WORKDIR $FUSEKI_HOME

# Make sure we start with empty /fuseki
RUN rm -rf $FUSEKI_BASE
VOLUME $FUSEKI_BASE

## Check fuseki service is actually running
COPY healthcheck.sh /
HEALTHCHECK --interval=5s --timeout=10s --retries=15 \
    CMD /healthcheck.sh

EXPOSE 3030
ENTRYPOINT ["/usr/bin/tini", "--", "/docker-entrypoint.sh"]
# CMD ["/jena-fuseki/fuseki-server"]
CMD ["/jena-fuseki/fuseki-server", "--config=/etc/fuseki/fuseki_cometar_config.ttl"]

