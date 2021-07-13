FROM ubuntu:20.04

ARG COMETAR_BASE_DIR=${COMETAR_BASE_DIR:-/cometar_base}
## Used in build and run
ENV COMETAR_TEMP_DIR=${COMETAR_TEMP_DIR:-/tmp/cometar}
ENV COMETAR_PROD_DIR=${COMETAR_PROD_DIR:-/cometar}

ENV TZ="Europe/Berlin"

RUN DEBIAN_FRONTEND="noninteractive" apt-get update && \
    apt-get install -y git=1:2.25.1-1ubuntu3.1 git-core curl python3=3.8.2-0ubuntu2 python3-pip && \
    pip3 install --upgrade setuptools && \
    pip3 install Werkzeug Jinja2 MarkupSafe ItsDangerous Click Flask requests flask-accept && \
    apt-get autoremove -y

COPY data ${COMETAR_BASE_DIR}

RUN mkdir -p $COMETAR_PROD_DIR && \
    cp -R "$COMETAR_BASE_DIR/rdf_loading" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/flask" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/rdf_verification" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/git_scripts" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/information_retrieval" "$COMETAR_PROD_DIR"

EXPOSE 5000

ENV FUSEKI_TEST_SERVER=${FUSEKI_TEST_SERVER:-http://fuseki:3030/cometar_test}
ENV FUSEKI_LIVE_SERVER=${FUSEKI_LIVE_SERVER:-http://fuseki:3030/cometar_live}

## Shortly after restart, ensure fuseki reloads the data
CMD /bin/bash -c "sleep 10; curl -s -H 'Accept: application/json' -o /dev/null 'http://localhost:5000/fuseki_load_live'" & \
    export FLASK_APP="$COMETAR_PROD_DIR/flask/cometar.py" && \
    flask run -h 0.0.0.0 --reload
