import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation and refund policy for Engineer Your Future Private Limited.",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Cancellation & Refund Policy" updated="12 July 2026">
      <p>
        This policy applies to all users of Engineer Your Future and governs payments,
        subscriptions, and cancellations for services offered by{" "}
        <strong>Engineer Your Future Private Limited</strong>.
      </p>

      <h2>1. Refund &amp; Cancellation Policy</h2>

      <h3>1.1 No Refunds</h3>
      <p>
        All payments made towards premium subscriptions, courses, LMS services, Talent
        Development programs, Placement Services, or any other paid services offered by
        Engineer Your Future are final and non-refundable. Once a subscription or service
        has been purchased and activated, no refunds will be issued under any circumstances.
      </p>

      <h3>1.2 No Cancellation</h3>
      <p>
        Subscriptions and paid services cannot be cancelled once activated. This policy
        ensures fairness and consistency for all users.
      </p>

      <h3>1.3 Service Shutdown</h3>
      <p>
        In the event of an abrupt shutdown, Engineer Your Future will not be obligated to
        provide refunds for any fees, subscriptions, or payments made by users. This
        includes, but is not limited to, payments for premium subscriptions, course fees,
        LMS subscriptions, Talent Development programs, Placement Services, and any other
        paid offerings.
      </p>

      <h2>2. Subscription Responsibility</h2>
      <p>
        If a user voluntarily stops using the service after purchase, no refund will be
        issued for the remaining subscription period. Users are solely responsible for
        managing their subscriptions and making full use of the services during the
        subscription period.
      </p>

      <h2>3. Questions</h2>
      <p>
        For any questions about this policy, contact us at{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a>. See also our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </LegalLayout>
  );
}
