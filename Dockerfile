# Openflix — une seule image : l'API et l'interface web.
#   docker build -t openflix .
#   docker run -p 8787:8787 openflix        → http://localhost:8787

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci
COPY server server
COPY web web
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false && npm cache clean --force
COPY server/src server/src
COPY --from=build /app/web/dist web/dist
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8787/api/health || exit 1
CMD ["node_modules/.bin/tsx", "server/src/index.ts"]
