# Fuel Ledger Frontend

React SPA for the Fuel Ledger gas station management system.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173 and proxies API requests to the Laravel backend at http://localhost:8000.

## Default login

- Email: `admin@fuelledger.local`
- Password: `password`

## Production

Set `VITE_API_URL` to your Laravel API origin when not using the dev proxy.
