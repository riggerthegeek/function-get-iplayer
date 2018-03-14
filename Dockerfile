FROM riggerthegeek/faas-node:latest

LABEL maintainer="Simon Emms <simon@simonemms.com>"

USER root

WORKDIR /opt/get_iplayer

# System dependencies
RUN apk add --no-cache curl

# Get iPlayer dependencies
RUN apk add --no-cache perl-libwww perl-lwp-protocol-https perl-mojolicious perl-xml-libxml \
  && apk add --no-cache ffmpeg \
  && curl -kL -o AtomicParsley https://bitbucket.org/shield007/atomicparsley/raw/68337c0c05ec4ba2ad47012303121aaede25e6df/downloads/build_linux_x86_64/AtomicParsley \
  && install -m 755 ./AtomicParsley /usr/local/bin \
  && AtomicParsley --version

# Install get_iplayer
RUN curl -kLO https://raw.github.com/get-iplayer/get_iplayer/master/get_iplayer \
  && install -m 755 ./get_iplayer /usr/local/bin \
  && get_iplayer --info

WORKDIR /opt/get_iplayer/shield007-atomicparsley-db624c49ba39

# Clean up after ourselves
RUN apk del curl \
  && rm -Rf /opt/get_iplayer

USER node

WORKDIR /home/node

# COPY function node packages and install, adding this as a separate
# entry allows caching of npm install
ADD ./function ./function
ADD ./package*.json ./function/

RUN cd function \
  && npm install --production || :
