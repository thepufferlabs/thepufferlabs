"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Milestone {
  year: string;
  duration: string;
  role: string;
  company: string;
  companyShort: string;
  logo?: string;
  type: "current" | "past";
  highlights: string[];
  tech: string[];
}

const milestones: Milestone[] = [
  {
    year: "2025",
    duration: "Nov 2025 — Present",
    role: "Associate Staff Engineer",
    company: "BD (Becton Dickinson)",
    companyShort: "BD",
    logo: "/logos/companies/bd.png",
    type: "current",
    highlights: [
      "Architecting distributed MedTech products at enterprise scale",
      "Driving design system architecture across product lines",
      "Building with .NET, React, Kubernetes, KEDA, and Cypress",
    ],
    tech: [".NET", "React", "Kubernetes", "KEDA", "C#", "TypeScript", "Cypress"],
  },
  {
    year: "2025",
    duration: "Apr 2025 — Nov 2025",
    role: "Lead Software Engineer",
    company: "OpenText",
    companyShort: "OT",
    logo: "/logos/companies/opentext.jpg",
    type: "past",
    highlights: [
      "Conducted thorough code reviews and assessed architecture for seamless legacy transition",
      "Spearheaded modernization of Outlook add-in using React, enhancing UX and functionality",
      "Contributed to DevOps practices and Azure networking, improving deployment efficiency",
    ],
    tech: ["React", "Azure", "DevOps", "TypeScript"],
  },
  {
    year: "2024",
    duration: "Sep 2024 — Apr 2025",
    role: "Associate Technical Architect",
    company: "Euromonitor International",
    companyShort: "EMI",
    logo: "/logos/companies/euromonitor.png",
    type: "past",
    highlights: [
      "Designed scalable CosmosDB NoSQL models handling 500M+ records/month with medallion architecture",
      "Implemented Delta Lake CDC strategy with Databricks and Azure Data Factory",
      "Built real-time Grafana dashboards for Azure Kubernetes, reducing downtime by 25%",
      "Championed SOLID, TDD, and DRY — achieving 98% unit test coverage",
    ],
    tech: ["CosmosDB", "Databricks", "Azure", "Kubernetes", "Grafana", "Elasticsearch"],
  },
  {
    year: "2022",
    duration: "Jul 2022 — Aug 2024",
    role: "Technical Lead",
    company: "Euromonitor International",
    companyShort: "EMI",
    logo: "/logos/companies/euromonitor.png",
    type: "past",
    highlights: [
      "Modernized frontend applications using Angular, enhancing UX and performance",
      "Optimized data pipelines — extraction runtime from 15 hours to 3 hours for 60M+ rows",
      "Led team to 99% code quality standard with Azure CI/CD, cutting release cycles by 35%",
    ],
    tech: ["Angular", "Azure CI/CD", "Microservices", "Service Bus", ".NET"],
  },
  {
    year: "2021",
    duration: "Aug 2021 — Jun 2022",
    role: "Technical Lead",
    company: "Koch Business Solutions India",
    companyShort: "Koch",
    logo: "/logos/companies/koch.png",
    type: "past",
    highlights: [
      "Spearheaded modernization of legacy applications to Angular",
      "Led and mentored a team of 6 front-end developers",
      "Implemented CI/CD automation using GitLab",
      "Utilized Dynatrace and Datadog APM for performance monitoring",
    ],
    tech: ["Angular", "GitLab CI", "Dynatrace", "Datadog"],
  },
  {
    year: "2021",
    duration: "Jan 2021 — Aug 2021",
    role: "Senior Programmer Analyst",
    company: "Koch Business Solutions India",
    companyShort: "Koch",
    logo: "/logos/companies/koch.png",
    type: "past",
    highlights: ["Developed micro frontend architecture using Angular 12", "Implemented AWS Cognito for secure authentication", "Designed scalable .NET Core microservices on AWS ECS (Fargate)"],
    tech: ["Angular 12", "AWS Cognito", "ECS Fargate", ".NET Core"],
  },
  {
    year: "2019",
    duration: "Dec 2019 — Dec 2020",
    role: "Programmer Analyst",
    company: "Koch Business Solutions India",
    companyShort: "Koch",
    logo: "/logos/companies/koch.png",
    type: "past",
    highlights: [
      "Migrated legacy AngularJS application to Angular 8",
      "Conducted code reviews resulting in 30% increase in application efficiency",
      "Collaborated with onsite team to drive product enhancements",
    ],
    tech: ["Angular 8", "AngularJS", "TypeScript"],
  },
  {
    year: "2015",
    duration: "Mar 2015 — Dec 2019",
    role: "Software Developer",
    company: "PRATIAN Technologies",
    companyShort: "PT",
    logo: "/logos/companies/pratian.png",
    type: "past",
    highlights: [
      "Developed and deployed scalable software products",
      "Streamlined deployment through continuous integration tools",
      "Introduced code quality documentation and development methodologies",
      "Conducted weekly workshops on emerging technologies",
    ],
    tech: [".NET", "C#", "AngularJS", "SQL", "CI/CD"],
  },
];

