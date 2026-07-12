import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions governing use of Engineer Your Future.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms &amp; Conditions" updated="12 July 2026">
      <p>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of
        the Engineer Your Future platform, operated by{" "}
        <strong>Engineer Your Future Private Limited</strong> (&ldquo;Engineer Your
        Future&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using
        the platform, you agree to these Terms. If you do not agree, do not use the platform.
      </p>

      <h2>1. Eligibility &amp; Accounts</h2>
      <p>
        You are responsible for the activity under your account and for keeping your
        credentials secure. You agree to provide accurate information and to use the
        platform only for lawful, personal, non-commercial purposes.
      </p>

      <h2>2. Payments, Subscriptions &amp; Refunds</h2>
      <p>
        Paid plans are billed in advance via our payment partner (Razorpay). All payments
        are final and non-refundable, and subscriptions cannot be cancelled once activated.
        Full details are set out in our{" "}
        <a href="/refund">Cancellation &amp; Refund Policy</a>, which forms part of these Terms.
      </p>

      <h2>3. Limitation of Liability</h2>
      <p>
        Engineer Your Future shall not be liable for any direct, indirect, incidental,
        consequential, or punitive damages arising from:
      </p>
      <ul>
        <li>Use or inability to use the platform</li>
        <li>Service interruptions</li>
        <li>Suspension or discontinuation of services</li>
      </ul>
      <p>This limitation applies to all users, including those with active paid subscriptions.</p>

      <h2>4. Account Misuse &amp; Multiple Access</h2>
      <p>
        Accounts showing suspicious activity — including access from multiple IP addresses,
        simultaneous logins, account sharing, or abnormal usage patterns — may be flagged,
        restricted, or suspended without refund.
      </p>
      <p>
        These measures are implemented to prevent misuse, unauthorized account sharing,
        piracy, and to protect the integrity, security, and fairness of the platform.
      </p>

      <h2>5. Blacklisted Accounts</h2>
      <p>
        Users found violating these Terms may be permanently blacklisted. This may result in:
      </p>
      <ul>
        <li>Permanent suspension of the account</li>
        <li>Loss of access to all purchased and subscribed services</li>
        <li>Restriction from creating new accounts or using the platform in the future</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        All content, problems, courses, and materials on the platform are the property of
        Engineer Your Future or its licensors. Unauthorized sharing, resale, recording, or
        redistribution of platform content is strictly prohibited.
      </p>

      <h2>7. Legal Action</h2>
      <p>
        Engineer Your Future reserves the right to take legal action against users involved in:
      </p>
      <ul>
        <li>Fraudulent activities</li>
        <li>Abuse or misuse of the platform</li>
        <li>Unauthorized sharing, resale, recording, or redistribution of platform content</li>
        <li>Account sharing or attempts to bypass subscription restrictions</li>
        <li>Any actions causing harm to the platform, its users, partners, or intellectual property</li>
      </ul>
      <p>
        Such actions may include reporting violations to relevant authorities and pursuing
        remedies available under applicable laws.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes are subject to the
        exclusive jurisdiction of the courts of{" "}
        <strong>[CITY, STATE — e.g. Bengaluru, Karnataka]</strong>.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a> or see our{" "}
        <a href="/contact">Contact</a> page.
      </p>
    </LegalLayout>
  );
}
