import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "About",
  description: "About Engineer Your Future — India's end-to-end placement operating system.",
};

export default function AboutPage() {
  return (
    <LegalLayout title="About Engineer Your Future">
      <p>
        <strong>Engineer Your Future</strong> is India&rsquo;s end-to-end placement operating
        system — one platform that takes an engineering student from the first day of college
        to their first offer letter. Instead of stitching together scattered resources, we
        bring DSA practice, core CS, aptitude, mock interviews, resume tooling, projects, and
        jobs into a single, personalised path.
      </p>

      <h2>What we do</h2>
      <p>
        We measure your placement readiness across every dimension that matters, calibrate a
        roadmap to your exact gaps, and give you the practice, feedback, and mentorship to
        close them — at a fraction of the cost of offline coaching.
      </p>

      <h2>Who we are</h2>
      <p>
        Engineer Your Future is operated by <strong>Engineer Your Future Private Limited</strong>,
        a company registered in India. Our mission is to make world-class placement preparation
        accessible to every engineering student in the country.
      </p>

      <h2>Get in touch</h2>
      <p>
        Questions, partnerships, or feedback? Email{" "}
        <a href="mailto:eyf.support@gmail.com">eyf.support@gmail.com</a> or visit our{" "}
        <Link href="/contact">Contact</Link> page.
      </p>
    </LegalLayout>
  );
}
