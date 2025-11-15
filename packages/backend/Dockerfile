# syntax=docker/dockerfile:1.7-labs
FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN corepack enable && corepack prepare npm@10.8.2 --activate

COPY package.json package-lock.json tsconfig.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/api-types/package.json ./packages/api-types/

RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline

COPY packages/backend ./packages/backend
COPY packages/api-types ./packages/api-types

RUN npm run build --workspace=backend
RUN npm run build --workspace=@sous-chef/api-types
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7001
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 7001

CMD ["npm", "run", "start"]
