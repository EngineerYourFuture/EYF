/**
 * Resend transactional email. No-op when RESEND_API_KEY is unset (dev/CI).
 * Templates are inline-styled HTML — keep them simple, Gmail-friendly.
 */
import { Resend } from "resend";
import { env } from "../env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type EmailSend = { to: string; subject: string; html: string };

export async function sendEmail(msg: EmailSend): Promise<{ sent: boolean; id?: string; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not set" };
  try {
    const res = await resend.emails.send({
      from: env.RESEND_FROM,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
    });
    if (res.error) return { sent: false, reason: res.error.message };
    return { sent: true, id: res.data?.id };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}

// ─── Templates ────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eyf.in";

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0a0a;color:#fafaf9;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111111;border:1px solid #1c1c1c;border-radius:12px;padding:32px;">
      <tr><td>
        <div style="font-size:22px;font-weight:700;letter-spacing:1px;color:#e8ff47;">EYF</div>
        <h1 style="font-size:24px;line-height:1.3;margin:20px 0 16px;color:#fafaf9;">${title}</h1>
        ${body}
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #1c1c1c;font-size:12px;color:#8a8a87;">
          You're receiving this because you signed up for EYF · <a href="${APP_URL}/settings" style="color:#e8ff47;">Manage preferences</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

function ctaBtn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#e8ff47;color:#0a0a0a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px;">${label}</a>`;
}

export function welcomeEmail(name: string): EmailSend["html"] {
  return shell(`Welcome to EYF, ${name}.`, `
    <p style="color:#c9c9c7;line-height:1.6;">You've got the platform that 95% of engineering students don't. Here's where to start:</p>
    <ol style="color:#c9c9c7;line-height:1.8;padding-left:18px;">
      <li>Take the 20-question assessment — we'll calibrate your roadmap to your gap.</li>
      <li>Choose your career track from 12 roles with real Indian salary bands.</li>
      <li>Solve today's daily challenge. The streak starts with one problem.</li>
    </ol>
    ${ctaBtn("Take the assessment →", `${APP_URL}/assessment`)}
  `);
}

export function streakBreakEmail(name: string, streakDays: number): EmailSend["html"] {
  return shell(`Your streak is at risk, ${name}.`, `
    <p style="font-size:48px;font-weight:700;color:#e8ff47;margin:0;">${streakDays}<span style="font-size:24px;color:#8a8a87;"> days</span></p>
    <p style="color:#c9c9c7;line-height:1.6;margin-top:16px;">
      You haven't solved a problem today. One problem in the next few hours keeps the streak alive.
      Forty minutes of focus right now is cheaper than restarting from zero tomorrow.
    </p>
    ${ctaBtn("Open today's challenge", `${APP_URL}/dashboard`)}
  `);
}

export function dailyDigestEmail(name: string, opts: {
  challengeTitle: string; challengeSlug: string; difficulty: string;
  dueFlashcards: number; streakDays: number;
}): EmailSend["html"] {
  return shell(`Today's plan, ${name}`, `
    <p style="color:#c9c9c7;line-height:1.6;">Here's the most useful 30–60 minutes of your day.</p>

    <div style="background:#0a0a0a;border:1px solid #1c1c1c;border-radius:8px;padding:16px;margin-top:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#8a8a87;text-transform:uppercase;">Daily Challenge · ${opts.difficulty}</div>
      <div style="font-size:18px;color:#fafaf9;margin-top:6px;font-weight:600;">${opts.challengeTitle}</div>
      ${ctaBtn("Solve now", `${APP_URL}/problems/${opts.challengeSlug}`)}
    </div>

    <div style="background:#0a0a0a;border:1px solid #1c1c1c;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="font-size:11px;letter-spacing:2px;color:#8a8a87;text-transform:uppercase;">Due today</div>
      <div style="font-size:18px;color:#fafaf9;margin-top:6px;">${opts.dueFlashcards} flashcards · ${opts.streakDays}-day streak</div>
    </div>
  `);
}

export function weeklyLeaderboardEmail(name: string, top: string[]): EmailSend["html"] {
  return shell(`Top of the leaderboard this week`, `
    <p style="color:#c9c9c7;line-height:1.6;">${name}, here's who put in the work this week.</p>
    <ol style="color:#c9c9c7;line-height:1.8;font-family:JetBrains Mono,monospace;padding-left:24px;">
      ${top.map((row) => `<li>${row}</li>`).join("")}
    </ol>
    ${ctaBtn("See the full leaderboard", `${APP_URL}/dashboard`)}
  `);
}
