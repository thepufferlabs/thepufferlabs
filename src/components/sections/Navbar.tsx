"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PufferLogo from "@/components/ui/PufferLogo";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthModal from "@/components/ui/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { SITE, NAV_LINKS } from "@/lib/constants";

function UserAvatar({ user, size = 32 }: { user: { email?: string; user_metadata?: { avatar_url?: string; picture?: string; full_name?: string; name?: string } }; size?: number }) {
  const meta = user.user_metadata ?? {};
  const avatarUrl = meta.avatar_url || meta.picture;
  const name = meta.full_name || meta.name || user.email || "";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} width={size} height={size} className="rounded-full object-cover" referrerPolicy="no-referrer" />;
  }

  return (
    <div className="flex items-center justify-center rounded-full bg-teal/20 text-teal font-semibold text-xs" style={{ width: size, height: size }}>
      {initials || "U"}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { user, loading, signOut } = useAuth();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  function resolveHref(href: string) {
    return href.startsWith("#") ? href : `${basePath}${href}`;
  }

  function isActive(href: string): boolean {
    if (href.startsWith("#")) {
      return pathname === "/" || pathname === `${basePath}/`;
    }
    const resolved = `${basePath}${href}`;
    if (href === "/") {
      return pathname === "/" || pathname === `${basePath}/` || pathname === basePath;
    }
    return pathname === resolved || pathname.startsWith(`${resolved}/`);
  }

  const userMeta = user?.user_metadata ?? {};
  const displayName = userMeta.full_name || userMeta.name || user?.email || "";
  const provider = user?.app_metadata?.provider ?? "email";

  return (
    <>
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
              const isCourses = link.href === "/courses";

              // Courses link: if not logged in, open auth modal instead of navigating
              if (isCourses && !loading && !user) {
                return (
                  <button
                    key={link.label}
                    onClick={() => setAuthOpen(true)}
                    className={`px-4 py-2 text-sm transition-colors rounded-lg flex items-center gap-1.5 cursor-pointer ${
                      active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {link.label}
                  </button>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={resolveHref(link.href)}
                  className={`px-4 py-2 text-sm transition-colors rounded-lg flex items-center gap-1.5 ${
                    active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                  }`}
                >
                  {isCourses && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  {link.label}
                </Link>
              );
            })}
            <ThemeToggle className="ml-2" />

            {/* User avatar (only when logged in) */}
            {!loading && user && (
              <div className="ml-2">
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center rounded-full transition-all hover:ring-2 hover:ring-teal/30 cursor-pointer"
                    aria-label="Account menu"
                    aria-expanded={profileOpen}
                  >
                    <UserAvatar user={user} size={34} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 rounded-xl border p-1 shadow-xl"
                      style={{
                        background: "var(--color-navy)",
                        borderColor: "var(--theme-border)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Account info */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--theme-border)" }}>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                            <p className="text-xs text-text-muted truncate">{user.email}</p>
                            <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-text-dim bg-[var(--theme-white-alpha-5)] rounded px-1.5 py-0.5">{provider}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            window.location.href = `${basePath}/account/`;
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)] rounded-lg transition-colors cursor-pointer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          Account Info
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            signOut();
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                const isCourses = link.href === "/courses";

                // Courses link: if not logged in, open auth modal
                if (isCourses && !loading && !user) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        setOpen(false);
                        setAuthOpen(true);
                      }}
                      className={`px-4 py-3 text-sm transition-colors rounded-lg flex items-center gap-1.5 cursor-pointer ${
                        active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {link.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={resolveHref(link.href)}
                    className={`px-4 py-3 text-sm transition-colors rounded-lg flex items-center gap-1.5 ${
                      active ? "text-teal font-medium bg-teal/10" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {isCourses && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                    {link.label}
                  </Link>
                );
              })}
              <ThemeToggle showLabel />

              {/* Mobile user menu (only when logged in) */}
              {!loading && user && (
                <div className="mt-2">
                  <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <UserAvatar user={user} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        window.location.href = `${basePath}/account/`;
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)] rounded-lg transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Account Info
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
