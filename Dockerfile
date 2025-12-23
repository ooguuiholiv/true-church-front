# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Argumento para a URL da API durante o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Gerar o build de produção
RUN npm run build

# Estágio de Servidor (Nginx)
FROM nginx:alpine

# Limpar diretório padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build do frontend do estágio builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar permissões para garantir que o Nginx consiga ler os arquivos
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
