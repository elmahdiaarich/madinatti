# Tests E2E Automobile

Ce test couvre les catégories `automobile`, la création d'annonces voiture, l'approbation admin, le filtrage backend et les filtres de la page `/cars`.

## 1. Lancer le backend

Depuis la racine du projet :

```powershell
npm run dev --prefix backend
```

Le backend doit répondre sur `http://localhost:5000`.

## 2. Lancer le frontend

Dans un autre terminal :

```powershell
npm run dev --prefix frontend
```

Le frontend doit répondre sur `http://localhost:3000`.

## 3. Préparer les tokens

Le test utilise ces variables :

```powershell
$env:API_URL="http://localhost:5000/api"
$env:FRONT_URL="http://localhost:3000"
$env:ADMIN_TOKEN="..."
$env:USER_TOKEN="..."
```

`ADMIN_TOKEN` doit appartenir à un utilisateur `admin`.
`USER_TOKEN` doit appartenir à un utilisateur `business`, car `POST /api/cars` exige le rôle business.

Exemple avec les comptes seedés :

```powershell
$admin = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@madinatti.ma","password":"admin123"}'
$business = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/login" -ContentType "application/json" -Body '{"email":"capgemini@madinatti.ma","password":"password123"}'
$env:ADMIN_TOKEN=$admin.token
$env:USER_TOKEN=$business.token
```

## 4. Lancer le test

```powershell
npm run test:e2e:cars
```

Si Playwright n'est pas encore installé :

```powershell
npm install
npx playwright install
```
