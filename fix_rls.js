const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function applyMigrations() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const sql = `
-- Drop ALL policies on account_invitations
DROP POLICY IF EXISTS "Users can view invites sent to their email" ON public.account_invitations;
DROP POLICY IF EXISTS "Users can update their own invites" ON public.account_invitations;

-- Use auth.jwt() ->> 'email' to avoid querying auth.users!
CREATE POLICY "Users can view invites sent to their email" ON public.account_invitations 
FOR SELECT USING (invitee_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can update their own invites" ON public.account_invitations 
FOR UPDATE USING (invitee_email = (auth.jwt() ->> 'email'));

NOTIFY pgrst, 'reload schema';
    `;

    console.log("Executing SQL...");
    await client.query(sql);
    console.log("SQL executed successfully.");
  } catch (err) {
    console.error("Error applying migrations:", err);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

applyMigrations();
