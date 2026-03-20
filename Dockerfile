FROM node:20-slim

WORKDIR /app

# On copie les fichiers de configuration
COPY package*.json ./
RUN npm install

# On copie le reste du code (server.js et le dossier public)
COPY . .

# On s'assure que le port est ouvert
EXPOSE 3000

CMD ["node", "server.js"]
