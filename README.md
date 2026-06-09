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

## pour google auth 
executer les commandes :
cd frontend 
npm install @react-oauth/google
cd ..
cd backend
 npm install google-auth-library
 npx prisma migrate deploy
 npx prisma generate

 ajouter dans backend/.env :
 GOOGLE_CLIENT_ID=1002924147550-vn0hud4gv8r975gibga2crva2qvqms3i.apps.googleusercontent.com

 ajouter dans frontend/.env.local:

NEXT_PUBLIC_API_URL=http://localhost:5000
GOOGLE_CLIENT_ID=1002924147550-vn0hud4gv8r975gibga2crva2qvqms3i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=REMOVED
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=mysecretkey123
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1002924147550-vn0hud4gv8r975gibga2crva2qvqms3i.apps.googleusercontent.com

La table Role doit contenir au minimum :

citizen
business
admin

Sinon Google login ne pourra pas créer l'utilisateur.

### to apply new seeder

node prisma/seed.js

Seed complet. Comptes de test :
   admin@yourtown.ma     / admin123
   immo.atlas@yourtown.ma / password123  (business)
   dar.invest@yourtown.ma / password123  (business)
   youssef@yourtown.ma   / password123  (citizen)
   salma@yourtown.ma     / password123  (citizen)

## cloudinary setup

cd backend
npm install cloudinary multer
cd ..
cd frontend
npm install morocco-cities

ajouter dans .env

CLOUDINARY_CLOUD_NAME=driwajlgx
CLOUDINARY_API_KEY=REMOVED
CLOUDINARY_API_SECRET=REMOVED

```
town
├─ backend
│  ├─ config
│  │  ├─ cloudinary.js
│  │  └─ db.js
│  ├─ controllers
│  │  ├─ adminController.js
│  │  ├─ authController.js
│  │  ├─ jobController.js
│  │  └─ realEstate.js
│  ├─ middlewares
│  │  ├─ authMiddleware.js
│  │  └─ roleMiddleware.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ checkUsers.js
│  │  ├─ fixAdmin.js
│  │  ├─ migrations
│  │  │  ├─ 20260522210704_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260529134621_changing_password_type_to_or_null_google_auth
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260601161038_update_realestate
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260601190000_add_profile_completed
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260603162323_update_job_listing_and_user_tables
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260604225607_remove_type_field
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260604225730_add_company_logo_to_job
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260605120549_add_region_remote_languages
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  ├─ schema.prisma
│  │  └─ seeds
│  │     ├─ categories.seed.js
│  │     ├─ index.js
│  │     ├─ jobs.seed.js
│  │     ├─ plans.seed.js
│  │     ├─ realEstate.seed.js
│  │     └─ roles.seed.js
│  ├─ routes
│  │  ├─ admin.js
│  │  ├─ auth.js
│  │  ├─ categories.js
│  │  ├─ googleAuth.js
│  │  ├─ jobs.js
│  │  ├─ realEstate.js
│  │  └─ upload.js
│  ├─ server.js
│  └─ services
│     ├─ mailService.js
│     └─ realEstate.js
├─ frontend
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ businesses
│  │  │  │  └─ page.jsx
│  │  │  ├─ jobs
│  │  │  │  └─ page.jsx
│  │  │  ├─ layout.jsx
│  │  │  ├─ page.jsx
│  │  │  ├─ real-estate
│  │  │  │  └─ page.jsx
│  │  │  ├─ reports
│  │  │  │  └─ page.jsx
│  │  │  ├─ users
│  │  │  │  └─ page.jsx
│  │  │  └─ vehicles
│  │  │     └─ page.jsx
│  │  ├─ auth
│  │  │  ├─ complete-profile
│  │  │  │  └─ page.jsx
│  │  │  ├─ forgot-password
│  │  │  │  └─ page.jsx
│  │  │  ├─ login
│  │  │  │  └─ page.jsx
│  │  │  ├─ register
│  │  │  │  └─ page.jsx
│  │  │  └─ reset-password
│  │  │     ├─ page.jsx
│  │  │     └─ ResetForm.jsx
│  │  ├─ globals.css
│  │  ├─ jobs
│  │  │  ├─ page.jsx
│  │  │  ├─ publier
│  │  │  │  └─ page.jsx
│  │  │  └─ [id]
│  │  │     └─ page.jsx
│  │  ├─ layout.jsx
│  │  ├─ my-space
│  │  │  ├─ layout.jsx
│  │  │  ├─ page.jsx
│  │  │  ├─ profile
│  │  │  │  └─ page.jsx
│  │  │  └─ services
│  │  │     ├─ jobs
│  │  │     └─ real-estate
│  │  │        └─ page.jsx
│  │  ├─ page.jsx
│  │  └─ real-estate
│  │     ├─ admin
│  │     │  └─ page.jsx
│  │     ├─ create
│  │     │  └─ page.jsx
│  │     ├─ dashboard
│  │     │  └─ page.jsx
│  │     ├─ edit
│  │     │  └─ [id]
│  │     │     └─ page.jsx
│  │     ├─ page.jsx
│  │     └─ [id]
│  │        └─ page.jsx
│  ├─ components
│  │  ├─ admin
│  │  │  ├─ AdminSidebar.jsx
│  │  │  ├─ ListingDetailModal.jsx
│  │  │  ├─ ListingTable.jsx
│  │  │  ├─ RejectModal.jsx
│  │  │  ├─ StatCard.jsx
│  │  │  └─ StatusBadge.jsx
│  │  ├─ auth
│  │  │  ├─ AuthLayout.jsx
│  │  │  ├─ GoogleAuth.jsx
│  │  │  └─ PasswordInput.jsx
│  │  ├─ jobs
│  │  │  ├─ InlineRegisterSection.jsx
│  │  │  ├─ jobCard.jsx
│  │  │  └─ jobFilter.jsx
│  │  ├─ real-estate
│  │  │  ├─ InlineRegisterSection.jsx
│  │  │  ├─ ListingDrawer.jsx
│  │  │  ├─ ListingFilters.jsx
│  │  │  ├─ RealEstateCard.jsx
│  │  │  └─ RealEstateFilter.jsx
│  │  └─ shared
│  │     ├─ DevTools.jsx
│  │     ├─ Footer.jsx
│  │     ├─ layout.jsx
│  │     ├─ LayoutShell.jsx
│  │     ├─ logos
│  │     │  ├─ Logo.jsx
│  │     │  └─ Logo_white.jsx
│  │     ├─ MapFrame.jsx
│  │     ├─ Navbar.jsx
│  │     └─ ProtectedRoute.jsx
│  ├─ constants
│  │  └─ home.constants.js
│  ├─ context
│  │  └─ AuthContext.jsx
│  ├─ eslint.config.js
│  ├─ jsconfig.json
│  ├─ lib
│  │  └─ adminApi.js
│  ├─ next.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ public
│  │  └─ logo.png
│  └─ services
│     ├─ authService.js
│     ├─ jobsService.js
│     └─ realEstateService.js
├─ package-lock.json
├─ package.json
└─ README.md

```