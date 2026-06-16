import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * @openapi
 * /api/cron/daily-reminder:
 *   get:
 *     summary: Send daily money-tracking reminder emails
 *     description: >
 *       Called by Vercel Cron (every 5 minutes in dev, daily in prod).
 *       Queries all opted-in profiles and sends each a reminder email via Resend.
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
export async function GET(req: Request) {
  // ── 1. Auth guard ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Fetch opted-in users ────────────────────────────────────────────────
  const supabase = createAdminClient();

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, first_name, full_name, email_address')
    .eq('reminder_email_enabled', true)
    .not('email_address', 'is', null);

  if (dbError) {
    console.error('[daily-reminder] DB error:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0, message: 'No opted-in users found.' });
  }

  // ── 3. Send emails ─────────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.warn('[daily-reminder] RESEND_API_KEY missing — mocking sends.');
    return NextResponse.json({ sent: profiles.length, skipped: 0, errors: 0, mocked: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://moneyly.app';

  const results = await Promise.allSettled(
    profiles.map((profile) => {
      const name = profile.first_name || profile.full_name?.split(' ')[0] || 'there';

      return resend.emails.send({
        from: 'Moneyly <notifications@moneyly.app>',
        to: profile.email_address!,
        subject: "\uD83D\uDCB0 Quick check-in: how's your money doing today?",
        html: buildReminderEmail(name, appUrl),
      });
    })
  );

  // ── 4. Tally results ───────────────────────────────────────────────────────
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

// ── Email HTML builder ─────────────────────────────────────────────────────────
function buildReminderEmail(name: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your daily money check-in</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">💰</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                Moneyly
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Your personal finance tracker
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">
                Hey ${name}! 👋
              </h2>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
                Just a quick nudge — have you logged your spending today?
                Staying on top of your money daily is the single most powerful habit
                for reaching your financial goals.
              </p>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
                It only takes 30 seconds. Open your dashboard, add what you spent, and
                keep that streak alive. 🔥
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                      Track My Money →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tip card -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:8px;">
                <p style="margin:0 0 4px;color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                  💡 Daily tip
                </p>
                <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
                  Small expenses add up fast. Even logging a coffee keeps your awareness sharp
                  and your budget honest.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                You're receiving this because you have daily reminders enabled.<br/>
                <a href="${appUrl}/profile-setup" style="color:#6366f1;text-decoration:none;">
                  Manage notification preferences
                </a>
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
