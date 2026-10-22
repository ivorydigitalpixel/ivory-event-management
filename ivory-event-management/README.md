# Ivory Event Management

Next.js foundation for workspace-based event management. Includes Supabase email/password sign-up, confirmation, login, logout, session refresh, and protected app routes. The dashboard lists active workspace memberships and creates workspaces through the existing Supabase RPC.

See [authentication setup](docs/AUTH_SETUP.md) for Vercel variables, Supabase redirect URLs, and validation. The existing event operations screens, invitations, payments, and platform operator console remain future work.

```sh
cp .env.example .env.local
npm ci
npm test
npm run typecheck
npm run build
npm start
```
