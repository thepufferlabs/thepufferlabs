"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";

const PREMIUM_CONTENT = [
  {
    title: "Advanced System Design Patterns",
    description: "Deep-dive into CQRS, Event Sourcing, and Saga patterns with real-world production examples.",
    tag: "Architecture",
  },
  {
    title: "Distributed Systems Masterclass",
    description: "Consensus algorithms, distributed transactions, and failure modes explained with hands-on exercises.",
    tag: "Systems",
  },
  {
    title: "Performance Engineering Guide",
    description: "Profiling, benchmarking, and optimization techniques for high-throughput backend systems.",
    tag: "Performance",
  },
  {
    title: "Production-Ready Microservices",
    description: "Service mesh, observability, circuit breakers, and deployment strategies that actually work.",
    tag: "DevOps",
  },
  {
    title: "Database Internals Deep Dive",
    description: "B-trees, LSM trees, WAL, MVCC — understand how your database really works under the hood.",
    tag: "Databases",
  },
  {
    title: "API Design & Evolution",
    description: "Versioning strategies, backward compatibility, and designing APIs that scale with your organization.",
    tag: "Backend",
  },
];

export default function PremiumPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${basePath}/`);
    }
  }, [user, loading, router, basePath]);

  if (loading) {
    return (
      <main className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="pt-24 pb-20 min-h-screen">
      <SectionWrapper>
        <SectionHeading label="Premium" title="Premium Content" description="Exclusive deep-dive content for registered members. More coming soon!" />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_CONTENT.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border p-6 transition-all duration-300 hover:border-teal/30 hover:shadow-[0_20px_50px_rgba(34,197,94,0.08)]"
              style={{
                background: "var(--color-navy-light)",
                borderColor: "var(--theme-border)",
              }}
            >
              <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal mb-3">{item.tag}</span>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--theme-border)" }}>
                <span className="text-xs text-text-dim">Coming soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-text-muted text-sm">
            Welcome, <span className="text-teal font-medium">{user.email}</span>. Premium content and Razorpay integration coming soon.
          </p>
        </div>
      </SectionWrapper>
    </main>
  );
}
