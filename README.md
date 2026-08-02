# Madinatti / YourTown

Plateforme locale multi-services avec frontend Next.js, backend Express, PostgreSQL et Prisma 6.

## Installation

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Copier les exemples d'environnement puis remplacer uniquement par vos propres valeurs locales:

```bash
copy .env.example .env.local
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Ne commitez jamais de vrais secrets. Des secrets historiques ont ete exposes dans ce depot; ils doivent etre revoques dans Google Cloud, Cloudinary, l'email provider et tout service concerne.

## Commandes

```bash
npm run dev
npm run build --prefix frontend
npm run lint --prefix frontend
npm run seed --prefix backend
npx.cmd prisma generate --schema backend/prisma/schema.prisma
npx.cmd prisma migrate dev --schema backend/prisma/schema.prisma
```

Le frontend tourne sur `http://localhost:3000` et le backend sur `http://localhost:5000`.

## Module Sante

La route frontend `/sante` affiche les sept sous-categories:

- `pharmacy`
- `hospital-clinic`
- `medical-laboratory`
- `doctor-office`
- `dentist`
- `radiology-center`
- `parapharmacy`

Le backend expose:

- `GET /api/health/subcategories`
- `GET /api/health/places`
- `GET /api/health/places/:id`
- `POST /api/health/places`
- `PUT /api/health/places/:id`
- `POST /api/health/places/:id/claim`
- `PATCH /api/health/places/:id/moderate`

Les resultats combinent les fiches locales MADINATI approuvees et, si la cle serveur est configuree, Google Places API (New). Les donnees Google sont recuperees a la demande avec Field Masks minimaux, timeout, cache court, rayon limite et deduplication par `googlePlaceId`.

## Google Cloud

Activer la facturation Google Cloud et les APIs suivantes:

- Maps JavaScript API pour la carte navigateur.
- Places API (New) pour Nearby Search, Text Search et Place Details cote backend.

Restrictions recommandees:

- `GOOGLE_MAPS_SERVER_API_KEY`: restriction par adresse IP serveur, API restriction sur Places API (New), jamais exposee au frontend, jamais en `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`: restriction HTTP referrers sur localhost et domaines de production, API restriction sur Maps JavaScript API.
- Configurer quotas, budgets et alertes de facturation.

Nearby Search est limitee par rayon et ne fournit pas une liste exhaustive du Maroc. La recherche est dynamique autour du GPS, d'une ville ou du centre de la carte.

## Prisma

Appliquer les migrations en developpement:

```bash
cd backend
npx.cmd prisma migrate dev
npx.cmd prisma generate
npm run seed
```

En production, utiliser `prisma migrate deploy`.

## Securite

- Ne reutilisez aucun secret ancien du README historique.
- Revoquez les anciennes cles exposees.
- Ne journalisez pas les cles Google.
- Ne placez jamais `GOOGLE_CLIENT_SECRET` ou une cle serveur dans une variable `NEXT_PUBLIC_*`.
 
 testing frontend autodeploy prob