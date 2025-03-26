# Backoffice - Granulés de Bois Picard

Interface d'administration pour le site web de Granulés de Bois Picard. Cette application permet de gérer le contenu du site, les utilisateurs et les paramètres système.

## Fonctionnalités

- **Tableau de bord** : Surveillance de l'état des services (Backoffice, Website, API)
- **Gestion de contenu** : Articles, Produits, Carrousel, FAQ
- **Gestion des fichiers** : Upload et organisation des médias
- **Administration** : Gestion des utilisateurs, rôles et permissions

## Technologies utilisées

- Vue.js 3 avec Composition API
- TypeScript
- Tailwind CSS pour le style
- Vue Router pour la navigation
- Pinia pour la gestion d'état
- Vue I18n pour l'internationalisation (Français/Anglais)
- Vite comme outil de build

## Prérequis

- Node.js (version recommandée : 18.x ou supérieure)
- npm ou yarn

## Installation

```sh
npm install
```

## Développement

Lancer le serveur de développement :

```sh
npm run dev
```

L'application sera disponible à l'adresse http://localhost:5173/

## Production

Compiler et minifier pour la production :

```sh
npm run build
```

Prévisualiser la version de production :

```sh
npm run preview
```

## Configuration

Le projet utilise les variables d'environnement pour la configuration. Créez un fichier `.env` à la racine du projet en vous basant sur l'exemple fourni.

## Déploiement

Le déploiement est automatisé via GitHub Actions. Consultez le fichier `.github/workflows/deploy.yml` pour plus de détails.
