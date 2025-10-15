# frontend/Dockerfile
FROM node:20

# Crear carpeta de trabajo
WORKDIR /app

# Instalar dependencias
COPY ./package.json ./
RUN npm install

EXPOSE 5173
CMD ["npm", "run", "dev"]
