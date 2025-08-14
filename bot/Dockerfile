FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

EXPOSE 3001

CMD npm run build && npm run start
