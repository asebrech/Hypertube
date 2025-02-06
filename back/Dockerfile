# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.9.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
EXPOSE 3333

FROM base as dev
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  --mount=type=cache,target=/root/.npm \
  npm ci --include=dev
USER node
COPY . .
CMD ["node", "ace", "serve", "--hmr"]


# FROM base as prod
# RUN --mount=type=bind,source=package.json,target=package.json \
#   --mount=type=bind,source=package-lock.json,target=package-lock.json \
#   --mount=type=cache,target=/root/.npm \
#   npm ci --omit=dev
# USER node
# COPY . .
# CMD node src/index.js



# FROM node:20.12.2-alpine3.18 AS base
#
# # All deps stage
# FROM base AS deps
# WORKDIR /app
# ADD package.json package-lock.json ./
# RUN npm ci
#
# # Production only deps stage
# FROM base AS production-deps
# WORKDIR /app
# ADD package.json package-lock.json ./
# RUN npm ci --omit=dev
#
# # Build stage
# FROM base AS build
# WORKDIR /app
# COPY --from=deps /app/node_modules /app/node_modules
# ADD . .
# RUN node ace build
#
# # Production stage
# FROM base
# ENV NODE_ENV=production
# WORKDIR /app
# COPY --from=production-deps /app/node_modules /app/node_modules
# COPY --from=build /app/build /app
# EXPOSE 8080
# CMD ["node", "./bin/server.js"]

