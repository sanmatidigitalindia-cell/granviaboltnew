import 'dotenv/config';
import { Client } from 'pg';

const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error('SUPABASE_DB_URL not set.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    console.log('Profiles table schema:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
  } finally {
    await client.end();
  }
})();
