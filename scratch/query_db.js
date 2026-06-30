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
    const profilesRes = await client.query('SELECT * FROM profiles;');
    console.log('--- PROFILES ---');
    console.log(profilesRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
