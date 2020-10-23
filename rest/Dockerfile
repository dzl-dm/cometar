FROM ubuntu

COPY data /cometar_base

ENV COMETAR_TEMP_DIR=/tmp/cometar
ENV COMETAR_BASE_DIR=/cometar_base
ENV COMETAR_PROD_DIR=/cometar

ENV GIT_URL=https://www.kernel.org/pub/software/scm/git
ENV GIT_VERSION=2.9.5
ENV GIT_FILENAME=git-${GIT_VERSION}
ENV GIT_ARCHIVE=${GIT_FILENAME}.tar.gz
ENV GIT_MANPAGES=git-manpages-${GIT_VERSION}.tar.gz
ENV TZ="Europe/Berlin"
ENV DEBIAN_FRONTEND="noninteractive"

RUN apt-get update && \
    apt-get install -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev man python && \
    apt-get install -y git-core apache2-utils curl && \
    cd /tmp && \
    wget ${GIT_URL}/${GIT_ARCHIVE} && \
    wget ${GIT_URL}/${GIT_MANPAGES} && \
    tar xfz ${GIT_ARCHIVE} && \
    cd ${GIT_FILENAME} && \
    make -j4 prefix=/usr all && \
    make prefix=/usr install && \
    cd /usr/share/man && \
    tar xfz /tmp/${GIT_MANPAGES} && \
    mandb && \
    cd /tmp && \
    rm -rf ${GIT_FILENAME} && \
    rm ${GIT_MANPAGES} && \
    rm ${GIT_ARCHIVE}

RUN apt-get install -y screen

RUN apt-get install -y python3=3.8.2-0ubuntu2 && \
    apt-get install -y python3-pip=20.0.2-5ubuntu1.1 && \
    pip3 install --upgrade setuptools && \
    pip3 install Werkzeug && \
    pip3 install Jinja2 && \
    pip3 install MarkupSafe && \
    pip3 install ItsDangerous && \
    pip3 install Click && \
    pip3 install Flask && \
    pip3 install requests && \
    pip3 install flask-accept

RUN apt-get remove -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev && \
    apt-get autoremove -y

RUN mkdir -p $COMETAR_PROD_DIR && \
    cp -R "$COMETAR_BASE_DIR/rdf_loading" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/flask" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/rdf_verification" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/git_scripts" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/information_retrieval" "$COMETAR_PROD_DIR"

CMD export FLASK_APP="$COMETAR_PROD_DIR/flask/cometar.py" && \
    flask run -h 0.0.0.0 --reload