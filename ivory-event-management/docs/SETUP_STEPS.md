# Setup steps (free tiers are enough to start; tell Claude before you add any paid plan)

1. **GitHub**: github.com > Sign up > create a *private* repository named `ivory-event-management`. Upload the contents of this folder.
2. **Supabase**: supabase.com > New project. Choose a region near your customers and save the database password in a password manager (do not paste it anywhere else).
3. In Supabase open **SQL Editor > New query**, paste the whole of `supabase/migrations/0001_foundation.sql`, press **Run**. Expect "Success. No rows returned." If you see an error, copy the error text to Claude.
4. In Supabase open **Project Settings > API**. Copy the *Project URL* and the *anon public* key. (Never copy the "service_role" key into chat.)
5. **Vercel**: vercel.com > Add New > Project > import the GitHub repository. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the two values from step 4. Press Deploy.
6. Open the temporary Vercel link, create an account, confirm the email, sign in, and create a workspace. If any step fails, tell Claude exactly what you saw.
