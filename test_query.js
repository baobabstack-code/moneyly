const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  console.log("Testing query on account_invitations...");
  const { data, error } = await supabase
    .from('account_invitations')
    .select('id, account_id, status, created_at, account:account_id(name)')
    .eq('invitee_email', 'mrshepard18@gmail.com')
    .eq('status', 'pending');

  if (error) {
    console.error("Supabase Error Details:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Data:", data);
  }
}

testQuery();
