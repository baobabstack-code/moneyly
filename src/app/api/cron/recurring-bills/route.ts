import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel cron route to check for upcoming recurring bills
// and theoretically send notifications/emails or create in-app alerts.
export async function GET(request: Request) {
  try {
    // Validate cron secret if deployed (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase admin keys' }, { status: 500 });
    }

    // Use service role key to bypass RLS and fetch all user bills
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate dates
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Find all active bills due within the next 3 days
    const { data: bills, error } = await supabaseAdmin
      .from('recurring_bills')
      .select('id, user_id, name, amount, next_due_date, frequency, is_active')
      .eq('is_active', true)
      .lte('next_due_date', threeDaysFromNow.toISOString())
      .gte('next_due_date', today.toISOString());

    if (error) {
      throw error;
    }

    // Here, we would loop through the bills and dispatch emails or push notifications.
    // For now, we will simply log them as "detected" and return the count.
    
    // In a full implementation, you could insert into a 'notifications' table:
    // const notificationsToInsert = bills.map(bill => ({
    //   user_id: bill.user_id,
    //   message: `Your ${bill.name} bill of $${bill.amount} is due on ${new Date(bill.next_due_date).toLocaleDateString()}`,
    //   type: 'bill_reminder'
    // }));
    // await supabaseAdmin.from('notifications').insert(notificationsToInsert);

    return NextResponse.json({
      success: true,
      message: `Processed ${bills?.length || 0} upcoming bills.`,
      billsProcessed: bills?.length || 0
    });
  } catch (error: any) {
    console.error('Error in recurring-bills cron:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
