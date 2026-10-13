import type { Metadata } from "next";
import { PublicProof } from "./proof";
export const metadata: Metadata = { title: "Practice evidence", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <PublicProof />; }
