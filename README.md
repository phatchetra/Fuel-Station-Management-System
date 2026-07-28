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

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Default admin

- Email: `admin@fuelledger.local`
- Password: `password`

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
