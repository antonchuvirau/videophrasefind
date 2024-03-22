FROM node:20-alpine AS base

# This is not quite right but works for now
COPY package.json .
RUN npm install
COPY . .

RUN npm run build

ENV PORT 5173
EXPOSE 5173
CMD ["npm", "start"]
