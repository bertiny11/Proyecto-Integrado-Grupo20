# frontend/Dockerfile
FROM node:20

# Crear carpeta de trabajo
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el resto del código
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
