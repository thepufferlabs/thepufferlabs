"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  CsharpOriginal,
  TypescriptOriginal,
  JavascriptOriginal,
  PythonOriginal,
  ReactOriginal,
  AngularOriginal,
  NextjsOriginal,
  TailwindcssOriginal,
  Html5Original,
  DotnetcoreOriginal,
  DotNetOriginal,
  NodejsOriginal,
  GrpcOriginal,
  AzureOriginal,
  KubernetesOriginal,
  DockerOriginal,
  NginxOriginal,
  ApachekafkaOriginal,
  RabbitmqOriginal,
  CosmosdbOriginal,
  RedisOriginal,
  ElasticsearchOriginal,
  CypressioOriginal,
  AzuredevopsOriginal,
  GitlabOriginal,
  GrafanaOriginal,
  DatadogOriginal,
  MicrosoftsqlserverOriginal,
} from "devicons-react";

type IconComponent = ComponentType<{ size?: number | string; className?: string }>;

interface Skill {
  name: string;
  icon?: IconComponent;
}

interface SkillCategory {
  label: string;
  icon: React.ReactNode;
  color: string;
  skills: Skill[];
}

const categories: SkillCategory[] = [
  {
    label: "Languages",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
    skills: [
      { name: "C#", icon: CsharpOriginal },
      { name: "TypeScript", icon: TypescriptOriginal },
      { name: "JavaScript", icon: JavascriptOriginal },
      { name: "Python", icon: PythonOriginal },
      { name: "SQL", icon: MicrosoftsqlserverOriginal },
    ],
  },
  {
    label: "Frontend",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    skills: [
      { name: "React", icon: ReactOriginal },
      { name: "Angular", icon: AngularOriginal },
      { name: "Next.js", icon: NextjsOriginal },
      { name: "Tailwind CSS", icon: TailwindcssOriginal },
      { name: "HTML/CSS", icon: Html5Original },
    ],
  },
  {
    label: "Backend",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    skills: [
      { name: ".NET Core", icon: DotnetcoreOriginal },
      { name: "ASP.NET", icon: DotNetOriginal },
      { name: "Node.js", icon: NodejsOriginal },
      { name: "GraphQL" },
      { name: "gRPC", icon: GrpcOriginal },
    ],
  },
  {
    label: "Cloud & Infra",
    color: "text-lime-dark",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
    skills: [
      { name: "Azure", icon: AzureOriginal },
      { name: "AWS" },
      { name: "Kubernetes", icon: KubernetesOriginal },
      { name: "KEDA" },
      { name: "Docker", icon: DockerOriginal },
      { name: "Nginx", icon: NginxOriginal },
    ],
  },
  {
    label: "Data & Messaging",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    skills: [
      { name: "Kafka", icon: ApachekafkaOriginal },
      { name: "RabbitMQ", icon: RabbitmqOriginal },
      { name: "CosmosDB", icon: CosmosdbOriginal },
      { name: "Redis", icon: RedisOriginal },
      { name: "Elasticsearch", icon: ElasticsearchOriginal },
      { name: "Databricks" },
    ],
  },
  {
    label: "DevOps & Testing",
    color: "text-lime-dark",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    skills: [
      { name: "Cypress", icon: CypressioOriginal },
      { name: "Azure DevOps", icon: AzuredevopsOriginal },
      { name: "GitLab CI", icon: GitlabOriginal },
      { name: "Grafana", icon: GrafanaOriginal },
      { name: "Datadog", icon: DatadogOriginal },
      { name: "Dynatrace" },
    ],
  },
  {
    label: "Architecture",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    skills: [{ name: "Microservices" }, { name: "CQRS" }, { name: "Event Sourcing" }, { name: "DDD" }, { name: "System Design" }],
  },
  {
    label: "Practices",
    color: "text-teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
    skills: [{ name: "TDD" }, { name: "SOLID" }, { name: "CI/CD" }, { name: "Code Reviews" }, { name: "Agile" }, { name: "Mentoring" }],
  },
];

function SkillPill({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--theme-white-alpha-5)] hover:bg-teal/10 border border-transparent hover:border-teal/20 transition-all duration-200 group">
      {Icon ? <Icon size={18} /> : <span className="w-[18px] h-[18px] rounded-md bg-teal/20 flex items-center justify-center text-[9px] font-bold text-teal">{skill.name.charAt(0)}</span>}
      <span className="text-xs font-medium text-text-muted group-hover:text-text-primary transition-colors">{skill.name}</span>
    </div>
  );
}

export default function SkillsGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
      {categories.map((cat, i) => (
        <div
          key={cat.label}
          className={`group/card rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-5 transition-all duration-700 hover:border-teal/20 hover:shadow-[0_20px_50px_rgba(34,197,94,0.08)] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {/* Category header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`p-2 rounded-lg bg-[var(--theme-white-alpha-5)] ${cat.color} group-hover/card:bg-teal/10 group-hover/card:text-teal transition-colors`}>{cat.icon}</div>
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">{cat.label}</h3>
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-1.5">
            {cat.skills.map((skill) => (
              <SkillPill key={skill.name} skill={skill} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
