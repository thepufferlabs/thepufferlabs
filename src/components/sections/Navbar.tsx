"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import PufferLogo from "@/components/ui/PufferLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthModal from "@/components/ui/AuthModal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Separator from "@/components/ui/Separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { NAV_LINKS, SITE } from "@/lib/constants";

function UserAvatar({ user, size = "md" }: { user: { email?: string; user_metadata?: { avatar_url?: string; picture?: string; full_name?: string; name?: string } }; size?: "md" | "lg" }) {
  const meta = user.user_metadata ?? {};
  const avatarUrl = meta.avatar_url || meta.picture;
  const name = meta.full_name || meta.name || user.email || "";
  const initials = name
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(size === "lg" ? "h-11 w-11" : "h-9 w-9", "bg-[var(--theme-secondary)]")}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback>{initials || "U"}</AvatarFallback>
    </Avatar>
  );
}

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { user, loading, signOut, hasPurchases } = useAuth();
  const { itemCount } = useCart();

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
        className="fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-2xl transition-colors duration-300"
        style={{
          borderColor: "var(--theme-border)",
          background: "color-mix(in srgb, var(--theme-card-elevated) 76%, transparent)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href={`${basePath}/`} className="group flex items-center gap-2">
            <div className="surface-panel-subtle flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-[1.03]">
              <PufferLogo size={44} variant="navy" />
            </div>
            <div className="hidden min-[430px]:block">
              <p className="font-display text-lg font-semibold tracking-[-0.08em] text-text-primary">{SITE.name}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-dim">{SITE.tagline}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              const isCourses = link.href === "/courses";
              const commonClass = active ? "text-teal" : "";

              if (isCourses && !loading && !user) {
                return (
                  <Button key={link.label} variant={active ? "secondary" : "ghost"} size="sm" className={commonClass} onClick={() => setAuthOpen(true)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {link.label}
                  </Button>
                );
              }

              return (
                <Button key={link.label} asChild variant={active ? "secondary" : "ghost"} size="sm" className={commonClass}>
                  <Link href={resolveHref(link.href)}>
                    {isCourses ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ) : null}
                    {link.label}
                  </Link>
                </Button>
              );
            })}

            <ThemeToggle className="ml-1" />

            <Button asChild variant="ghost" size="sm" className="relative px-3" aria-label="Cart">
              <Link href={`${basePath}/cart/`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme-primary)] px-1 text-[10px] font-bold text-[var(--theme-primary-foreground)]">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            {!loading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "relative ml-1 rounded-full outline-none transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-navy)]",
                      hasPurchases && "p-[3px]"
                    )}
                    aria-label="Account menu"
                  >
                    {hasPurchases ? (
                      <>
                        <span className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444, #f59e0b)", padding: "2px" }}>
                          <span className="block h-full w-full rounded-full bg-[var(--theme-popover)]" />
                        </span>
                        <span className="absolute -inset-[4px] rounded-full border-2 border-dashed border-amber-400/60 animate-[spin_8s_linear_infinite]" />
                      </>
                    ) : null}
                    <span className="relative block">
                      <UserAvatar user={user} />
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel className="px-3 py-3 normal-case tracking-normal">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
                        <p className="truncate text-xs text-text-muted">{user.email}</p>
                        <Badge variant="outline" className="mt-2 px-2.5 py-0.5 text-[10px] tracking-[0.16em]">
                          {provider}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => (window.location.href = `${basePath}/account/`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Account Info
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300" onSelect={() => signOut()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 text-text-muted shadow-[var(--theme-soft-shadow)] transition-colors hover:text-text-primary md:hidden"
                aria-label="Toggle navigation menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            </SheetTrigger>
            <SheetContent className="md:hidden">
              <SheetHeader>
                <SheetTitle>{SITE.name}</SheetTitle>
                <SheetDescription>{SITE.description}</SheetDescription>
              </SheetHeader>

              <div className="mt-8 flex flex-col gap-2">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  const isCourses = link.href === "/courses";

                  if (isCourses && !loading && !user) {
                    return (
                      <Button
                        key={link.label}
                        variant={active ? "secondary" : "ghost"}
                        className={cn("h-12 justify-start", active && "text-teal")}
                        onClick={() => {
                          setMobileOpen(false);
                          setAuthOpen(true);
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {link.label}
                      </Button>
                    );
                  }

                  return (
                    <Button key={link.label} asChild variant={active ? "secondary" : "ghost"} className={cn("h-12 justify-start", active && "text-teal")}>
                      <Link href={resolveHref(link.href)} onClick={() => setMobileOpen(false)}>
                        {isCourses ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ) : null}
                        {link.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <ThemeToggle showLabel className="w-full justify-between" />
                <Button asChild variant="secondary" className="w-full justify-between">
                  <Link href={`${basePath}/cart/`} onClick={() => setMobileOpen(false)}>
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                      </svg>
                      Cart
                    </span>
                    {itemCount > 0 ? (
                      <Badge variant="default" className="px-2 py-0.5 text-[10px] tracking-[0.16em]">
                        {itemCount}
                      </Badge>
                    ) : null}
                  </Link>
                </Button>
              </div>

              {!loading && user ? (
                <Card hover={false} className="mt-6">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{displayName}</CardTitle>
                        <CardDescription className="truncate">{user.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => {
                        setMobileOpen(false);
                        window.location.href = `${basePath}/account/`;
                      }}
                    >
                      Account Info
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => {
                        setMobileOpen(false);
                        signOut();
                      }}
                    >
                      Log Out
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
