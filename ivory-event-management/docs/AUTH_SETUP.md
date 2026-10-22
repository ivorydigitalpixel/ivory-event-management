# Authentication setup

The app uses Supabase project `vgtcvmjjwwqeagjfonnw` (`ivory-event-management`). Email/password signup, confirmation, login, logout, and session refresh are implemented. All routes except `/`, `/login`, `/auth/callback`, `/auth/confirm`, and Next.js static assets require authentication. Future API routes return HTTP 401 for anonymous requests. Check identity and permissions again inside every new Server Action and data-access function; middleware is only the first layer.

## Vercel

Keep the Root Directory as `ivory-event-management` (the nested application folder). Add the two public variables from `.env.example` to Production and Preview, then redeploy. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works as a fallback. Never use a secret or service-role key in these variables.

## Supabase Dashboard → Authentication → URL Configuration

Set Site URL to `https://ivory-event-management.vercel.app`.
Add redirect URLs:

- `https://ivory-event-management.vercel.app/auth/callback**`
- `http://localhost:3000/auth/callback**`

Add each trusted preview deployment explicitly if testing signup there. Do not allow arbitrary domains. Email/password authentication must be enabled. Keep Confirm email enabled. Default Supabase confirmation emails work with the PKCE callback; open the email in the browser that started signup. The optional `/auth/confirm?token_hash=...&type=email` route also supports custom token-hash templates when custom SMTP is configured. It deliberately rejects recovery/invite tokens because their dedicated flows are not implemented.

Use your own SMTP provider to deliver signup emails to customers rather than relying on the restricted default mail service. Dashboard Auth settings cannot be changed through the currently exposed Supabase tools, so verify these dashboard values before release.

## Local verification

Use Node 24 (or a Node version supporting native TypeScript stripping for the tests).

```sh
cp .env.example .env.local
npm ci
npm test
npm run typecheck
npm run build
npm start
# In another terminal, exercise the running app:
TEST_BASE_URL=http://localhost:3000 npm test
```

Anonymous `/dashboard` and nested pages must redirect to `/login?next=...`. `/api/...` must return 401. Invalid confirmation links must redirect to a readable error on login. Confirm a real email, log in, create a workspace, log out, and check that navigating back cannot reopen the dashboard. Expired sessions should refresh cookies, including on redirects. A signed-in user visiting `/login` returns to their dashboard.

Database row-level security remains the authority for workspace membership. `createWorkspace` independently validates the current user before invoking the existing RPC. No existing users, records, or RLS policies are changed by this code update.
