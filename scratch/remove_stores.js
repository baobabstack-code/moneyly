const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const migrationSql = `
-- Drop foreign key constraint on spending_plans
ALTER TABLE public.spending_plans DROP CONSTRAINT IF EXISTS fk_spending_plans_store;

-- Drop store_id column on spending_plans
ALTER TABLE public.spending_plans DROP COLUMN IF EXISTS store_id;

-- Drop stores table
DROP TABLE IF EXISTS public.stores CASCADE;
`;

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected! Executing migration to remove stores...');
  try {
    await client.query(migrationSql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
