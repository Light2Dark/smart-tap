<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

- Use pnpm.
- Clerk (`@clerk/nextjs`) is sign-in. Keep `ClerkProvider` inside `<body>`. In `proxy.ts`, `'/__clerk/:path*'` comes after `'/(api|trpc)(.*)'`. Always `await auth()`.
- Supabase is the database and file store. Use `createClient` from `utils/supabase/server` on the server and `useSupabase` in client components. Pass the Clerk session token with `accessToken`. Do not add a Supabase cookie session. The token's `role` claim is `authenticated`. RLS uses `auth.jwt()->>'sub'`, the Clerk user id.
- Cache Components are on. Wrap `auth()` and `<Show>` in `<Suspense>`.
- Do not read or print `.env*` files. `CLERK_SECRET_KEY` stays on the server.
