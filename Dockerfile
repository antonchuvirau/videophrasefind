#syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS base
RUN apk add ffmpeg py3-pip python3
RUN pip3 install yt-dlp https://github.com/coletdjnz/yt-dlp-youtube-oauth2/archive/refs/heads/master.zip --break-system-packages
RUN mkdir -p ~/.config/yt-dlp && echo "--netrc" >> ~/.config/yt-dlp/config
RUN echo 'machine youtube login oauth2 password ""' >> ~/.netrc
WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc .
COPY --parents patches .
COPY --parents apps/worker/package.json .
COPY --parents packages/database/package.json .
RUN pnpm install

COPY --parents apps/worker .
COPY --parents packages/database .
RUN pnpm build
ENV PORT 5173
EXPOSE 5173
CMD ["pnpm", "--filter", "worker", "start"]

