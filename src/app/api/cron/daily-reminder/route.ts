import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';
import twilio from 'twilio';

/**
 * @openapi
 * /api/cron/daily-reminder:
 *   get:
 *     summary: Send personalized daily money-tracking reminder emails
 *     description: >
 *       Called by Vercel Cron (every 5 minutes for testing, daily in prod).
 *       For each opted-in user, fetches their month-to-date spending, budget,
 *       and top expense category, then sends a personalized email via Resend.
 *       Protected by CRON_SECRET — Vercel sets this automatically via the
 *       Authorization header.
 *     responses:
 *       200:
 *         description: Summary of sent/skipped/errored emails
 *       401:
 *         description: Unauthorized — missing or invalid CRON_SECRET
 *       500:
 *         description: Internal error
 */

// ── Types ───────────────────────────────────────────────────────────────────────

interface UserSpendingData {
  monthlySpent: number;
  monthlyBudget: number;
  todaySpent: number;
  topCategory: string | null;
  budgetPercent: number;
  daysLeftInMonth: number;
  currency: string;
}

// ── Handler ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Fetch opted-in users with budget prefs ────────────────────────────────
  const supabase = createAdminClient();

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, first_name, full_name, email_address, monthly_budget, currency, phone_number, reminder_email_enabled, reminder_sms_enabled')
    .or('reminder_email_enabled.eq.true,reminder_sms_enabled.eq.true');

  if (dbError) {
    console.error('[daily-reminder] DB error:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0, message: 'No opted-in users found.' });
  }

  // ── 3. Build date boundaries ─────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  // ── 4. Fetch spending data for all users in parallel ─────────────────────────
  const spendingByUser = await Promise.all(
    profiles.map(async (profile) => {
      // Month-to-date expenses
      const { data: monthTx } = await supabase
        .from('transactions')
        .select('amount, category_name')
        .eq('user_id', profile.id)
        .eq('type', 'expense')
        .gte('date', monthStart);

      // Today's expenses
      const { data: todayTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', profile.id)
        .eq('type', 'expense')
        .gte('date', todayStart);

      const monthlySpent = (monthTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);
      const todaySpent = (todayTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

      // Top spending category this month
      const categoryTotals: Record<string, number> = {};
      for (const t of monthTx ?? []) {
        const cat = t.category_name ?? 'Uncategorised';
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + (t.amount ?? 0);
      }
      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const monthlyBudget = parseFloat(profile.monthly_budget ?? '0') || 0;
      const budgetPercent = monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : -1;

      return {
        profile,
        spending: {
          monthlySpent,
          monthlyBudget,
          todaySpent,
          topCategory,
          budgetPercent,
          daysLeftInMonth,
          currency: profile.currency ?? 'USD',
        } satisfies UserSpendingData,
      };
    })
  );

  // ── 5. Send emails & SMS ────────────────────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

  if (!resendApiKey && !twilioClient) {
    console.warn('[daily-reminder] Both RESEND_API_KEY and TWILIO missing — mocking sends.');
    return NextResponse.json({ sent: profiles.length, skipped: 0, errors: 0, mocked: true });
  }

  const resend = resendApiKey ? new Resend(resendApiKey) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://moneyly.app';

  const results = await Promise.allSettled(
    spendingByUser.flatMap(({ profile, spending }) => {
      const name = profile.first_name || profile.full_name?.split(' ')[0] || 'there';
      const promises = [];

      // Email
      if (profile.reminder_email_enabled && profile.email_address) {
        if (resend) {
          promises.push(resend.emails.send({
            from: 'Moneyly <notifications@moneyly.app>',
            to: profile.email_address,
            subject: buildSubject(name, spending),
            html: buildReminderEmail(name, appUrl, spending),
          }));
        }
      }

      // SMS
      if (profile.reminder_sms_enabled && profile.phone_number) {
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
          promises.push(twilioClient.messages.create({
            body: buildSmsBody(name, spending),
            from: process.env.TWILIO_PHONE_NUMBER,
            to: profile.phone_number
          }));
        }
      }

      return promises;
    }).flat()
  );

  // ── 6. Tally results ──────────────────────────────────────────────────────────
  let sent = 0;
  let errors = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && !result.value.error) {
      sent++;
    } else {
      errors++;
      if (result.status === 'rejected') {
        console.error('[daily-reminder] Send failed:', result.reason);
      } else if (result.value.error) {
        console.error('[daily-reminder] Resend error:', result.value.error);
      }
    }
  }

  console.log(`[daily-reminder] Done — sent: ${sent}, errors: ${errors}`);
  return NextResponse.json({ sent, skipped: 0, errors });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildSubject(name: string, s: UserSpendingData): string {
  if (s.budgetPercent >= 90) return `\u26A0\uFE0F ${name}, you've used ${s.budgetPercent}% of your monthly budget`;
  if (s.todaySpent === 0)    return `\uD83D\uDCB0 ${name}, nothing logged today — quick check-in?`;
  return `\uD83D\uDCCA ${name}, your Moneyly daily snapshot`;
}

