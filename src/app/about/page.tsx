import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import CareerTimeline from "@/components/about/CareerTimeline";
import SkillsGrid from "@/components/about/SkillsGrid";
import StatsBar from "@/components/about/StatsBar";

const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME ?? "The Puffer Labs";
const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "";
const ownerPhone = process.env.NEXT_PUBLIC_OWNER_PHONE ?? "";
const ownerLinkedIn = process.env.NEXT_PUBLIC_OWNER_LINKEDIN ?? "";
const ownerGitHub = `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? ""}`;

export const metadata: Metadata = {
  title: `About — ${ownerName}`,
  description: "11+ years building scalable systems. Technical Lead, full-stack engineer, and the mind behind The Puffer Labs.",
};

export default function AboutPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <div className="min-h-screen bg-navy relative overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(34,197,94,0.1)_0%,transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(134,239,172,0.08)_0%,transparent_48%)]" />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-12 pb-12">
        <div className="grid lg:grid-cols-[1fr_auto] gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              <span className="text-xs font-medium text-teal tracking-wide">Available for consulting &amp; collaboration</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
              <span className="bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent">{ownerName}</span>
            </h1>

            <p className="text-lg text-text-muted leading-relaxed max-w-xl mb-6">
              Associate Staff Engineer &amp; Architect at BD, building MedTech products at scale. 11+ years designing distributed systems, platform architectures, and engineering culture. Based in
              Bengaluru, India.
            </p>

            <p className="text-sm text-text-muted leading-relaxed max-w-xl mb-8">
              Expert in distributed system design, .NET, React, Kubernetes, KEDA, Cypress, TypeScript, and C#. From micro frontends to event-driven backends — I think in systems, not just syntax.
              Passionate about mentoring teams and building software that lasts.
            </p>

            {/* Contact & Social */}
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${ownerEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-teal/30 text-teal hover:bg-teal/10 hover:border-teal/50 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {ownerEmail}
              </a>
              <a
                href={`tel:${ownerPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[var(--theme-white-alpha-10)] text-text-muted hover:text-text-primary hover:border-[var(--theme-white-alpha-10)] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {ownerPhone}
              </a>
              <a
                href={ownerLinkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[var(--theme-white-alpha-10)] text-text-muted hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href={ownerGitHub}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[var(--theme-white-alpha-10)] text-text-muted hover:text-text-primary hover:border-[var(--theme-white-alpha-10)] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          {/* Founder avatar */}
          <div className="hidden lg:flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-teal/10 to-lime/5 rounded-full blur-3xl" />
              <Image
                src={`${basePath}/logos/founder.png`}
                alt={ownerName}
                width={200}
                height={200}
                className="relative rounded-2xl object-cover drop-shadow-[0_0_56px_rgba(34,197,94,0.18)]"
                loading="eager"
                priority
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-mono text-teal/60">Founder</p>
              <p className="text-sm font-semibold text-text-primary">The Puffer Labs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Career Timeline */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-dim font-mono mb-2 text-center">Career Journey</h2>
        <p className="text-2xl font-bold text-text-primary text-center mb-12">
          From Developer to <span className="bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent">Architect</span>
        </p>

        <CareerTimeline />
      </section>

      {/* Skills */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pb-20">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-dim font-mono mb-2 text-center">Tech Stack</h2>
        <p className="text-2xl font-bold text-text-primary text-center mb-12">Tools &amp; Technologies</p>

        <SkillsGrid />
      </section>

      {/* Education */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pb-20">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-dim font-mono mb-8 text-center">Education</h2>
        <div className="max-w-lg mx-auto rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-teal/5 text-teal shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 6 8-4 8 4" />
                <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
                <path d="M14 22v-4a2 2 0 0 0-4 0v4" />
                <path d="M18 5v17" />
                <path d="M6 5v17" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Biju Patnaik University of Technology</h3>
              <p className="text-sm text-text-muted">Odisha, India</p>
              <p className="text-xs text-text-dim font-mono mt-1">2010 — 2014</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-teal/20 bg-gradient-to-r from-teal/[0.05] to-lime/[0.03] p-10 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">Let&apos;s Build Something Together</h2>
          <p className="text-sm text-text-muted mb-6 max-w-lg mx-auto">
            Whether you need architecture guidance, a consulting partner, or want to collaborate on open source — I&apos;d love to connect.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${ownerEmail}`}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-2xl bg-teal text-btn-text hover:bg-teal-dark shadow-[0_18px_36px_rgba(34,197,94,0.22)] hover:shadow-[0_22px_44px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98]"
            >
              Say Hello
            </a>
            <a
              href={ownerLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-teal/30 text-teal hover:bg-teal/10 hover:border-teal/50 transition-all"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[var(--theme-border)] py-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href={`${basePath}/`} className="text-sm text-text-dim hover:text-teal transition-colors">
              &larr; Back to The Puffer Labs
            </Link>
            <div className="text-center sm:text-right">
              <p className="text-xs text-text-dim font-mono">&copy; {new Date().getFullYear()} The Puffer Labs</p>
              <p className="text-[10px] text-text-dim/40 font-mono mt-1">
                GSTIN: <span className="text-text-dim/60">Pending Registration</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
