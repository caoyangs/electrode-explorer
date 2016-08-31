FROM node:4.5
RUN npm i -g npm@3
EXPOSE 3000
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
COPY server /usr/src/app/server
COPY client /usr/src/app/client
COPY config /usr/src/app/config
COPY scripts /usr/src/app/scripts
COPY gulpfile.js /usr/src/app
COPY component-webpack.config.js /usr/src/app
COPY .npmrc /usr/src/app
COPY .babelrc /usr/src/app
RUN npm install
RUN /usr/src/app/node_modules/.bin/gulp build
ENV GHACCESS_TOKEN=1
CMD node server

