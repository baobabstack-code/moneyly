process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require'
});
c.connect()
  .then(() => c.query("ALTER TABLE public.spending_plans ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb"))
  .then(r => { console.log('Migration applied:', r.command); c.end(); })
  .catch(e => { console.error('Error:', e.message); c.end(); });
