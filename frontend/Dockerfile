FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend ./frontend

RUN npm ci && npm run build -w frontend

FROM nginx:1.27-alpine

RUN printf "server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location / {\n    try_files \$uri \$uri/ /index.html;\n  }\n}\n" > /etc/nginx/conf.d/default.conf

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
