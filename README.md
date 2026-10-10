# smart-tap

Digital cards you share with a tap. This repo is the Next.js web app. Sign-in is Clerk. Postgres and file storage are Supabase.

## Develop

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Put these in `.env.local` locally and in Vercel when you connect the project. Do not commit the file.

| Name | Notes |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk development publishable key |
| `CLERK_SECRET_KEY` | Server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key, safe for the browser |

Clerk is a third-party auth provider on the Supabase project. Session tokens include `role: authenticated`. Row-level security reads the Clerk user id from `auth.jwt()->>'sub'`.
