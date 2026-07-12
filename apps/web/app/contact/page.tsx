import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Engineer Your Future Private Limited.",
};

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us" updated="12 July 2026">
      <p>
        We&rsquo;d love to hear from you. For support, billing, or any questions, reach{" "}
        <strong>Engineer Your Future Private Limited</strong> through any of the channels below.
      </p>

      <h2>Support</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a></li>
        <li><strong>Phone:</strong> [SUPPORT PHONE — e.g. +91 XXXXX XXXXX]</li>
        <li><strong>Hours:</strong> Monday–Saturday, 10:00–18:00 IST</li>
      </ul>

      <h2>Registered Office</h2>
      <p>
        Engineer Your Future Private Limited
        <br />
        [REGISTERED BUSINESS ADDRESS — street, city, state, PIN]
        <br />
        India
      </p>

      <h2>Billing &amp; Refunds</h2>
      <p>
        For payment or subscription queries, email{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a> with your registered
        email and transaction reference. Please review our{" "}
        <a href="/refund">Cancellation &amp; Refund Policy</a> first.
      </p>
    </LegalLayout>
  );
}
