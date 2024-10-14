FROM python:3.11-slim-bookworm

## Used in build and run
ENV COMETAR_TEMP_DIR=${COMETAR_TEMP_DIR:-/tmp/cometar}
ENV COMETAR_PROD_DIR=${COMETAR_PROD_DIR:-/cometar}
ENV PROVENANCEFILESDIR=${PROVENANCEFILESDIR:-/var/lib/cometar/provenance}

ENV TZ=${TZ:-'Europe/Berlin'}

ARG DEBIAN_FRONTEND="noninteractive"
RUN apt-get update && \
    apt-get -y install tzdata && \
    apt-get install -y git=1:2* git-core curl gawk && \
    apt-get autoremove -y

## Update and install project requirements from requirements.txt (copy separately to entire src to aid docker layer cache reuse)
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

COPY data ${COMETAR_PROD_DIR}
COPY config /config

RUN mkdir -p \
        /var/lib/cometar/provenance/output \
        /var/lib/cometar/provenance/checkouts \
        /var/lib/cometar/provenance/deltas \
        /var/tmp/cometar

COPY --chmod=0755 bootstrap.sh /usr/local/bin/docker-bootstrap.sh

ENV FUSEKI_LIVE_SERVER=${FUSEKI_LIVE_SERVER:-http://cometar.fuseki:3030/cometar_live}
ENV FUSEKI_TEST_SERVER=${FUSEKI_TEST_SERVER:-http://cometar.fuseki:3030/cometar_test}
ENV FUSEKI_DEV_SERVER=${FUSEKI_DEV_SERVER:-http://cometar.fuseki:3030/cometar_dev}
ENV log_verbosity=${log_verbosity:-2}
ENV LOG_CONF_PATH=${LOG_CONF_PATH:-'/config/logging.yaml'}
EXPOSE 5000

## Use bootstrap to ensure a clean startup of the API and ability to process new git commits etc
ENTRYPOINT ["/usr/local/bin/docker-bootstrap.sh"]
CMD ["/usr/local/bin/flask", "--app", "$COMETAR_PROD_DIR/cometar_flask.py", "run", "-h 0.0.0.0", "--reload"]
