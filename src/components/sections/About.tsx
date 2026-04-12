import Image from "next/image";
import { Float, HoverLift, Parallax, Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";

const focusAreas = ["System design", "Architecture judgment", "Platform thinking"] as const;

export default function About() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <SectionWrapper id="about">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <StaggerGroup className="min-w-0" staggerChildren={0.1} amount={0.14}>
          <SectionHeading label="About" title="What is The Puffer Labs?" align="left" />
          <div className="space-y-5 text-text-muted leading-relaxed -mt-8">
            <StaggerItem y={18} duration={0.56}>
              <p>
                Most engineering resources teach you <em>how</em> to use tools. The Puffer Labs teaches you <strong className="text-text-primary font-medium">how to think</strong>.
              </p>
            </StaggerItem>
            <StaggerItem y={18} duration={0.56}>
              <p>We bridge the gap between writing code and designing systems — helping engineers develop the architectural intuition that separates senior engineers from the rest.</p>
            </StaggerItem>
            <StaggerItem y={18} duration={0.56}>
              <p>Through deep technical content, system design breakdowns, and hands-on consulting, The Puffer Labs equips you to navigate complexity with confidence.</p>
            </StaggerItem>
            <StaggerItem y={18} duration={0.56}>
              <div className="flex flex-wrap gap-2 pt-2">
                {focusAreas.map((item) => (
                  <Badge key={item} variant="outline" className="text-[10px] tracking-[0.18em]">
                    {item}
                  </Badge>
                ))}
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>

        {/* Visual element */}
        <Reveal x={36} duration={0.8}>
          <Parallax className="relative" offset={30}>
            <HoverLift lift={12} scale={1.012}>
              <Card hover={false} className="font-mono text-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    <Badge variant="outline" className="ml-2 px-2.5 py-0.5 text-[10px] tracking-[0.18em]">
                      growth.ts
                    </Badge>
                  </div>
                  <div className="space-y-1 text-text-dim">
                    <p>
                      <span className="text-teal">const</span> engineer = {"{"}
                    </p>
                    <p className="pl-4">
                      <span className="text-text-muted">level</span>: <span className="text-lime">&quot;junior&quot;</span>,
                    </p>
                    <p className="pl-4">
                      <span className="text-text-muted">focus</span>: <span className="text-lime">&quot;tasks&quot;</span>,
                    </p>
                    <p className="pl-4">
                      <span className="text-text-muted">scope</span>: <span className="text-lime">&quot;function&quot;</span>,
                    </p>
                    <p>{"}"}</p>
                    <p className="mt-3 text-text-dim">
                      <span className="text-text-dim">{"// "}</span>
                      <span className="text-teal/60 italic">After The Puffer Labs...</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-teal">const</span> architect = {"{"}
                    </p>
                    <p className="pl-4">
                      <span className="text-text-primary">level</span>: <span className="text-lime">&quot;senior+&quot;</span>,
                    </p>
                    <p className="pl-4">
                      <span className="text-text-primary">focus</span>: <span className="text-lime">&quot;systems&quot;</span>,
                    </p>
                    <p className="pl-4">
                      <span className="text-text-primary">scope</span>: <span className="text-lime">&quot;platform&quot;</span>,
                    </p>
                    <p>{"}"}</p>
                  </div>

                  <Float className="absolute -bottom-6 -right-6" amplitude={10} duration={5.4} rotate={3}>
                    <Image src={`${basePath}/logos/puffer-navy-sm.png`} alt="The Puffer Labs mascot" width={80} height={80} className="object-contain drop-shadow-[0_0_24px_rgba(34,197,94,0.24)]" />
                  </Float>
                </CardContent>
              </Card>
            </HoverLift>
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-br from-teal/5 to-lime/5 rounded-3xl blur-2xl" />
          </Parallax>
        </Reveal>
      </div>
    </SectionWrapper>
  );
}
