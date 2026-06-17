const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true', ssl: { rejectUnauthorized: false } });
async function main() {
  await client.connect();
  try {
    const res = await client.query("SELECT conname FROM pg_constraint WHERE conrelid = 'public.accounts'::regclass AND contype = 'c'");
    for (const row of res.rows) {
      console.log('Dropping', row.conname);
      await client.query("ALTER TABLE public.accounts DROP CONSTRAINT \"" + row.conname + "\"");
    }
    console.log('Done');
  } finally {
    await client.end();
  }
}
main();
