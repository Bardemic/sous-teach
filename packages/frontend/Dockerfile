# syntax=docker/dockerfile:1.7-labs
FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN corepack enable && corepack prepare npm@10.8.2 --activate

COPY package.json package-lock.json tsconfig.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/api-types/package.json ./packages/api-types/

RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline

COPY packages/backend ./packages/backend
COPY packages/api-types ./packages/api-types
COPY packages/frontend ./packages/frontend

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

RUN npm run build --workspace=backend \
  && npm run build --workspace=@sous-chef/api-types \
  && npm run build --workspace=frontend

FROM node:20-bookworm-slim AS production

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/packages/frontend/dist ./dist

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
