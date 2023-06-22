# node 18 alpine
FROM node:18-alpine

ENV PIPONG_HOST http://192.168.178.149:8000
ENV PIPONG_PATH data

WORKDIR /app

COPY package.json package-lock.json ./
COPY bridge.ts ./
COPY tsconfig.json ./

RUN npm install

RUN npm install -g typescript

RUN tsc -p .

CMD ["node", "dist/bridge.js"]