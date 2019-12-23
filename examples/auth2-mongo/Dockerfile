FROM node:dubnium


RUN mkdir /app
WORKDIR /app

ENV PORT $PORT
EXPOSE $PORT 5858 9229

ADD . /app
RUN npm install

CMD [ "node", "index.js" ]