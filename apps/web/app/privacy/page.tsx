import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Engineer Your Future collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="12 July 2026">
      <p>
        <strong>Engineer Your Future Private Limited</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) respects your privacy. This policy explains what personal data we
        collect, how we use it, and the rights you have under India&rsquo;s Digital Personal
        Data Protection Act, 2023 (DPDP) and other applicable laws.
      </p>

      <h2>1. Data We Collect</h2>
      <ul>
        <li><strong>Account data</strong> — name, email, and phone, collected when you sign up (via our authentication provider, Clerk).</li>
        <li><strong>Profile &amp; usage data</strong> — college, graduation year, target role, practice history, scores, and progress you generate on the platform.</li>
        <li><strong>Payment data</strong> — processed by our payment partner, Razorpay. We do <strong>not</strong> store your full card, UPI, or bank details; we retain only a transaction reference and subscription status.</li>
        <li><strong>Technical data</strong> — IP address, device/browser information, and log data, used for security and to operate the service.</li>
        <li><strong>Analytics</strong> — product usage events (only if you consent to optional analytics cookies).</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To provide, personalise, and improve the platform and your placement-prep experience.</li>
        <li>To process payments and manage your subscription.</li>
        <li>To communicate with you (transactional emails, reminders, and support).</li>
        <li>To secure accounts and detect misuse (e.g. account sharing).</li>
      </ul>

      <h2>3. Service Providers</h2>
      <p>We share data only with processors who help us run the service, under appropriate safeguards:</p>
      <ul>
        <li><strong>Clerk</strong> — authentication and account management</li>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>PostHog</strong> — product analytics (consent-based)</li>
        <li><strong>Resend</strong> — transactional email</li>
        <li>Cloud hosting, storage, and CDN providers</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active and as required to comply
        with legal, tax, and accounting obligations. You can request deletion at any time.
      </p>

      <h2>5. Your Rights</h2>
      <p>Subject to applicable law, you can:</p>
      <ul>
        <li><strong>Access &amp; export</strong> your data — available in-app under Settings, or on request.</li>
        <li><strong>Correct</strong> inaccurate information.</li>
        <li><strong>Delete</strong> your account and associated personal data — available in-app or by contacting us.</li>
        <li>Withdraw consent for optional analytics at any time.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use essential cookies to operate the platform and, only with your consent,
        optional analytics cookies. You choose your preference via the consent banner shown
        on your first visit.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit, hashed
        credentials, access controls, and account-sharing protections. No method of
        transmission or storage is completely secure, but we work to protect your data.
      </p>

      <h2>8. Children</h2>
      <p>
        The platform is intended for users pursuing higher education and is not directed at
        children under 18. If you are a minor, please use the platform with the consent and
        supervision of a parent or guardian.
      </p>

      <h2>9. Grievance Officer</h2>
      <p>
        In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, the
        contact details of our Grievance Officer are:
      </p>
      <ul>
        <li><strong>Name:</strong> [GRIEVANCE OFFICER NAME]</li>
        <li><strong>Email:</strong> <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a></li>
        <li><strong>Address:</strong> [REGISTERED BUSINESS ADDRESS]</li>
      </ul>

      <h2>10. Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be notified via
        the platform or email. Continued use after an update constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about your privacy? Email{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
