"use client";

import { type ReactNode, useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "@/lib/framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  scale?: number;
  amount?: number;
  once?: boolean;
}

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  staggerChildren?: number;
  delayChildren?: number;
  amount?: number;
  once?: boolean;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
}

interface FloatProps {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  rotate?: number;
}

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  lift?: number;
  scale?: number;
}

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export function Reveal({ children, className = "", delay = 0, duration = 0.72, x = 0, y = 26, scale = 0.98, amount = 0.2, once = true }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={{
        opacity: 0,
        x: prefersReducedMotion ? 0 : x,
        y: prefersReducedMotion ? 0 : y,
        scale: prefersReducedMotion ? 1 : scale,
        filter: prefersReducedMotion ? "none" : "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once, amount }}
      transition={{ delay, duration, ease: easeOut }}
    >
      {children}
    </m.div>
  );
}

export function StaggerGroup({ children, className = "", staggerChildren = 0.12, delayChildren = 0, amount = 0.12, once = true }: StaggerGroupProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren,
            staggerChildren: prefersReducedMotion ? 0 : staggerChildren,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className = "", x = 0, y = 28, scale = 0.98, duration = 0.64 }: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          x: prefersReducedMotion ? 0 : x,
          y: prefersReducedMotion ? 0 : y,
          scale: prefersReducedMotion ? 1 : scale,
          filter: prefersReducedMotion ? "none" : "blur(10px)",
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            duration,
            ease: easeOut,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function Float({ children, className = "", amplitude = 12, duration = 6.2, rotate = 0 }: FloatProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, -amplitude, 0],
              rotate: rotate ? [0, rotate, 0, -rotate, 0] : 0,
            }
      }
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </m.div>
  );
}

export function HoverLift({ children, className = "", lift = 10, scale = 1.015 }: HoverLiftProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div className={className} whileHover={prefersReducedMotion ? undefined : { y: -lift, scale }} transition={{ duration: 0.24, ease: easeOut }} style={{ transformPerspective: 1200 }}>
      {children}
    </m.div>
  );
}

export function Parallax({ children, className = "", offset = 42 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [-offset, offset]);

  return (
    <m.div ref={ref} className={className} style={{ y }}>
      {children}
    </m.div>
  );
}