function TimelineCard({ milestone, index }: { milestone: Milestone; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative flex gap-6 md:gap-10">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-2 transition-all duration-700 delay-200 ${visible ? "scale-100 opacity-100" : "scale-0 opacity-0"} ${
            milestone.type === "current" ? "bg-teal border-teal shadow-[0_0_12px_rgba(45,212,191,0.5)]" : "bg-navy-light border-teal/40"
          }`}
        />
        {index < milestones.length - 1 && <div className={`w-px flex-1 transition-all duration-1000 delay-500 ${visible ? "bg-gradient-to-b from-teal/40 to-teal/10 opacity-100" : "opacity-0"}`} />}
      </div>

      {/* Card */}
      <div className={`pb-10 flex-1 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${index * 100 + 100}ms` }}>
        {/* Duration */}
        <span className={`inline-block text-xs font-mono tracking-wider mb-2 ${milestone.type === "current" ? "text-teal" : "text-text-dim"}`}>{milestone.duration}</span>

        <div
          className={`rounded-2xl border p-6 transition-all duration-300 ${
            milestone.type === "current"
              ? "border-teal/20 bg-gradient-to-br from-teal/[0.06] to-transparent shadow-[0_0_40px_rgba(45,212,191,0.06)]"
              : "border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] hover:border-[var(--theme-white-alpha-10)] hover:bg-[var(--theme-white-alpha-5)]"
          }`}
        >
          <div className="flex items-start gap-4 mb-3">
            {/* Company logo */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                milestone.type === "current" ? "bg-teal/15 border border-teal/20" : "bg-[var(--theme-white-alpha-5)] border border-[var(--theme-white-alpha-10)]"
              }`}
            >
              {milestone.logo ? (
                <Image src={`${basePath}${milestone.logo}`} alt={milestone.company} width={28} height={28} className="object-contain" />
              ) : (
                <span className="font-bold text-xs tracking-tight text-text-dim">{milestone.companyShort}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className={`text-lg font-semibold ${milestone.type === "current" ? "bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent" : "text-text-primary"}`}>
                    {milestone.role}
                  </h3>
                  <p className="text-sm text-text-muted">{milestone.company}</p>
                </div>

                {milestone.type === "current" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                    <span className="text-[10px] font-medium text-teal">Current</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <ul className="space-y-1.5 mb-4">
            {milestone.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="text-teal/50 mt-1 shrink-0">&#8250;</span>
                {h}
              </li>
            ))}
          </ul>

          {milestone.tech.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--theme-border)]">
              {milestone.tech.map((t) => (
                <span key={t} className="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--theme-white-alpha-5)] text-text-dim">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CareerTimeline() {
  return (
    <div className="max-w-2xl mx-auto">
      {milestones.map((milestone, index) => (
        <TimelineCard key={`${milestone.company}-${milestone.role}`} milestone={milestone} index={index} />
      ))}
    </div>
  );
}
