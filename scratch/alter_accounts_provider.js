const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    console.log('Adding provider column to public.accounts table...');
    await client.query(`
      ALTER TABLE public.accounts 
      ADD COLUMN IF NOT EXISTS provider TEXT;
    `);
    console.log('Database altered successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
