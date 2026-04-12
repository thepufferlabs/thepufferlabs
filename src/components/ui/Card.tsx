"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { m, useReducedMotion } from "@/lib/framer-motion";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-[-0.04em] text-text-primary", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center", className)} {...props} />;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={cn(
        "surface-panel relative overflow-hidden rounded-[1.75rem] p-6 md:p-8",
        hover && "transition-all duration-300 hover:border-[var(--theme-ring)] hover:bg-[var(--theme-panel-hover)] hover:shadow-[0_24px_56px_rgba(15,23,42,0.16)]",
        className
      )}
      whileHover={hover && !prefersReducedMotion ? { y: -10, scale: 1.015 } : undefined}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, var(--theme-accent), transparent 58%)" }}
      />
      <div className="relative">{children}</div>
    </m.div>
  );
}
