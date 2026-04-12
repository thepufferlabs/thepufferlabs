"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import Separator from "@/components/ui/Separator";
import { m, useReducedMotion, useScroll, useTransform } from "@/lib/framer-motion";

const PufferScene = dynamic(() => import("@/components/three/PufferScene"), { ssr: false });
const easeOut = [0.22, 1, 0.36, 1] as const;
const heroPillars = [
  { label: "Content", value: "System design that holds up in production" },
  { label: "Consulting", value: "Architecture reviews and focused technical guidance" },
  { label: "Approach", value: "Reusable patterns over one-off code" },
] as const;

export default function Hero() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 0.7]);
  const glowScale = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 1.12]);
  const mascotY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -28]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <m.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12)_0%,transparent_68%)]"
        style={{ scale: glowScale }}
        animate={prefersReducedMotion ? undefined : { opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
      />
      <m.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(134,239,172,0.09)_0%,transparent_48%)]"
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.32, 0.58, 0.32] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

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
      <m.div
        className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 text-center"
        style={{ y: contentY, opacity: contentOpacity }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: 0.12,
              staggerChildren: prefersReducedMotion ? 0 : 0.12,
            },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {/* Mascot */}
        <m.div
          className="relative inline-block mb-8"
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReducedMotion ? 0 : 26,
              scale: prefersReducedMotion ? 1 : 0.92,
              filter: prefersReducedMotion ? "none" : "blur(12px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              transition: { duration: 0.8, ease: easeOut },
            },
          }}
          style={{ y: mascotY }}
        >
          <m.div animate={prefersReducedMotion ? undefined : { y: [0, -14, 0], rotate: [0, -2, 0, 2, 0] }} transition={{ duration: 7.2, ease: "easeInOut", repeat: Infinity }}>
            <Image
              src={`${basePath}/logos/puffer-navy-lg.png`}
              alt="The Puffer Labs mascot"
              width={140}
              height={140}
              className="object-contain drop-shadow-[0_0_48px_rgba(34,197,94,0.32)]"
              loading="eager"
              priority
            />
          </m.div>
        </m.div>
        {/* Badge */}
        <m.div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal/15 bg-teal/[0.06] px-4 py-1.5"
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReducedMotion ? 0 : 20,
              filter: prefersReducedMotion ? "none" : "blur(8px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.62, ease: easeOut },
            },
          }}
        >
          <m.div
            className="h-1.5 w-1.5 rounded-full bg-teal"
            animate={prefersReducedMotion ? undefined : { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <Badge variant="secondary" className="border-0 bg-transparent px-0 py-0 text-teal shadow-none">
            Engineering depth, delivered
          </Badge>
        </m.div>
        {/* Headline */}
        <m.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReducedMotion ? 0 : 24,
              filter: prefersReducedMotion ? "none" : "blur(12px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.84, ease: easeOut },
            },
          }}
        >
          <span className="text-text-primary">Think in </span>
          <m.span
            className="bg-gradient-to-r from-teal to-lime bg-clip-text text-transparent"
            animate={prefersReducedMotion ? undefined : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          >
            systems
          </m.span>
          <span className="text-text-primary">,</span>
          <br />
          <span className="text-text-primary">not just </span>
          <span className="text-text-muted">syntax</span>
        </m.h1>
        {/* Subheadline */}
        <m.p
          className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-text-muted leading-relaxed"
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReducedMotion ? 0 : 18,
              filter: prefersReducedMotion ? "none" : "blur(8px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.64, ease: easeOut },
            },
          }}
        >
          The Puffer Labs helps engineers evolve from task-level execution to system-level thinking. Deep technical content, real architecture insights, and consulting that actually moves the needle.
        </m.p>
        {/* CTAs */}
        <m.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReducedMotion ? 0 : 18,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: easeOut },
            },
          }}
        >
          <Button variant="primary" size="lg" href={`${basePath}/docs/`}>
            Explore Content
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.7 1.3a1 1 0 00-1.4 1.4L11.58 7H2a1 1 0 000 2h9.58l-4.3 4.3a1 1 0 001.42 1.4l6-6a1 1 0 000-1.4l-6-6z" />
            </svg>
          </Button>
          <Button variant="secondary" size="lg" href="#consulting">
            Book Consulting
          </Button>
        </m.div>

        <m.div
          className="mt-10"
          variants={{
            hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.64, ease: easeOut } },
          }}
        >
          <Card hover={false} className="mx-auto max-w-4xl p-4">
            <CardContent className="grid gap-4 md:grid-cols-3">
              {heroPillars.map((pillar, index) => (
                <div key={pillar.label} className="flex flex-col gap-3 rounded-2xl px-3 py-4 text-left">
                  <Badge variant="outline" className="w-fit px-2.5 py-0.5 text-[10px] tracking-[0.18em]">
                    {pillar.label}
                  </Badge>
                  <p className="text-sm leading-relaxed text-text-muted">{pillar.value}</p>
                  {index < heroPillars.length - 1 ? <Separator className="hidden md:block" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </m.div>
      </m.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy to-transparent transition-colors duration-300" />
    </section>
  );
}
