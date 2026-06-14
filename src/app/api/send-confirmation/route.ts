import { Resend } from 'resend';
import { NextResponse } from 'next/server';

/**
 * @openapi
 * /api/send-confirmation:
 *   post:
 *     summary: Send spending plan confirmation email
 *     description: Sends an email with the generated spending plan PDF as an attachment using Resend. The planned purchase data captured before this step is also structured for future backend submission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               pdfBase64:
 *                 type: string
 *                 description: Base64 encoded PDF data URI
 *               customerName:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       500:
 *         description: Error sending email
 */
export async function POST(req: Request) {
  try {
    const { email, pdfBase64, customerName, reference } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Mocking email delivery.');
      return NextResponse.json({ success: true, mocked: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Convert data URI to clean base64 if needed
    const base64Data = pdfBase64.split(',')[1] || pdfBase64;

    const { data, error } = await resend.emails.send({
      from: 'Moneyly <notifications@moneyly.app>', // Change to your verified domain
      to: email,
      subject: `Spending Plan Saved: ${reference}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0f172a;">Spending Plan Saved</h2>
          <p>Dear ${customerName},</p>
          <p>Your Moneyly spending plan (Ref: <strong>${reference}</strong>) has been saved successfully.</p>
          <p>Please find the summary of your plan attached as a PDF.</p>
          <br/>
          <p>Best regards,<br/>Moneyly Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Moneyly-Plan-${reference}.pdf`,
          content: base64Data,
        },
      ],
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

  return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown API error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
