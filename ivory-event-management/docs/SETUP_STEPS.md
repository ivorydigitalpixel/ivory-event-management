# Setup steps

This repository is connected to the existing Supabase project `ivory-event-management`; do not create another project or rerun the foundation migration.

1. Follow [AUTH_SETUP.md](AUTH_SETUP.md).
2. In Vercel keep the nested `ivory-event-management` directory as the app root.
3. Set the public environment variables from `.env.example` and redeploy.
4. In Supabase set the production Site URL and trusted confirmation redirect URLs as documented.
5. Create an account with a real email, confirm in the same browser, sign in, create a workspace, and sign out. Revisit `/dashboard` to verify access is blocked.

No paid plan or schema change is required for the code update. Configure customer email delivery with your chosen SMTP provider before a public launch.
