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

Copy `.env.example` to `.env.local` and set your backend base URL:

```bash
cp .env.example .env.local
```

`src/lib/axios.ts` reads `NEXT_PUBLIC_API_URL` and uses it as the Axios base URL.

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
