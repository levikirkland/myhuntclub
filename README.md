# My Hunt Club (myhuntclub)

Monorepo: `frontend/` (Vite + Vue 3 + Vuetify) and `server/` (Express + SQLite).

Quick start (Linux):

1) Frontend

```bash
cd frontend
npm install
npm run dev
```

2) Backend

```bash
cd server
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:4000`.

Auth notes:
- Registration form includes `accountId` for simple multitenancy scoping on the user record.
- Backend returns a JWT on login that contains `userId` and `accountId`.
