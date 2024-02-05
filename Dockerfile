FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 8112

CMD ["npm", "start"]