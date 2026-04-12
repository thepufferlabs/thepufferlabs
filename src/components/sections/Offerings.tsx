import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import Badge from "@/components/ui/Badge";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { OFFERINGS } from "@/lib/constants";

const icons: Record<string, React.ReactNode> = {
  blog: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  ),
  system: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <path d="M6 8h2M10 8h2M14 8h4M6 12h4M12 12h6" />
    </svg>
  ),
  insight: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    </svg>
  ),
  consulting: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  ),
};

export default function Offerings() {
  return (
    <SectionWrapper id="learn">
      <SectionHeading label="Learn" title="What You'll Find Here" description="Resources designed for engineers who want to move beyond implementation and into the architecture layer." />

      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerChildren={0.1} amount={0.08}>
        {OFFERINGS.map((item) => (
          <StaggerItem key={item.title} y={24}>
            <Card className="group h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-teal/15 bg-teal/10 transition-colors group-hover:border-teal/30">{icons[item.icon]}</div>
                  <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] tracking-[0.18em]">
                    0{OFFERINGS.indexOf(item) + 1}
                  </Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </SectionWrapper>
  );
}
