import Image from "next/image";
import { Float, Parallax, Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";

const traits = [
  {
    label: "Calm under pressure",
    description: "The best engineers don't panic. They observe, reason, and act with intention — just like a pufferfish drifting calmly through the current.",
  },
  {
    label: "Adaptive by nature",
    description: "Pufferfish thrive in diverse environments. Great engineers adapt their thinking to the problem, not the other way around.",
  },
  {
    label: "Explosive when it matters",
    description: "A pufferfish can expand to 3x its size in seconds. The best engineers have depth they reveal when complexity demands it.",
  },
  {
    label: "Quietly powerful",
    description: "They don't need to be loud. Their strength is structural, hidden beneath the surface — ready when called upon.",
  },
];

export default function WhyPufferLabs() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <SectionWrapper id="why" className="relative">
      {/* Subtle divider gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(34,197,94,0.08)_0%,transparent_58%)]" />

      <div className="relative">
        <SectionHeading
          label="Philosophy"
          title="Why The Puffer Labs?"
          description="The pufferfish isn't the biggest or the fastest — but it's one of the most fascinating. There's a reason we chose it."
        />

        {/* Centered mascot between heading and traits */}
        <Reveal className="flex justify-center mb-12" y={18}>
          <Parallax offset={28}>
            <div className="relative">
              <Float amplitude={14} duration={6.8} rotate={2.5}>
                <Image
                  src={`${basePath}/logos/the-puffer-labs-v.png`}
                  alt="The Puffer Labs pufferfish mascot"
                  width={250}
                  height={250}
                  className="object-contain drop-shadow-[0_0_60px_rgba(34,197,94,0.22)] max-w-[250px] h-auto"
                  loading="eager"
                  priority
                />
              </Float>
              <div className="absolute inset-0 -z-10 bg-teal/5 rounded-full blur-3xl" />
            </div>
          </Parallax>
        </Reveal>

        <StaggerGroup className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" staggerChildren={0.11} amount={0.08}>
          {traits.map((trait, i) => (
            <StaggerItem key={trait.label} x={i % 2 === 0 ? -22 : 22} y={18}>
              <div className="group relative pl-8 border-l border-glass-border hover:border-teal/30 transition-colors">
                <div className="absolute left-0 top-0 w-px h-0 bg-teal group-hover:h-full transition-all duration-500" />
                <span className="text-xs font-mono text-teal/70 tracking-wider uppercase mb-2 block">0{i + 1}</span>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{trait.label}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{trait.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </SectionWrapper>
  );
}
