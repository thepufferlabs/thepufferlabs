import PufferLogo from "@/components/ui/PufferLogo";
import { SITE, NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t bg-navy transition-colors duration-300" style={{ borderColor: "var(--theme-border)" }} role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <PufferLogo size={32} variant="navy" />
              <span className="text-base font-bold tracking-tight text-text-primary">{SITE.name}</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm">{SITE.description}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim mb-4">Navigate</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim mb-4">Connect</h4>
            <ul className="space-y-2.5">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--theme-border)" }}>
          <div>
            <p className="text-xs text-text-dim">
              &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <p className="text-[10px] text-text-dim/40 font-mono mt-1">
              GSTIN: <span className="text-text-dim/60">Pending Registration</span>
            </p>
          </div>
          <p className="text-xs text-text-dim font-mono">Built with depth. Shipped with care.</p>
        </div>
      </div>
    </footer>
  );
}
