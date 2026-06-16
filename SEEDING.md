Seed demo users and prefill login fields

1. Add your Supabase service role key to `.env.local`:

   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

2. (Optional) The demo credentials in `.env.local` are:

   VITE_DEMO_SUPERADMIN_EMAIL=admin@demo.local
   VITE_DEMO_SUPERADMIN_PASSWORD=DemoPass123!
   VITE_DEMO_GUARD_EMAIL=guard@demo.local
   VITE_DEMO_GUARD_PASSWORD=DemoGuard123!
   VITE_DEMO_EMPLOYER_EMAIL=employer@demo.local
   VITE_DEMO_EMPLOYER_PASSWORD=DemoEmployer123!

3. Run the seed script (requires Node 18+):

   node scripts/seedDemoUsers.mjs

This script uses the Supabase admin API to create users and upsert minimal profile rows. Do not commit `SUPABASE_SERVICE_ROLE_KEY` to version control. Use this only for local demos.
