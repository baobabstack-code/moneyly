const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const migrationSql = `
-- Add budget_limit column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS budget_limit NUMERIC(12,2) DEFAULT 0.00;
`;

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected! Executing schema updates...');
  try {
    await client.query(migrationSql);
    console.log('Database migration executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
