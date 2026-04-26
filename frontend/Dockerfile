# =============================================
# Frontend — React + Vite servido con Nginx
# Build context = raíz del repo (monorepo)
# =============================================

# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lockb* ./
RUN npm install --no-audit --no-fund

COPY . .

# VITE_API_URL se inyecta en build time
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Etapa 2: Nginx ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
