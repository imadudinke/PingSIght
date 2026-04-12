FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_* get baked into the bundle)
# Don't set NEXT_PUBLIC_API_URL here - let it auto-detect at runtime
ARG NEXT_PUBLIC_BFF
ENV NEXT_PUBLIC_BFF=${NEXT_PUBLIC_BFF}
ENV DOCKER_BUILD=1

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime env var for BFF proxy (not baked into bundle)
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL:-http://backend:8000}

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]