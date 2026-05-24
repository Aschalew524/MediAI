## MediAI Frontend

This project is set up with:

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Axios

The machine used during setup did not have a compatible global Node/npm install, so a project-local Node runtime is available in `./.node`.

## Getting Started

Run the development server:

```bash
./dev.sh
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Other useful commands:

```bash
./build.sh
./lint.sh
```

## Environment

Default (committed `.env`) points at the **deployed** API:

```text
NEXT_PUBLIC_API_URL=https://medi-ai-backend.vercel.app/api
```

### Optional: local backend before deploy

To test your own `MediAI_backend` changes on `http://localhost:4000`:

```bash
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_USE_LOCAL_API=true` in `.env.local`, start Postgres + `npm run start` in `MediAI_backend`, then `npm run dev` here. See [docs/LOCAL_BACKEND.md](docs/LOCAL_BACKEND.md).

`src/lib/axios.ts` uses `getApiBaseUrl()` — local dev hits the API directly; production uses the `/nest` proxy.

**Vercel (frontend — [medi-ai-theta.vercel.app](https://medi-ai-theta.vercel.app/)):** set **only**:

```text
NEXT_PUBLIC_API_URL=https://medi-ai-backend.vercel.app/api
```

Do **not** set this to `medi-ai-theta.vercel.app` (that is the Next.js site, not the API). Redeploy after saving.

The app proxies API calls through `/nest/*` on the same origin so sign-in works even before backend CORS is updated.

**Vercel (backend — medi-ai-backend.vercel.app):** set `DATABASE_URL` (Neon pooled), `JWT_SECRET`, and `FRONTEND_URL=https://medi-ai-theta.vercel.app`. See `MediAI_backend/docs/DEPLOYMENT_VERCEL.md`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Axios Documentation](https://axios-http.com/docs/intro)
