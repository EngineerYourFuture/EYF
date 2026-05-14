import { Resend } from "resend";

const FROM = "EYF <noreply@eyf.dev>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verify your EYF account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#e82127">Engineer Your Future</h2>
        <p>Thanks for signing up. Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;background:#e82127;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">Verify Email</a>
        <p style="color:#888;font-size:13px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Reset your EYF password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#e82127">Engineer Your Future</h2>
        <p>We received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;background:#e82127;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">Reset Password</a>
        <p style="color:#888;font-size:13px">Link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
