# Madinatti

Plateforme locale multi-services type Madinatti.ma

## Stack technique

- Frontend : Next.js + Tailwind CSS
- Backend : Node.js + Express
- Base de données : PostgreSQL + Prisma v6
- Auth : JWT

## Prérequis

- Node.js v22+
- PostgreSQL v18 installé et en cours d'exécution
- Git

## Installation

### 1 — Cloner le projet

git clone LIEN_DU_REPO
cd madinatti

### 2 — Frontend

cd frontend
npm install
npm run dev

Le frontend tourne sur http://localhost:3000

### 3 — Backend

cd backend
npm install
npm run dev

Le backend tourne sur http://localhost:5000

### 4 — Base de données

Créer la base de données madinatti dans PostgreSQL :

psql -U postgres -h localhost
CREATE DATABASE madinatti;
\q

### 5 — Prisma

Appliquer les migrations :
npx prisma migrate deploy

Générer le client :
npx prisma generate

Vérifier les tables :
npx prisma studio

excute the seeder:
npx prisma db seed

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
- prisma@6
- @prisma/client@6
- nodemon (dev)

## Dépendances Frontend

- next
- react
- tailwindcss
- postcss
- autoprefixer
- axios

## for mehdi
git pull

cd frontend
rm -rf node_modules
npm install

cd ../backend
rm -rf node_modules
npm install
npx prisma generate

## pour tester reset-password ajouter en .env
EMAIL_USER=mehdiultra20@gmail.com
EMAIL_PASS=svev kvqu asig wlbw
installer nodemailer :
cd backend
npm install nodemailer