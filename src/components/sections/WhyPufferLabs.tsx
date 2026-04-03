import Image from "next/image";
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(45,212,191,0.04)_0%,transparent_60%)]" />

      <div className="relative">
        <SectionHeading
          label="Philosophy"
          title="Why The Puffer Labs?"
          description="The pufferfish isn't the biggest or the fastest — but it's one of the most fascinating. There's a reason we chose it."
        />

        {/* Centered mascot between heading and traits */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <Image
              src={`${basePath}/logos/the-puffer-labs-v.png`}
              alt="The Puffer Labs pufferfish mascot"
              width={250}
              height={250}
              className="object-contain drop-shadow-[0_0_50px_rgba(45,212,191,0.25)] max-w-[250px]"
              loading="eager"
              priority
            />
            <div className="absolute inset-0 -z-10 bg-teal/5 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {traits.map((trait, i) => (
            <div key={trait.label} className="group relative pl-8 border-l border-glass-border hover:border-teal/30 transition-colors">
              <div className="absolute left-0 top-0 w-px h-0 bg-teal group-hover:h-full transition-all duration-500" />
              <span className="text-xs font-mono text-teal/70 tracking-wider uppercase mb-2 block">0{i + 1}</span>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{trait.label}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{trait.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
