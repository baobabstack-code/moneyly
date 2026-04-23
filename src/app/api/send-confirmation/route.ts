import { Resend } from 'resend';
import { NextResponse } from 'next/server';

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
      from: 'HTB Global <notifications@htbglobal.app>', // Change to your verified domain
      to: email,
      subject: `Loan Application Submitted: ${reference}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0f172a;">Application Submitted Successfully</h2>
          <p>Dear ${customerName},</p>
          <p>Your loan application (Ref: <strong>${reference}</strong>) has been successfully submitted for processing.</p>
          <p>Please find the summary of your application attached as a PDF.</p>
          <br/>
          <p>Best regards,<br/>HTB Global Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Application-${reference}.pdf`,
          content: base64Data,
        },
      ],
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

  return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
