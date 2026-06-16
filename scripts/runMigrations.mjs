import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error('SUPABASE_DB_URL not set in environment.');
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter(file => file.endsWith('.sql'))
  .sort()
  .map(file => path.join(MIGRATIONS_DIR, file));

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log(`Connected to DB, running ${migrationFiles.length} migrations...`);
    for (const migrationFile of migrationFiles) {
      console.log(`Running ${path.basename(migrationFile)}...`);
      await client.query(fs.readFileSync(migrationFile, 'utf8'));
    }
    console.log('Migrations executed successfully.');
  } catch (err) {
    console.error('Migration error:', err instanceof Error ? err.message : err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
