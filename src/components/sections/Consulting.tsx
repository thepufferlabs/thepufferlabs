import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "";

const plans = [
  {
    tier: "Open Source",
    price: "$0",
    period: "forever",
    description: "Collaborate on open-source projects together. Knowledge sharing, code reviews, and community-driven engineering.",
    features: ["Open-source collaboration", "Code reviews & feedback", "Community contributions", "Shared learning", "GitHub-first workflow"],
    cta: "Let\u2019s Collaborate",
    ctaHref: `mailto:${ownerEmail}?subject=Open%20Source%20Collaboration`,
    variant: "secondary" as const,
    highlight: false,
    badge: null,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    tier: "Part-Time Consulting",
    price: "$50",
    period: "/hour",
    description: "Focused consulting sessions for architecture reviews, system design, and engineering strategy on your schedule.",
    features: ["Architecture reviews", "System design guidance", "Code & infra audits", "1-on-1 strategy sessions", "Async support via Slack/Email", "Flexible scheduling"],
    cta: "Book a Session",
    ctaHref: `mailto:${ownerEmail}?subject=Part-Time%20Consulting%20Inquiry`,
    variant: "primary" as const,
    highlight: true,
    badge: "Most Popular",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    tier: "Full-Time",
    price: "Let\u2019s Talk",
    period: "",
    description: "Dedicated full-time engineering partnership. Embedded in your team, driving architecture and building systems that scale.",
    features: ["Embedded in your team", "Full architecture ownership", "Backend & frontend systems", "Platform engineering", "Team mentoring & growth", "Long-term partnership"],
    cta: "Start a Conversation",
    ctaHref: `mailto:${ownerEmail}?subject=Full-Time%20Partnership%20Inquiry`,
    variant: "secondary" as const,
    highlight: false,
    badge: "Enterprise",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9" />
        <path d="M14 17H5" />
        <circle cx="17" cy="17" r="3" />
        <circle cx="7" cy="7" r="3" />
      </svg>
    ),
  },
];

export default function Consulting() {
  return (
    <SectionWrapper id="consulting" className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(163,230,53,0.04)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(45,212,191,0.04)_0%,transparent_50%)]" />

      <div className="relative">
        <SectionHeading
          label="Hire Me"
          title="Work With Me"
          description="Whether it's open-source collaboration, focused consulting, or a full-time partnership — let's build something meaningful together."
        />

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl transition-all duration-300 ${
                plan.highlight
                  ? "border-2 border-teal/40 bg-gradient-to-b from-teal/[0.06] to-transparent shadow-[0_0_60px_rgba(45,212,191,0.08)] lg:-mt-4 lg:mb-[-16px]"
                  : "border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] hover:border-[var(--theme-white-alpha-10)] hover:bg-[var(--theme-white-alpha-5)]"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                      plan.highlight ? "bg-teal text-navy" : "bg-[var(--theme-white-alpha-10)] text-text-muted border border-[var(--theme-white-alpha-10)]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Icon + Tier */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2.5 rounded-xl ${plan.highlight ? "bg-teal/10 text-teal" : "bg-[var(--theme-white-alpha-5)] text-text-muted"}`}>{plan.icon}</div>
                  <h3 className="text-lg font-semibold text-text-primary">{plan.tier}</h3>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className={`text-4xl font-bold tracking-tight ${plan.highlight ? "bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent" : "text-text-primary"}`}>{plan.price}</span>
                  {plan.period && <span className="text-sm text-text-dim ml-1">{plan.period}</span>}
                </div>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed mb-6">{plan.description}</p>

                {/* Divider */}
                <div className={`h-px mb-6 ${plan.highlight ? "bg-teal/20" : "bg-[var(--theme-white-alpha-5)]"}`} />

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-text-muted">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 mt-0.5 ${plan.highlight ? "text-teal" : "text-text-dim"}`}>
                        <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button variant={plan.variant} size="lg" href={plan.ctaHref} className="w-full">
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
