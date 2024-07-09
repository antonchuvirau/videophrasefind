#syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS base
RUN apk add ffmpeg
WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc .
COPY --parents apps/worker/package.json .
COPY --parents packages/database/package.json .
RUN pnpm install

COPY --parents apps/worker .
COPY --parents packages/database .
RUN pnpm build
ENV PORT 5173
EXPOSE 5173
CMD ["pnpm", "--filter", "worker", "start"]

