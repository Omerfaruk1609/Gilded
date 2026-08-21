# Multi-Stage Production Dockerfile for React Playground (Nginx Serve)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/playground/package*.json ./apps/playground/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm install

COPY . .
RUN npm run build:playground

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/playground/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
