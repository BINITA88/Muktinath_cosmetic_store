# Kalpana Cosmetic Store

```
kalpana_cosmetic_store/
├── frontend/   Static storefront (HTML, CSS, JavaScript, images)
└── backend/    Express API and MongoDB integration
```

The store uses MongoDB for products, categories, users, and orders. The Express server also serves `frontend/`, so only one server is needed.

## Setup

1. Start MongoDB locally, or create a MongoDB Atlas database.
2. In `backend`, copy `.env.example` to `.env` and set `MONGODB_URI` if needed.
3. Install and run the server:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5001`. On its first successful database connection, the API creates indexes and seeds the initial product and category data.

`GET /api/health` confirms that the API is running.

Do not commit `backend/.env`; it contains local configuration and secrets.
