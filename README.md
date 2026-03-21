# 🎬 Media Manager Docker

Une interface web légère pour trier, déplacer et nettoyer vos téléchargements (Torrents) vers vos bibliothèques de Films et Séries sur un serveur Proxmox/LXC.

## 🚀 Fonctionnalités
* **Scan Récursif** : Détecte les vidéos même si elles sont dans des sous-dossiers.
* **Smart Move** : Déplace le dossier complet du torrent pour éviter les fichiers orphelins.
* **Nettoyage automatique** : Supprime les fichiers inutiles (`.exe`, `.txt`, `.nfo`).
* **Docker Ready** : Optimisé pour un déploiement via Dockge ou Docker Compose.

---

## 🛠️ Installation

### 1. Prérequis sur Proxmox (LXC)
Assurez-vous que vos partages réseau sont montés dans votre container LXC (ex: dans `/shared`).

### 2. Structure des dossiers
Le projet s'attend à trouver la structure suivante dans votre point de montage :
* `/shared/Torrents`
* `/shared/Media/Series`
* `/shared/Media/Films_Test`

### 3. Déploiement via Dockge / Docker Compose
Utilisez le `docker-compose.yaml` suivant :

```yaml
version: "3.8"
services:
  media-manager:
    build: https://github.com/MarkouZz68/media-manager-docker.git
    container_name: media-manager
    ports:
      - "3000:3000"
    volumes:
      - /shared:/data
      - ./config:/app/config
    environment:
      - TORRENTS_PATH=/data/Torrents
      - SERIES_PATH=/data/Media/Series
      - FILMS_PATH=/data/Media/Films_Test
    restart: unless-stopped
