process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const migrationSql = `
-- Add spending_plan_id to transactions table referencing spending_plans
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS spending_plan_id UUID REFERENCES public.spending_plans(id) ON DELETE SET NULL;
`;

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected! Executing migration...');
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
