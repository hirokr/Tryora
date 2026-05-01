FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 8000

# Default command can be overridden by Render's Docker Command setting.
CMD ["node", "server.js"]
