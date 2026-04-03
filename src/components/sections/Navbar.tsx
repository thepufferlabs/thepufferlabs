"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PufferLogo from "@/components/ui/PufferLogo";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE, NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  function resolveHref(href: string) {
    return href.startsWith("#") ? href : `${basePath}${href}`;
  }

  function isActive(href: string): boolean {
    if (href.startsWith("#")) {
      return pathname === "/" || pathname === `${basePath}/`;
    }
    const resolved = `${basePath}${href}`;
    // Exact match for home page to avoid highlighting on all pages
    if (href === "/") {
      return pathname === "/" || pathname === `${basePath}/` || pathname === basePath;
    }
    return pathname === resolved || pathname.startsWith(`${resolved}/`);
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b bg-navy/80 backdrop-blur-xl transition-colors duration-300"
      style={{ borderColor: "var(--theme-border)" }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href={`${basePath}/`} className="flex items-center gap-0 group">
          <PufferLogo size={72} variant="navy" className="transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight text-text-primary">{SITE.name}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={resolveHref(link.href)}
                className={`px-4 py-2 text-sm transition-colors rounded-lg ${
                  active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle className="ml-2" />
          <div className="ml-2">
            <Button variant="primary" size="sm" href={`${basePath}/#cta`}>
              Start Learning
            </Button>
          </div>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-text-muted hover:text-text-primary" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-navy/95 backdrop-blur-xl" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={resolveHref(link.href)}
                  className={`px-4 py-3 text-sm transition-colors rounded-lg ${
                    active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <ThemeToggle showLabel />
            <div className="mt-2">
              <Button variant="primary" size="sm" href={`${basePath}/#cta`} className="w-full">
                Start Learning
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
