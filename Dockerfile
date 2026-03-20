FROM node:20-slim

# Création du dossier de l'app
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code
COPY . .

# Port utilisé par ton app
EXPOSE 3000

# Lancement
CMD ["node", "server.js"]