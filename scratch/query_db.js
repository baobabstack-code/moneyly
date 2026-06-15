const { Client } = require('pg');

const client = new Client({
  user: 'postgres.xohuyqossycmailwgtzy',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'uuJO76CfoFDYKdJ1',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const plansRes = await client.query('SELECT id, reference, product_name, planned_cost, saved_amount, status FROM spending_plans;');
    console.log('--- SPENDING PLANS ---');
    console.log(plansRes.rows);

    const txsRes = await client.query('SELECT id, amount, type, note, category_name, spending_plan_id FROM transactions;');
    console.log('--- TRANSACTIONS ---');
    console.log(txsRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
