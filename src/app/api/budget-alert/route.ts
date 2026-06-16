import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * @openapi
 * /api/budget-alert:
 *   post:
 *     summary: Check if a user has crossed a budget threshold and send an alert email
 *     description: >
 *       Called client-side after a new expense is saved to Supabase.
 *       Sums the user's month-to-date expenses, checks against monthly_budget,
 *       and fires an email if the 80% or 100% threshold was just crossed.
 *       Uses budget_alerts_sent on profiles to prevent duplicate alerts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Result — alert sent, already sent, or no budget set
 *       400:
 *         description: Missing user_id
 *       500:
 *         description: Internal error
 */

const THRESHOLDS = [80, 100] as const;

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── 1. Get profile ─────────────────────────────────────────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, first_name, full_name, email_address, monthly_budget, budget_alerts_sent, currency, reminder_email_enabled')
      .eq('id', user_id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ skipped: true, reason: 'profile not found' });
    }

    const monthlyBudget = parseFloat(profile.monthly_budget ?? '0') || 0;
    if (monthlyBudget <= 0) {
      return NextResponse.json({ skipped: true, reason: 'no budget set' });
    }

    if (!profile.email_address) {
      return NextResponse.json({ skipped: true, reason: 'no email' });
    }

    // ── 2. Month-to-date expenses ──────────────────────────────────────────────
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: expenses } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('type', 'expense')
      .gte('date', monthStart);

    const totalSpent = (expenses ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const percent = Math.round((totalSpent / monthlyBudget) * 100);

    // ── 3. Check thresholds ────────────────────────────────────────────────────
    const alreadySent = (profile.budget_alerts_sent ?? '').split(',').filter(Boolean);

    // Reset alerts if new month (budget_alerts_sent still has values from last month)
    // This auto-resets on first check of each new month
    const lastResetMonth = alreadySent.length > 0 ? alreadySent[0] : '';
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const isNewMonth = !lastResetMonth.startsWith('m:') || lastResetMonth !== `m:${currentMonthKey}`;

    const sentThresholds = isNewMonth ? [] : alreadySent.filter((s: string) => !s.startsWith('m:'));

    const crossedThreshold = THRESHOLDS.find(
      (t) => percent >= t && !sentThresholds.includes(String(t))
    );

    if (!crossedThreshold) {
      return NextResponse.json({ skipped: true, reason: 'no new threshold crossed', percent });
    }

    // ── 4. Send alert email ────────────────────────────────────────────────────
    const name = profile.first_name || profile.full_name?.split(' ')[0] || 'there';
    const currency = profile.currency ?? 'USD';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://moneyly.app';
    const remaining = monthlyBudget - totalSpent;
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

    let emailSent = false;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { error: sendErr } = await resend.emails.send({
        from: 'Moneyly <notifications@moneyly.app>',
        to: profile.email_address,
        subject: crossedThreshold >= 100
          ? `\u26A0\uFE0F ${name}, you've exceeded your monthly budget`
          : `\u{1F6A8} ${name}, you've used ${percent}% of your monthly budget`,
        html: buildAlertEmail(name, appUrl, {
          threshold: crossedThreshold,
          percent,
          totalSpent,
          monthlyBudget,
          remaining,
          daysLeft,
          currency,
        }),
      });

      if (sendErr) {
        console.error('[budget-alert] Resend error:', sendErr);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }

      emailSent = true;
    } else {
      console.warn('[budget-alert] RESEND_API_KEY missing — mocking send.');
      emailSent = true;
    }

    // ── 5. Mark threshold as sent ──────────────────────────────────────────────
    if (emailSent) {
      const newSent = [`m:${currentMonthKey}`, ...sentThresholds, String(crossedThreshold)].join(',');
      await supabase
        .from('profiles')
        .update({ budget_alerts_sent: newSent })
        .eq('id', user_id);
    }

    return NextResponse.json({
      sent: true,
      threshold: crossedThreshold,
      percent,
      totalSpent,
      monthlyBudget,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[budget-alert] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface AlertData {
  threshold: number;
  percent: number;
  totalSpent: number;
  monthlyBudget: number;
  remaining: number;
  daysLeft: number;
  currency: string;
}

function buildAlertEmail(name: string, appUrl: string, d: AlertData): string {
  const isOver = d.threshold >= 100;
  const headerBg = isOver
    ? 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)'
    : 'linear-gradient(135deg,#f97316 0%,#fb923c 100%)';
  const headerEmoji = isOver ? '\u26A0\uFE0F' : '\uD83D\uDEA8';
  const headerTitle = isOver ? 'Budget Exceeded' : 'Budget Warning';
  const barColor = isOver ? '#ef4444' : '#f97316';
  const barWidth = Math.min(d.percent, 100);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${headerBg};padding:32px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:6px;">${headerEmoji}</div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.4px;">
                ${headerTitle}
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Moneyly Budget Alert</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:19px;font-weight:700;">
                Hey ${name}! ${isOver ? '\uD83D\uDED1' : '\uD83D\uDC4B'}
              </h2>

              <p style="margin:0 0 20px;color:${isOver ? '#dc2626' : '#ea580c'};font-size:15px;line-height:1.7;font-weight:600;">
                ${isOver
                  ? "You've spent more than your monthly budget. Time to review and cut back on non-essentials."
                  : `You've used ${d.percent}% of your monthly budget. Be mindful of your remaining spending.`}
              </p>

              <!-- Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="48%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Spent this month</p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:#dc2626;">${fmt(d.totalSpent, d.currency)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Monthly budget</p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:#0f172a;">${fmt(d.monthlyBudget, d.currency)}</p>
                  </td>
                </tr>
              </table>

              <!-- Budget bar -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
                <div style="background:#f1f5f9;border-radius:99px;height:12px;overflow:hidden;">
                  <div style="height:12px;width:${barWidth}%;background:${barColor};border-radius:99px;"></div>
                </div>
                <p style="margin:8px 0 0;font-size:12px;color:${d.remaining < 0 ? '#ef4444' : '#64748b'};">
                  ${d.remaining < 0
                    ? `Over budget by ${fmt(Math.abs(d.remaining), d.currency)}`
                    : `${fmt(d.remaining, d.currency)} remaining \u2022 ${d.daysLeft} day${d.daysLeft !== 1 ? 's' : ''} left`}
                </p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
                <tr>
                  <td align="center" style="background:${headerBg};border-radius:12px;">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;padding:13px 34px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                      Review My Spending \u2192
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
                Budget alerts fire once per threshold (80%, 100%) per month.<br/>
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
