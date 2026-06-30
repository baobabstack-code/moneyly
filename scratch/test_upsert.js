const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const userId = 'daadd46a-c475-4bde-bc9f-f94295537652';
  try {
    const res = await client.query({
      text: `
        INSERT INTO public.profiles (
          id, first_name, last_name, username, monthly_income, 
          reminder_email_enabled, reminder_sms_enabled, phone_number, 
          daily_budget, weekly_budget, monthly_budget, accent_color, 
          currency, tts_voice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          username = EXCLUDED.username,
          monthly_income = EXCLUDED.monthly_income,
          reminder_email_enabled = EXCLUDED.reminder_email_enabled,
          reminder_sms_enabled = EXCLUDED.reminder_sms_enabled,
          phone_number = EXCLUDED.phone_number,
          daily_budget = EXCLUDED.daily_budget,
          weekly_budget = EXCLUDED.weekly_budget,
          monthly_budget = EXCLUDED.monthly_budget,
          accent_color = EXCLUDED.accent_color,
          currency = EXCLUDED.currency,
          tts_voice = EXCLUDED.tts_voice
        RETURNING *;
      `,
      values: [
        userId, 'Nyasha', 'Test', 'nyasha_test', '1000',
        true, false, null, 10, 50, 200, 'purple', 'USD', null
      ]
    });
    console.log('SUCCESS! Upserted row:', res.rows[0]);
  } catch (err) {
    console.error('UPSERT ERROR:', err);
  } finally {
    await client.end();
  }
}

main();
