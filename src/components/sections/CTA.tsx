import Image from "next/image";
import { Float, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";

export default function CTA() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <section id="cta" className="relative py-16 md:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.14)_0%,transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(134,239,172,0.09)_0%,transparent_48%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.22) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <StaggerGroup className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center" staggerChildren={0.12} amount={0.2}>
        <Card hover={false} className="overflow-hidden text-center">
          <CardContent className="relative px-4 py-8 md:px-10 md:py-10">
            {/* Mascot */}
            <StaggerItem className="flex justify-center mb-8" y={18}>
              <Float amplitude={14} duration={6.4} rotate={2}>
                <Image
                  src={`${basePath}/logos/the-puffer-labs-v.png`}
                  alt="The Puffer Labs mascot"
                  width={250}
                  height={250}
                  className="object-contain drop-shadow-[0_0_36px_rgba(34,197,94,0.28)] max-w-[250px] h-auto"
                />
              </Float>
            </StaggerItem>

            <StaggerItem y={16} duration={0.52}>
              <Badge variant="secondary" className="mb-4 text-teal">
                Ready?
              </Badge>
            </StaggerItem>

            <StaggerItem y={20} duration={0.72}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-r from-teal via-teal to-lime bg-clip-text text-transparent">Expand Your Knowledge</span>
              </h2>
            </StaggerItem>

            <StaggerItem y={18}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted leading-relaxed">Join a growing community of engineers who think deeper, build better, and architect systems that last.</p>
            </StaggerItem>

            <StaggerItem y={16} duration={0.56}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="primary" size="lg" href="#">
                  Get Started — It&apos;s Free
                </Button>
                <Button variant="ghost" size="lg" href="#consulting">
                  Talk to Us
                </Button>
              </div>
            </StaggerItem>

            <StaggerItem y={12} duration={0.48}>
              <p className="mt-8 text-xs text-text-dim">No spam. No fluff. Just engineering depth.</p>
            </StaggerItem>
          </CardContent>
        </Card>
      </StaggerGroup>
    </section>
  );
}