function buildSmsBody(name: string, s: UserSpendingData): string {
  const isOverBudget = s.budgetPercent >= 100;
  const isNearBudget = s.budgetPercent >= 80 && s.budgetPercent < 100;
  const nothingToday = s.todaySpent === 0;

  let msg = `Moneyly Snapshot for ${name}:\n`;
  msg += `Today: ${fmt(s.todaySpent, s.currency)}\n`;
  msg += `Month: ${fmt(s.monthlySpent, s.currency)}`;
  if (s.monthlyBudget > 0) msg += ` / ${fmt(s.monthlyBudget, s.currency)}`;

  if (isOverBudget) msg += `\n⚠️ Over budget!`;
  else if (isNearBudget) msg += `\n⚠️ Near limit (${s.budgetPercent}% used).`;
  else if (nothingToday) msg += `\nNothing logged today!`;

  return msg;
}

function buildBudgetBar(percent: number): string {
  const capped = Math.min(percent, 100);
  const color = percent >= 90 ? '#ef4444' : percent >= 70 ? '#f97316' : '#6366f1';
  return `
    <div style="background:#f1f5f9;border-radius:99px;height:10px;overflow:hidden;margin:8px 0 4px;">
      <div style="height:10px;width:${capped}%;background:${color};border-radius:99px;transition:width 0.3s;"></div>
    </div>
    <p style="margin:0;font-size:11px;color:#94a3b8;text-align:right;">${percent}% used</p>
  `;
}

function buildStatsSection(s: UserSpendingData): string {
  const hasBudget = s.monthlyBudget > 0;
  const remaining = s.monthlyBudget - s.monthlySpent;

  return `
    <!-- Stats grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="48%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Today's spending</p>
          <p style="margin:0;font-size:24px;font-weight:800;color:${s.todaySpent === 0 ? '#10b981' : '#0f172a'};">
            ${s.todaySpent === 0 ? '✓ Nothing yet' : fmt(s.todaySpent, s.currency)}
          </p>
          ${s.todaySpent === 0 ? '<p style="margin:4px 0 0;font-size:12px;color:#10b981;">Great start — log as you go!</p>' : ''}
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Month to date</p>
          <p style="margin:0;font-size:24px;font-weight:800;color:#0f172a;">${fmt(s.monthlySpent, s.currency)}</p>
          ${s.topCategory ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">Top: ${s.topCategory}</p>` : ''}
        </td>
      </tr>
    </table>

    ${hasBudget ? `
    <!-- Budget bar -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#334155;">Monthly budget</p>
        <p style="margin:0;font-size:13px;color:#64748b;">${fmt(s.monthlySpent, s.currency)} / ${fmt(s.monthlyBudget, s.currency)}</p>
      </div>
      ${buildBudgetBar(s.budgetPercent)}
      <p style="margin:8px 0 0;font-size:12px;color:${remaining < 0 ? '#ef4444' : '#64748b'};">
        ${remaining < 0
          ? `\u26A0\uFE0F Over budget by ${fmt(Math.abs(remaining), s.currency)}`
          : `${fmt(remaining, s.currency)} remaining &bull; ${s.daysLeftInMonth} day${s.daysLeftInMonth !== 1 ? 's' : ''} left`}
      </p>
    </div>` : ''}
  `;
}

function buildReminderEmail(name: string, appUrl: string, s: UserSpendingData): string {
  const isOverBudget = s.budgetPercent >= 100;
  const isNearBudget = s.budgetPercent >= 80 && s.budgetPercent < 100;
  const nothingToday = s.todaySpent === 0;

  const messageHtml = isOverBudget
    ? `<p style="margin:0 0 20px;color:#ef4444;font-size:15px;line-height:1.7;font-weight:600;">
        You've exceeded your monthly budget. Now is a great time to review your spending and cut back where you can.
       </p>`
    : isNearBudget
    ? `<p style="margin:0 0 20px;color:#f97316;font-size:15px;line-height:1.7;">
        You're getting close to your monthly budget limit — ${s.budgetPercent}% used.
        Be mindful of any non-essential spending for the rest of the month.
       </p>`
    : nothingToday
    ? `<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
        Nothing logged yet today — even a quick note on a coffee or lunch keeps you sharp.
        It only takes 30 seconds. 🔥
       </p>`
    : `<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
        Here's how your money is looking today. Keep logging and stay on track!
       </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Moneyly daily snapshot</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:6px;">💰</div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.4px;">Moneyly</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Daily money snapshot</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:19px;font-weight:700;">Hey ${name}! 👋</h2>
              ${messageHtml}

              ${buildStatsSection(s)}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;padding:13px 34px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                      Open Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 40px 28px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                You're receiving this because daily reminders are enabled on your account.<br/>
                <a href="${appUrl}/profile-setup" style="color:#6366f1;text-decoration:none;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
