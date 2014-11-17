FROM nodesource/node:trusty
MAINTAINER Ben Kero <ben.kero@gmail.com>

ADD package.json /tmp/package.json
RUN apt-get update && apt-get install -y git-core
RUN cd /tmp && npm install
RUN mkdir -p /hyperchannel && cp -a /tmp/node_modules /hyperchannel/
WORKDIR /hyperchannel
RUN npm install -g bower
ADD . /hyperchannel
RUN cd /hyperchannel && bower install --allow-root

EXPOSE 4200
CMD ["/hyperchannel/node_modules/.bin/ember", "serve"]
