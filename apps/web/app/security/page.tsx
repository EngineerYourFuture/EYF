import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Security",
  description: "How Engineer Your Future protects your account and data.",
};

export default function SecurityPage() {
  return (
    <LegalLayout title="Security">
      <p>
        Security is built into Engineer Your Future from the ground up. Here&rsquo;s how we
        protect your account, your data, and your payments.
      </p>

      <h2>Data protection</h2>
      <ul>
        <li>All traffic is encrypted in transit over TLS/HTTPS.</li>
        <li>Credentials are managed by our authentication provider (Clerk); we never store raw passwords.</li>
        <li>Access to production data is restricted and logged.</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Payments are processed by <strong>Razorpay</strong>, a PCI-DSS compliant payment
        gateway. We do not store your full card, UPI, or bank details on our servers.
      </p>

      <h2>Account safety</h2>
      <ul>
        <li>Sessions are monitored for suspicious activity and account sharing.</li>
        <li>Sensitive staff areas are protected by an additional access gate.</li>
        <li>Rate limiting and abuse protections guard against automated attacks.</li>
      </ul>

      <h2>Reporting a vulnerability</h2>
      <p>
        If you believe you&rsquo;ve found a security issue, please report it responsibly to{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a>. We appreciate
        disclosures that give us reasonable time to investigate and fix.
      </p>
    </LegalLayout>
  );
}
