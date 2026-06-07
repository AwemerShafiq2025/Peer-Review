import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "PeerReviewer <onboarding@resend.dev>",
    to: email,
    subject: "Verify your PeerReviewer account",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
            <h1 style="color: #0a0a0f; font-size: 24px; margin-bottom: 8px;">
              Welcome to PeerReviewer
            </h1>
            <p style="color: #6b6b7a; margin-bottom: 24px;">
              Hi ${name}, please verify your email to activate your account.
            </p>
            <a
              href="${verifyUrl}"
              style="display: inline-block; background: #4D9BFF; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;"
            >
              Verify Email
            </a>
            <p style="color: #6b6b7a; font-size: 13px; margin-top: 24px;">
              This link expires in 24 hours. If you did not create an account, ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #b4b4be; font-size: 12px;">
              PeerReviewer — AI-powered peer review · Albatross Technologies
            </p>
          </div>
        </body>
      </html>
    `,
  });
}