FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund
RUN npm run 

COPY . .

EXPOSE 8000

CMD ["npx", "tsx", "src/index.ts"]
