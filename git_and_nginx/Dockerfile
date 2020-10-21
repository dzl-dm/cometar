FROM nginx

COPY data /cometar

ENV GIT_URL=https://www.kernel.org/pub/software/scm/git
ENV GIT_VERSION=2.9.5
ENV GIT_FILENAME=git-${GIT_VERSION}
ENV GIT_ARCHIVE=${GIT_FILENAME}.tar.gz
ENV GIT_MANPAGES=git-manpages-${GIT_VERSION}.tar.gz

RUN apt-get update && \
    apt-get install -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev man python && \
    apt-get install -y git-core fcgiwrap spawn-fcgi apache2-utils jq dnsutils && \
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
    rm ${GIT_ARCHIVE} && \
    apt-get remove -y wget build-essential libssl-dev libcurl4-gnutls-dev gettext expat libexpat1-dev zlib1g-dev python && \
    apt-get autoremove -y

RUN git init --bare "/usr/share/nginx/html/git" && \
    chown -R www-data:www-data "/usr/share/nginx/html/git"

CMD /etc/init.d/fcgiwrap start && \
    /cometar/configure.sh && \
    nginx -g "daemon off;"