"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Button from "@/components/ui/Button";

const PufferScene = dynamic(() => import("@/components/three/PufferScene"), { ssr: false });

export default function Hero() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(163,230,53,0.04)_0%,transparent_50%)]" />

      {/* ASCII background texture */}
      <div className="absolute inset-0 opacity-[0.03] font-mono text-[10px] leading-[12px] text-teal overflow-hidden select-none pointer-events-none whitespace-pre" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i}>
            {Array.from({ length: 200 }, (_, j) => {
              const chars = "{}()<>/;=*+~[]|&^%$#@!?.,:";
              return chars[(i * 7 + j * 13) % chars.length];
            }).join("")}
          </div>
        ))}
      </div>

      {/* Three.js scene */}
      <PufferScene />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 text-center">
        {/* Mascot */}
        <div className="relative inline-block mb-8">
          <Image
            src={`${basePath}/logos/puffer-navy-lg.png`}
            alt="The Puffer Labs mascot"
            width={140}
            height={140}
            className="object-contain drop-shadow-[0_0_40px_rgba(45,212,191,0.3)] animate-float"
            loading="eager"
            priority
          />
        </div>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 mb-8">
          <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
          <span className="text-xs font-medium text-teal tracking-wide">Engineering depth, delivered</span>
        </div>
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          <span className="text-text-primary">Think in </span>
          <span className="bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent">systems</span>
          <span className="text-text-primary">,</span>
          <br />
          <span className="text-text-primary">not just </span>
          <span className="text-text-muted">syntax</span>
        </h1>
        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-text-muted leading-relaxed">
          The Puffer Labs helps engineers evolve from task-level execution to system-level thinking. Deep technical content, real architecture insights, and consulting that actually moves the needle.
        </p>
        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" href={`${basePath}/docs/`}>
            Explore Content
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.7 1.3a1 1 0 00-1.4 1.4L11.58 7H2a1 1 0 000 2h9.58l-4.3 4.3a1 1 0 001.42 1.4l6-6a1 1 0 000-1.4l-6-6z" />
            </svg>
          </Button>
          <Button variant="secondary" size="lg" href="#consulting">
            Book Consulting
          </Button>
        </div>{" "}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy to-transparent transition-colors duration-300" />
    </section>
  );
}
