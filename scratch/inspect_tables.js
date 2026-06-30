const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in public schema:');
    console.log(res.rows.map(r => r.table_name));

    const policies = await client.query(`
      SELECT polname, polcmd, polqual, pg_get_expr(polqual, polrelid) as qual_expr, pg_get_expr(polwithcheck, polrelid) as withcheck_expr
      FROM pg_policy
      WHERE polrelid = 'public.profiles'::regclass;
    `);
    console.log('profiles policies:');
    console.log(policies.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
