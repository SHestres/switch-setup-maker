# Stage 1: build the static app from a clean checkout.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve dist/ with the dependency-free Node static server.
# Bare `docker run -p 8080:8080 switch-setup-maker` works with no configuration;
# override the port with -e PORT=<port>.
FROM node:22-alpine
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=8080
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 8080
CMD ["node", "scripts/serve.mjs"]
