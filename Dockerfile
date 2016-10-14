FROM nodesource/xenial:latest
MAINTAINER Ben Kero <ben.kero@gmail.com>

# Install git for some dependencies (bower and npm packages)
RUN apt-get update && apt-get install -y git-core
# Install bower globally
RUN npm install -g bower

# Install npm and bower packages in a temporary dir, copy them to the empty app
# dir
ADD bower.json /tmp/bower.json
ADD package.json /tmp/package.json
# The Docker image now sets NODE_ENV="production". All our dependencies are
# dev dependencies
ENV NODE_ENV development
RUN cd /tmp && npm install
RUN cd /tmp && bower install --allow-root
RUN mkdir -p /app
RUN cp -a /tmp/node_modules /app
RUN cp -a /tmp/bower_components /app

# Add the rest of the app, minus the ignored files from .dockerignore
WORKDIR /app
ADD . /app

EXPOSE 4200
EXPOSE 49152
CMD ["npm", "start"]
