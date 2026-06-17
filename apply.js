const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function applyMigrations() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    
    const filesToApply = [
      '20260616212806_shared_wallets.sql',
      '20260616215730_create_recurring_bills.sql',
      '20260616_daily_reminder.sql',
      '20260616_budget_alerts.sql'
    ];

    for (const file of filesToApply) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`Applying ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`Successfully applied ${file}.`);
      } else {
        console.warn(`File not found: ${file}`);
      }
    }

  } catch (err) {
    console.error("Error applying migrations:", err);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

applyMigrations();
