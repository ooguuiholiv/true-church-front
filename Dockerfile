# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Argumento para a URL da API durante o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Estágio de Servidor (Nginx)
FROM nginx:alpine

# Copiar build do frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração customizada do Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
