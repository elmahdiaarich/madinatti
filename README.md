# Madinatti

Plateforme locale multi-services type Madinatti.ma

## Stack technique

- Frontend : Next.js + Tailwind CSS
- Backend : Node.js + Express
- Base de données : PostgreSQL + Prisma
- Auth : JWT

## Prérequis

- Node.js v22+
- PostgreSQL installé et en cours d'exécution
- Git

## Installation

### Cloner le projet

git clone LIEN_DU_REPO
cd yourtown

### Frontend

cd frontend
npm install
npm run dev

Le frontend tourne sur http://localhost:3000

### Backend

cd backend
npm install
npx prisma generate
npm run dev

Le backend tourne sur http://localhost:5000

## Variables d'environnement

### Backend — créer un fichier .env dans le dossier backend

PORT=5000
JWT_SECRET=ton_secret_ici
DATABASE_URL=postgresql://postgres:ton_mot_de_passe@localhost:5432/madinatti

### Frontend — créer un fichier .env.local dans le dossier frontend

NEXT_PUBLIC_API_URL=http://localhost:5000

## Dépendances Backend

- express
- cors
- dotenv
- bcryptjs
- jsonwebtoken
- prisma
- @prisma/client
- nodemon (dev)

## Dépendances Frontend

- next
- react
- tailwindcss
- postcss
- autoprefixer