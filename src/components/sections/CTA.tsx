import Image from "next/image";
import Button from "@/components/ui/Button";

export default function CTA() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <section id="cta" className="relative py-16 md:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(163,230,53,0.06)_0%,transparent_50%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center">
        {/* Mascot */}
        <div className="flex justify-center mb-8">
          <Image
            src={`${basePath}/logos/the-puffer-labs-v.png`}
            alt="The Puffer Labs mascot"
            width={250}
            height={250}
            className="object-contain drop-shadow-[0_0_30px_rgba(45,212,191,0.3)] animate-float max-w-[250px] h-auto"
          />
        </div>

        <span className="inline-block mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-teal font-mono">Ready?</span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
          <span className="bg-gradient-to-r from-teal via-teal to-lime bg-clip-text text-transparent">Expand Your Knowledge</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted leading-relaxed">Join a growing community of engineers who think deeper, build better, and architect systems that last.</p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" href="#">
            Get Started — It&apos;s Free
          </Button>
          <Button variant="ghost" size="lg" href="#consulting">
            Talk to Us
          </Button>
        </div>

        <p className="mt-8 text-xs text-text-dim">No spam. No fluff. Just engineering depth.</p>
      </div>
    </section>
  );
}
