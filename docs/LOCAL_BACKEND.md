# Test with a local backend (optional)

Use this when you want the **MediAI** frontend on `http://localhost:3000` to call **your** Nest API on `http://localhost:4000` before deploying.

## 1. Start PostgreSQL

From `MediAI_backend`:

```bash
docker compose up -d
```

## 2. Configure and run the API

```bash
cd MediAI_backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, FRONTEND_URL=http://localhost:3000

npx prisma migrate deploy
npm run start
```

API should be at `http://localhost:4000` — check `http://localhost:4000/api/health/database`.

## 3. Point the frontend at localhost

From `MediAI`:

```bash
cp .env.local.example .env.local
```

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_USE_LOCAL_API=true
```

Or instead:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 4. Run the frontend

```bash
cd MediAI
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A small **Local API** badge appears in the dashboard header when local mode is active.

## Switch back to production API

Remove `NEXT_PUBLIC_USE_LOCAL_API` from `.env.local`, or set:

```env
NEXT_PUBLIC_USE_LOCAL_API=false
NEXT_PUBLIC_API_URL=https://medi-ai-backend.vercel.app/api
```

Restart `npm run dev`.

## Notes

- `.env.local` overrides `.env` and is **not** committed.
- Vercel production builds use `.env.production` / dashboard env vars — not `.env.local`.
- Google OAuth needs `GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback` in backend `.env` for local sign-in.
