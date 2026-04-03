import Image from "next/image";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";

export default function About() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <SectionWrapper id="about">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <SectionHeading label="About" title="What is The Puffer Labs?" align="left" />
          <div className="space-y-5 text-text-muted leading-relaxed -mt-8">
            <p>
              Most engineering resources teach you <em>how</em> to use tools. The Puffer Labs teaches you <strong className="text-text-primary font-medium">how to think</strong>.
            </p>
            <p>We bridge the gap between writing code and designing systems — helping engineers develop the architectural intuition that separates senior engineers from the rest.</p>
            <p>Through deep technical content, system design breakdowns, and hands-on consulting, The Puffer Labs equips you to navigate complexity with confidence.</p>
          </div>
        </div>

        {/* Visual element */}
        <div className="relative">
          <div className="rounded-2xl border border-glass-border bg-glass p-8 font-mono text-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-text-dim">growth.ts</span>
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

            {/* Mascot peeking from corner */}
            <div className="absolute -bottom-6 -right-6">
              <Image src={`${basePath}/logos/puffer-navy-sm.png`} alt="The Puffer Labs mascot" width={80} height={80} className="object-contain drop-shadow-[0_0_20px_rgba(45,212,191,0.2)]" />
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -inset-4 -z-10 bg-gradient-to-br from-teal/5 to-lime/5 rounded-3xl blur-2xl" />
        </div>
      </div>
    </SectionWrapper>
  );
}
