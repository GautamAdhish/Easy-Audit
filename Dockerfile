# syntax=docker/dockerfile:1

# ---------- Stage 1: build the React/Vite client ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
# vite.config.js writes to ../dist (i.e. /app/dist), not /app/client/dist
RUN npm run build

# ---------- Stage 2: install server dependencies ----------
FROM node:20-alpine AS server-deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

# ---------- Stage 3: final runtime image ----------
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/
# app.js resolves the client build relative to server/src as ../../client/dist
COPY --from=client-build /app/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

WORKDIR /app/server
CMD ["node", "src/server.js"]
