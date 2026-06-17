const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("Starting Verification...");
  
  // 1. Verify Recurring Bills
  console.log("\n--- Verifying Recurring Bills ---");
  const testUserId = "00000000-0000-0000-0000-000000000000"; // We'll just fetch any user's profile to use
  
  const { data: users, error: userError } = await supabase.from('profiles').select('id, email').limit(2);
  if (userError || !users || users.length === 0) {
    console.error("Failed to fetch test users:", userError);
    return;
  }

  const user1 = users[0];
  console.log(`Using Test User 1: ${user1.email} (${user1.id})`);

  // Insert a test bill due tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data: newBill, error: billError } = await supabase.from('recurring_bills').insert({
    user_id: user1.id,
    name: "Netflix Test Bill",
    amount: 15.99,
    type: "expense",
    frequency: "monthly",
    next_due_date: tomorrow.toISOString(),
    is_active: true
  }).select().single();

  if (billError) {
    console.error("❌ Failed to create recurring bill:", billError);
  } else {
    console.log("✅ Successfully created recurring bill:", newBill.name, "Due:", newBill.next_due_date);
  }

  // 2. Verify Shared Wallets
  console.log("\n--- Verifying Shared Wallets ---");
  if (users.length < 2) {
    console.log("Need at least 2 users to test sharing. Skipping.");
    return;
  }
  const user2 = users[1];
  console.log(`Using Test User 2: ${user2.email} (${user2.id})`);

  // Fetch or create an account for user1
  let { data: account1 } = await supabase.from('accounts').select('*').eq('user_id', user1.id).limit(1).single();
  if (!account1) {
    const { data: newAcc, error: accError } = await supabase.from('accounts').insert({
      user_id: user1.id,
      name: "Shared Test Wallet",
      type: "checking",
      balance: 1000
    }).select().single();
    account1 = newAcc;
  }

  // Create an invite from user1 to user2
  const { data: newInvite, error: inviteError } = await supabase.from('account_invitations').insert({
    account_id: account1.id,
    inviter_id: user1.id,
    invitee_email: user2.email,
    status: 'pending'
  }).select().single();

  if (inviteError) {
    console.error("❌ Failed to create invitation:", inviteError);
  } else {
    console.log("✅ Successfully created invitation for:", newInvite.invitee_email);
    
    // Now accept the invite
    const { error: acceptError } = await supabase.from('account_invitations').update({ status: 'accepted' }).eq('id', newInvite.id);
    if (acceptError) {
      console.error("❌ Failed to accept invitation:", acceptError);
    } else {
      console.log("✅ Successfully accepted invitation!");
      
      // Verify shared_accounts insertion
      const { data: sharedAcc, error: sharedError } = await supabase.from('shared_accounts').insert({
        account_id: account1.id,
        user_id: user2.id,
        role: 'member'
      }).select().single();

      if (sharedError) {
        console.error("❌ Failed to insert into shared_accounts:", sharedError);
      } else {
        console.log("✅ Successfully added user to shared_accounts!");
      }
    }
  }

  console.log("\nVerification Complete!");
}

verify();
