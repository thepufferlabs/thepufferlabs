export const SITE = {
  name: "ThePufferLabs",
  tagline: "Expand Your Knowledge",
  description:
    "ThePufferLabs helps software engineers grow from implementation-focused work into deeper architectural, systems, and engineering thinking.",
  url: "https://pufferlabs.dev",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "About Me", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Consulting", href: "#consulting" },
] as const;

export const SOCIAL_LINKS = [
  { label: "GitHub", href: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? ""}` },
  { label: "LinkedIn", href: process.env.NEXT_PUBLIC_OWNER_LINKEDIN ?? "" },
] as const;

export const OFFERINGS = [
  {
    title: "Deep Technical Blogs",
    description:
      "Long-form articles that go beyond surface-level tutorials. Understand the why behind every engineering decision.",
    icon: "blog",
  },
  {
    title: "System Design Breakdowns",
    description:
      "Detailed walkthroughs of real-world architectures — from data pipelines to distributed systems.",
    icon: "system",
  },
  {
    title: "Engineering Insights",
    description:
      "Patterns, anti-patterns, and hard-won lessons from building production systems at scale.",
    icon: "insight",
  },
  {
    title: "Consulting & Architecture",
    description:
      "Hands-on guidance for teams navigating complex technical decisions and platform evolution.",
    icon: "consulting",
  },
] as const;

export const FEATURED_ARTICLES = [
  {
    title: "Why Your Microservices Are a Distributed Monolith",
    description:
      "Breaking apart a monolith doesn't mean you've escaped it. Learn the patterns that keep teams coupled across service boundaries.",
    tags: ["Architecture", "Microservices"],
    readTime: "12 min read",
  },
  {
    title: "The Hidden Cost of Premature Abstraction",
    description:
      "When DRY becomes a liability. A deep look at how over-engineering early destroys velocity and creates accidental complexity.",
    tags: ["Engineering", "Patterns"],
    readTime: "8 min read",
  },
  {
    title: "Event Sourcing in Practice: Beyond the Hype",
    description:
      "A pragmatic guide to event-driven architectures — when they shine, when they don't, and how to implement them without drowning in complexity.",
    tags: ["Systems", "Backend"],
    readTime: "15 min read",
  },
] as const;

export const CONSULTING_AREAS = [
  {
    title: "Architecture Thinking",
    description: "Design systems that scale with your team and your traffic.",
  },
  {
    title: "Backend Systems",
    description: "Databases, queues, APIs, and the infrastructure beneath.",
  },
  {
    title: "Frontend Systems",
    description: "Performant, maintainable UI architectures that last.",
  },
  {
    title: "Engineering Strategy",
    description: "Technical roadmaps, team structure, and build-vs-buy decisions.",
  },
  {
    title: "Platform Evolution",
    description: "Migrate, modernize, and scale without losing momentum.",
  },
] as const;
