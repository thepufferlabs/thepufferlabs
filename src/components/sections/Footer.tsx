import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import PufferLogo from "@/components/ui/PufferLogo";
import Separator from "@/components/ui/Separator";
import { SITE, NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <footer className="bg-transparent transition-colors duration-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <Card hover={false}>
          <CardContent className="space-y-10">
            <div className="grid gap-12 md:grid-cols-4 md:gap-8">
              <div className="md:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <div className="surface-panel-subtle flex h-11 w-11 items-center justify-center rounded-2xl">
                    <PufferLogo size={44} variant="navy" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold tracking-[-0.08em] text-text-primary">{SITE.name}</p>
                    <Badge variant="outline" className="mt-2 px-2.5 py-0.5 text-[10px] tracking-[0.18em]">
                      Built for engineers
                    </Badge>
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-text-muted">{SITE.description}</p>
              </div>

              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-dim">Navigate</h4>
                <ul className="space-y-2.5">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link href={`${basePath}${link.href}`} className="text-sm text-text-muted transition-colors hover:text-text-primary">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-dim">Connect</h4>
                <ul className="space-y-2.5">
                  {SOCIAL_LINKS.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-text-muted transition-colors hover:text-text-primary">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-xs text-text-dim">
                  &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
                </p>
                <p className="mt-1 font-mono text-[10px] text-text-dim/60">
                  GSTIN: <span className="text-text-dim/80">Pending Registration</span>
                </p>
              </div>
              <p className="font-mono text-xs text-text-dim">Built with depth. Shipped with care.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </footer>
  );
}
