import { Bricolage_Grotesque } from "next/font/google";

/**
 * Marketing display face — Bricolage Grotesque. A variable grotesque with an
 * editorial, humanist-industrial character (deliberately not Inter / Space
 * Grotesk / the trending serif). Self-hosted at build via next/font, exposed as
 * --font-display and scoped to the marketing surface (applied on the landing
 * root, not globally) so it never ships to the authenticated app.
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
