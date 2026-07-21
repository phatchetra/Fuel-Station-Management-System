# Fuel Ledger

Gas station management system for a small Cambodian fuel station. Khmer-first UI with **React + Laravel + MySQL**.

## Project structure

```
Fuel-Ledger/
├── backend/          Laravel 13 REST API (Sanctum SPA auth)
└── frontend/         React 19 + Vite SPA with sidebar navigation
```

## Features

- Three fuel types: សាំងធម្មតា (Regular), សាំងស៊ុបពែរ (Premium), ម៉ាស៊ូត (Diesel)
- Fuel sales with automatic FIFO stock deduction
- Refills that create new stock batches
- Daily sessions with open/closed periods
- Daily expense management
- Close-day workflow with immutable reports
- Customer debt and payment tracking
- Sale corrections for closed sessions with audit trail
- Closed daily reports with filtering and CSV/PDF export
- Editable KHR-to-USD exchange rate (default 4100)

## Quick start

### 1. MySQL

Ensure MySQL 8 is running on port 3306 and create the database:

```sql
CREATE DATABASE IF NOT EXISTS fuel_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

API: http://localhost:8000

Update `backend/.env` for your MySQL credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fuel_ledger
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:5173
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

The Vite dev server proxies `/api` and `/sanctum` to `http://localhost:8000`.

## Default admin

- Email: `admin@fuelledger.local`
- Password: `password`

## Authentication

Uses **Laravel Sanctum SPA mode** with session cookies and CSRF protection:

1. Frontend fetches `/sanctum/csrf-cookie`
2. Login via `POST /api/auth/login` with `credentials: 'include'`
3. All API requests include session cookies and `X-XSRF-TOKEN` header

## Production deployment

| Layer | Suggested hosting |
|-------|-------------------|
| React SPA | Vercel, Netlify, Cloudflare Pages |
| Laravel API | Forge, Railway, VPS |
| MySQL | Managed MySQL (Aiven, RDS, etc.) |

Production checklist:

- Set `SANCTUM_STATEFUL_DOMAINS` to your frontend domain (e.g. `app.example.com`)
- Set `APP_URL` to your API origin
- Configure CORS and session cookie domain for cross-subdomain auth if needed
- Set `SESSION_SECURE_COOKIE=true` and use HTTPS
- Build frontend with `npm run build` and serve `frontend/dist/`
- Optionally set `VITE_API_URL` to the API origin if not using a reverse proxy

## UI design

Dark dashboard theme with gold brand accent:

| Token | Value |
|-------|-------|
| Background | `#090b10` |
| Cards / sidebar | `#151922`, `#1a1f2b` |
| Brand gold | `#F2A93B` |
| Main text | `#f4f5f7` |
| Muted text | `#8b95a8` |

Fonts: **Siemreap** (Khmer UI via Fontsource).

Reusable CSS classes: `.card`, `.btn-gold`, `.btn-primary`, `.fuel-card-v2`, `.stat-card`

## Before pushing to GitHub

```bash
# From project root — ensure .env files are NOT staged
git status

# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
php artisan test
```

Never commit `backend/.env`, `frontend/.env`, `vendor/`, `node_modules/`, or `frontend/dist/`.
Use `backend/.env.example` and `frontend/.env.example` as templates only.
