import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

const variants = {
  default: "border-transparent bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] shadow-[var(--theme-soft-shadow)]",
  secondary: "border-[var(--theme-border-strong)] bg-[var(--theme-secondary)] text-text-primary",
  outline: "border-[var(--theme-border-strong)] bg-transparent text-text-muted",
} as const;

export default function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em]", variants[variant], className)} {...props} />;
}
