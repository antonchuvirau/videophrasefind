#syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS base
RUN apk add ffmpeg
WORKDIR /app
RUN corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc .
COPY --parents **/package.json .
COPY --parents packages/database .
RUN pnpm --filter database install
RUN pnpm --filter database exec prisma generate

FROM deps as build
COPY apps/worker .
RUN pnpm --filter worker install
RUN pnpm --filter worker build

FROM base
COPY --from=build . .
ENV PORT 5173
EXPOSE 5173
WORKDIR apps/worker
CMD ["npm", "start"]

