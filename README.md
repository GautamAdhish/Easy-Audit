# IS-Audit

IS-Audit is an Information Security / ISO 27001 audit-management application built as a MERN stack:

- **MongoDB** — persistent audit, findings, CAPA, risk, evidence, asset, vendor, report, checklist, user and settings data
- **Express + Node.js** — authenticated REST API with role-based access control
- **React 19 + Vite + TypeScript** — responsive management dashboard (Tailwind CSS v4, Radix UI, Recharts)
- **JWT authentication** — protected SPA routes and API endpoints
- **Multer** — evidence/document/asset-photo uploads
- **Recharts** — live dashboard analytics
- **jsPDF** — client-side PDF export of reports

## Project structure

```
IS-Audit-MERN/
├── client/          # React/Vite frontend
└── server/          # Express/Mongoose API
```

## Features

- Login/logout and protected routes
- Live dashboard statistics and charts
- Audit-program calendar generated from database audits
- CRUD screens for audits, findings, CAPA, risks, checklist items, assets, vendors, reports and users
- Vendor management assessment workflow
- Asset register with photo upload
- Role restrictions enforced by the backend
- Evidence upload and download
- Local, rule-based AI narrative generation for the Summary Report page (no external API calls — see [AI narrative reports](#ai-narrative-reports))
- PDF export of reports (jsPDF)
- Organisation/settings persistence
- MongoDB-backed seeded demo data
- API error/loading states

## Requirements

- Node.js 18+
- MongoDB 6+ (local MongoDB or MongoDB Atlas)
- Python 3 on `PATH` — required only for the AI narrative report feature (`server/scripts/generate_narrative.py`)

## 1. Start the backend

```
cd server
cp .env.example .env
npm install
```

Edit `.env` if you are using MongoDB Atlas. Key variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/is-audit
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@company.com
SEED_ADMIN_PASSWORD=ChangeMe123!
# Optional override if your python binary isn't named python3:
# PYTHON_BIN=python3
```

Then seed the demo data:

```
npm run seed
```

Start the API:

```
npm run dev
```

The API runs on `http://localhost:5000`.

Health check:

```
GET http://localhost:5000/api/health
```

## 2. Start the frontend

In another terminal:

```
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## One-port demo / deployment mode

The merged project can also be served as a single application by Express. This is the recommended mode for a college/project demonstration.

First build the React frontend:

```
cd client
npm install
npm run build
```

Then start the backend:

```
cd ../server
npm install
npm start
```

Open:

```
http://127.0.0.1:5000/is-audit
```

Express serves the built React app at `/is-audit` (`server/src/app.js`) and the MERN API at `/api/*`. `vite.config.js` sets the asset base path to `/is-audit/` for this build (`base: process.env.VERCEL ? '/' : '/is-audit/'`), and Express falls back to `index.html` for any `/is-audit/*` request so the SPA loads correctly on a direct visit or refresh.

If you are actively developing the React frontend, you can still use Vite:

```
cd client
npm run dev
```

and open `http://localhost:5173/is-audit`. The Vite server proxies `/api` to the Express server on port 5000.

## Docker

A `Dockerfile` and `docker-compose.yml` are included for a self-contained deployment (app + MongoDB):

```
docker compose up --build
```

This builds the client, installs server dependencies, and runs everything behind a single Express process on port 5000, with MongoDB running in its own container. Set `JWT_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` via a `.env` file or your shell environment before running — see `docker-compose.yml` for the full list of variables it reads.

## Deploying the frontend separately (e.g. Vercel)

If you deploy `client/` as a standalone static site (rather than using the one-port Express mode above), you need a rewrite rule so client-side routes resolve on refresh, since `react-router-dom`'s `BrowserRouter` handles routing entirely in the browser. Add a `vercel.json` in `client/`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Set `VITE_API_URL` (see below) to point the deployed frontend at your API.

## Production notes

For a deployed frontend, set:

```
VITE_API_URL=https://your-api-domain.example/api
```

and configure the backend:

```
CLIENT_ORIGIN=https://your-frontend-domain.example
MONGO_URI=...
JWT_SECRET=...
```

Do not commit `.env` files or production JWT secrets.

## AI narrative reports

The Summary Report page can generate a written narrative (headline, prose, top concerns, recommendations) from the same rolled-up insights the frontend already computes (audits, findings, risks, CAPA, assets, vendors, checklist). This is handled entirely locally by `server/scripts/generate_narrative.py` — a deterministic, rule-based generator with **no external API calls** — invoked by the backend (`POST /api/ai-reports/generate`) via `python3`. No API key or internet access is required; only Python 3 on the server's `PATH`.

## API resources

```
/api/auth
/api/users
/api/audits
/api/findings
/api/capas
/api/risks
/api/evidence
/api/assets
/api/vendors
/api/checklist
/api/reports
/api/settings
/api/dashboard
/api/ai-reports
```

The backend already includes Helmet, CORS, rate limiting, Mongo sanitisation, HPP protection, JWT validation and role-based access controls.

## Reset seeded data

To remove the seeded collections:

```
cd server
npm run seed:destroy
```

Then seed again with:

```
npm run seed
```

To (re)seed just the demo asset records:

```
npm run seed:assets
```