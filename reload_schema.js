const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function reloadSchema() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const sql = `NOTIFY pgrst, 'reload schema';`;

    console.log("Executing NOTIFY pgrst...");
    await client.query(sql);
    console.log("PostgREST schema cache reloaded successfully.");
  } catch (err) {
    console.error("Error reloading schema:", err);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

reloadSchema();
