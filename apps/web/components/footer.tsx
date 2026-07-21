import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="relative z-10 border-t border-black/10"
      // Solid ground so the landing's particle ring can't bleed through behind
      // the links; falls back to paper grey off the landing where --lp-paper is unset.
      style={{ background: "rgb(var(--lp-paper, 241 242 245))" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <div className="font-display text-xl font-bold text-neutral-900">EYF</div>
          <p className="mt-3 text-neutral-600 max-w-xs">
            Engineer Your Future. India&apos;s placement OS.
          </p>
        </div>
        <FooterCol title="Product" links={[
          ["Tracks", "/tracks"], ["Problems", "/problems"],
          ["Mentors", "/mentors"], ["Pricing", "/pricing"],
        ]} />
        <FooterCol title="Company" links={[
          ["About", "/about"], ["Contact", "/contact"],
        ]} />
        <FooterCol title="Legal" links={[
          ["Terms", "/terms"], ["Privacy", "/privacy"],
          ["Refund policy", "/refund"], ["Security", "/security"],
        ]} />
      </div>
      <div className="border-t border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-neutral-500 flex justify-between">
          <span>© {new Date().getFullYear()} Engineer Your Future Private Limited</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: Readonly<{ title: string; links: [string, string][] }>) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wider text-neutral-500">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="text-neutral-600 hover:text-neutral-900 transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
