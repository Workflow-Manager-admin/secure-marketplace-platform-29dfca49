# Easy Buy Backend API

Node.js/Express API for Secure Marketplace platform.

## Features

- User authentication (register/login, JWT)
- Product CRUD with image upload
- User profile, view/edit
- Chat messaging (user-to-user, per product)
- Payment webhook/callback endpoint stub
- User settings (notifications, language, dark mode)
- MySQL integration via env config
- CORS for frontend dev
- Modular code structure for controllers/services/routes

## Getting Started

1. Copy `.env.example` to `.env` and fill in your DB/JWT details.
2. `npm install`
3. `npm run dev` or `npm start`
4. MySQL schema and demo seed are in `../schema.sql` and `../seed_data.sql`
5. File uploads are saved to `uploads/`.

## Main Endpoints

- `POST /api/auth/register` and `/login`
- `/api/products` [GET, POST, PUT, DELETE]
- `/api/products/:id/images` (multipart/form upload)
- `/api/users/me` and `/api/users/:id`
- `/api/chat/:userId`
- `/api/payments/callback` (POST)
- `/api/settings/me`
