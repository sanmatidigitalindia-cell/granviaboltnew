import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const demoUsers = [
  {
    role: 'super_admin',
    email: process.env.VITE_DEMO_SUPERADMIN_EMAIL || 'admin@demo.local',
    password: process.env.VITE_DEMO_SUPERADMIN_PASSWORD || 'DemoPass123!',
    full_name: 'Demo Admin',
  },
  {
    role: 'guard',
    email: process.env.VITE_DEMO_GUARD_EMAIL || 'guard@demo.local',
    password: process.env.VITE_DEMO_GUARD_PASSWORD || 'DemoGuard123!',
    full_name: 'Demo Guard',
  },
  {
    role: 'employer',
    email: process.env.VITE_DEMO_EMPLOYER_EMAIL || 'employer@demo.local',
    password: process.env.VITE_DEMO_EMPLOYER_PASSWORD || 'DemoEmployer123!',
    full_name: 'Demo Employer',
  },
];

async function createOrUpdateDemoUser(item) {
  console.log('Processing', item.email);
  // Create user via admin API with role in user metadata
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: item.email,
    password: item.password,
    email_confirm: true,
    user_metadata: { full_name: item.full_name, demo: true, role: item.role },
  }).catch(e => ({ error: e }));

  let userData;
  if (createError) {
    // If user already exists, try to fetch by email and update metadata
    console.warn('Create user error (may already exist):', createError.message || createError);
    const listRes = await supabase.auth.admin.listUsers().catch(e => ({ error: e }));
    if (listRes.error) {
      console.error('Failed to list users:', listRes.error.message || listRes.error);
      throw createError;
    } else {
      const usersArray = listRes.data?.users || listRes.users || listRes.data || [];
      const existing = (Array.isArray(usersArray) ? usersArray : []).find(u => u.email === item.email);
      if (existing) {
        userData = existing;
        // Try to update metadata to ensure role is set
        await supabase.auth.admin.updateUserById(existing.id, {
          user_metadata: { full_name: item.full_name, demo: true, role: item.role },
        }).catch(e => console.warn('Could not update metadata:', e.message || e));
      } else {
        throw createError;
      }
    }
  } else {
    userData = user?.data?.user || user;
  }

  const userId = userData?.id || userData?.uuid || userData?.user_id;
  if (!userId) {
    console.error('User result:', userData);
    throw new Error('Failed to obtain user id for ' + item.email);
  }

  console.log('✓ Seeded', item.email, 'as', item.role);
}

(async function main() {
  for (const item of demoUsers) {
    try {
      await createOrUpdateDemoUser(item);
    } catch (err) {
      console.error('Error seeding', item.email, err instanceof Error ? err.message : err);
    }
  }
  console.log('Demo seeding complete.');
  process.exit(0);
})();
