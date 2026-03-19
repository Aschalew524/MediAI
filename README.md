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

`src/lib/axios.ts` reads `NEXT_PUBLIC_API_URL` and uses it as the default Axios base URL.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Axios Documentation](https://axios-http.com/docs/intro)
