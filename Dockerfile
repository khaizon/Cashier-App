# ---------- build the SPA ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Same-origin API calls ("/api/...") so the image is host-agnostic; the ingress
# routes /api to the backend service.
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---------- serve it ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/docs /usr/share/nginx/html

EXPOSE 80
