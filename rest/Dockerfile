FROM python:3.10-slim-bullseye

ARG COMETAR_BASE_DIR=${COMETAR_BASE_DIR:-/cometar_base}
## Used in build and run
ENV COMETAR_TEMP_DIR=${COMETAR_TEMP_DIR:-/tmp/cometar}
ENV COMETAR_PROD_DIR=${COMETAR_PROD_DIR:-/cometar}

ENV TZ=${TZ:-'Europe/Berlin'}

ARG DEBIAN_FRONTEND="noninteractive"
RUN apt-get update && \
    apt-get -y install tzdata && \
    apt-get install -y git=1:2* git-core curl gawk && \
    apt-get autoremove -y

## Update and install project requirements from requirements.txt (copy separately to entire src to aid docker layer cache reuse)
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

COPY data ${COMETAR_BASE_DIR}
COPY config /config

RUN mkdir -p $COMETAR_PROD_DIR && \
    mkdir -p /var/lib/cometar/provenance/output && \
    mkdir -p /var/tmp/cometar && \
    cp -R "${COMETAR_BASE_DIR}/." "${COMETAR_PROD_DIR}/" && \
    find "${COMETAR_PROD_DIR}/" -type f -iname "*.sh" -execdir chmod +x {} +

ENV FUSEKI_LIVE_SERVER=${FUSEKI_LIVE_SERVER:-http://cometar.fuseki:3030/cometar_live}
ENV FUSEKI_TEST_SERVER=${FUSEKI_TEST_SERVER:-http://cometar.fuseki:3030/cometar_test}
ENV FUSEKI_DEV_SERVER=${FUSEKI_DEV_SERVER:-http://cometar.fuseki:3030/cometar_dev}
ENV LOG_CONF_PATH=${LOG_CONF_PATH:-'/config/logging.yaml'}

## Shortly after restart, ensure fuseki reloads the thesaurus and provenance data
CMD /bin/bash -c "sleep 5; curl -s -H 'Accept: application/json' 'http://localhost:5000/fuseki_load_live' && sleep 1 && curl -s -H 'Accept: application/json' 'http://localhost:5000/update_provenance' && sleep 1 && curl -s -H 'Accept: application/json' 'http://localhost:5000/fuseki_load_provenance'" & \
    export FLASK_APP="$COMETAR_PROD_DIR/cometar_flask.py" && \
    flask run -h 0.0.0.0 --reload
