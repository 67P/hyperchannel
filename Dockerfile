FROM nodesource/trusty:4.6
MAINTAINER Ben Kero <ben.kero@gmail.com>

RUN apt-get update && apt-get install -y git-core

# The Docker image now sets NODE_ENV="production". All our dependencies are
# devDependencies
ENV NODE_ENV development

RUN mkdir /hyperchannel
WORKDIR /hyperchannel

RUN npm install -g bower

COPY package.json bower.json ./

RUN npm install && bower install --allow-root

# COPY node_modules bower_components ./
COPY . ./

EXPOSE 4200
CMD ["npm", "start"]
