# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

# Workspace manifests
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json

# Sources
COPY apps/api/src ./apps/api/src
COPY apps/api/migrations ./apps/api/migrations
COPY packages/shared/src ./packages/shared/src

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/migrations ./apps/api/migrations

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
