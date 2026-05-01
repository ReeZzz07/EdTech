FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend ./frontend

RUN npm ci && npm run build -w frontend

FROM nginx:1.27-alpine

RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  gzip on;' \
  '  gzip_vary on;' \
  '  gzip_min_length 256;' \
  '  gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;' \
  '  location / {' \
  "    try_files \$uri \$uri/ /index.html;" \
  '  }' \
  '}' \
  > /etc/nginx/conf.d/default.conf \
  && nginx -t

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
