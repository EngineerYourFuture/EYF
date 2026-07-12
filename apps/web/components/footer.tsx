import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <div className="font-display text-xl font-bold">EYF</div>
          <p className="mt-3 text-text-3 max-w-xs">
            Engineer Your Future. India&apos;s placement OS.
          </p>
        </div>
        <FooterCol title="Product" links={[
          ["Tracks", "/tracks"], ["Problems", "/problems"],
          ["Mentors", "/mentors"], ["Pricing", "/pricing"],
        ]} />
        <FooterCol title="Company" links={[
          ["About", "/about"], ["Contact", "/contact"],
          ["Pricing", "/pricing"],
        ]} />
        <FooterCol title="Legal" links={[
          ["Terms", "/terms"], ["Privacy", "/privacy"],
          ["Refund policy", "/refund"], ["Security", "/security"],
        ]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-text-3 flex justify-between">
          <span>© {new Date().getFullYear()} Engineer Your Future Private Limited</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wider text-text-3">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="text-text-2 hover:text-text-1">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
