import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — The Puffer Labs Docs",
    default: "Docs — The Puffer Labs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
