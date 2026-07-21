# Fuel Ledger API

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## MySQL

Ensure MySQL 8 is running locally, then set in `backend/.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fuel_ledger
DB_USERNAME=root
DB_PASSWORD=
```

Create the database if needed:

```sql
CREATE DATABASE IF NOT EXISTS fuel_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Default admin

- Email: `admin@fuelledger.local`
- Password: `password`
