# Multi-Stage Production Dockerfile for Node.js Backend
FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Dependencies
FROM base AS dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm install --production=false

# Stage 2: Runner
FROM base AS runner
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 4000
CMD ["npm", "--workspace=@kintsugi/backend", "run", "start"]
