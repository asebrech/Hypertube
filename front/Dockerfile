# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.9.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/cache
EXPOSE 5173

RUN apk add --no-cache rsync

FROM base as dev
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  --mount=type=cache,target=/root/.npm \
  npm ci --include=dev
# USER node

WORKDIR /usr/src/app
COPY . .
CMD ["sh", "-c", "rsync -arv /usr/src/cache/node_modules/. /usr/src/app/node_modules && npm run dev"]
