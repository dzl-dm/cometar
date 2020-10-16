FROM nginx

COPY data /cometar_base

ENV COMETAR_REPOSITORY_DIR=/usr/share/nginx/html/git
ENV COMETAR_GIT_AUTHENTICATION_FILE=/etc/nginx/auth/.htpasswd
ENV COMETAR_FLASK_SERVER=http://repository/flask
ENV COMETAR_TEMP_DIR=/tmp/cometar
ENV COMETAR_BASE_DIR=/cometar_base
ENV COMETAR_PROD_DIR=/cometar
ENV COMETAR_GIT_HTTP_BACKEND_FILE=/usr/libexec/git-core/git-http-backend
ENV COMETAR_PIPES_DIR=/cometar/pipes
ENV COMETAR_LOG_LINK=/cometar/log

ENV GIT_URL=https://www.kernel.org/pub/software/scm/git
ENV GIT_VERSION=2.9.5
ENV GIT_FILENAME=git-${GIT_VERSION}
ENV GIT_ARCHIVE=${GIT_FILENAME}.tar.gz
ENV GIT_MANPAGES=git-manpages-${GIT_VERSION}.tar.gz

RUN apt-get update && \
    apt-get install -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev man python && \
    apt-get install -y git-core fcgiwrap spawn-fcgi gitweb apache2-utils && \
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

RUN apt-get install -y screen && \
    apt-get install -y jq && \
    apt-get install -y procps

RUN apt-get install -y python3=3.7.3-1 && \
    apt-get install -y python3-pip=18.1-5 && \
    pip3 install --upgrade setuptools && \
    pip3 install Werkzeug && \
    pip3 install Jinja2 && \
    pip3 install MarkupSafe && \
    pip3 install ItsDangerous && \
    pip3 install Click && \
    pip3 install Flask && \
    pip3 install flask-accept

RUN apt-get remove -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev python && \
    apt-get autoremove -y

RUN git init --bare "$COMETAR_REPOSITORY_DIR" && \
    chown -R www-data:www-data "$COMETAR_REPOSITORY_DIR"

RUN mkdir -p $COMETAR_PROD_DIR && \
    cp -R "$COMETAR_BASE_DIR/rdf_loading" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/flask" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/rdf_verification" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/git_scripts" "$COMETAR_PROD_DIR" && \
    cp -R "$COMETAR_BASE_DIR/hooks" "$COMETAR_PROD_DIR" && \
    /bin/bash -c "envsubst '\$COMETAR_GIT_AUTHENTICATION_FILE \$COMETAR_REPOSITORY_DIR \$COMETAR_GIT_HTTP_BACKEND_FILE' < '$COMETAR_BASE_DIR/nginx.conf' > /etc/nginx/nginx.conf" && \
    /bin/bash -c "envsubst '\$COMETAR_FLASK_SERVER \$COMETAR_PIPES_DIR' < '$COMETAR_BASE_DIR/git_hooks/update' > '${COMETAR_REPOSITORY_DIR}/hooks/update'" && \
    mkdir -p "${COMETAR_PIPES_DIR}" && \
    mknod "${COMETAR_PIPES_DIR}/git_update_hook" p && \
    chown www-data:www-data /cometar/pipes/git_update_hook

RUN ln -sf /proc/1/fd/1 "$COMETAR_LOG_LINK"

CMD /etc/init.d/fcgiwrap start && \
    export FLASK_APP="$COMETAR_PROD_DIR/flask/test.py" && \
    screen -m -d -S flask flask run --reload && \
    screen -m -d -S git_update_hook_pipe_listener bash -c "\"$COMETAR_PROD_DIR/hooks/git_update_hook_pipe_listener.sh\" > \"$COMETAR_LOG_LINK\" 2>&1" && \
    nginx -g "daemon off;"