import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Slot } from "@/lib/radix-ui";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonAsLink = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants = {
  primary:
    "border border-transparent bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] shadow-[var(--theme-soft-shadow)] hover:-translate-y-0.5 hover:brightness-[0.98] active:translate-y-0",
  secondary:
    "border border-[var(--theme-border-strong)] bg-[var(--theme-secondary)] text-text-primary shadow-[var(--theme-soft-shadow)] hover:-translate-y-0.5 hover:bg-[var(--theme-muted)] active:translate-y-0",
  ghost: "border border-transparent text-text-muted hover:bg-[var(--theme-secondary)] hover:text-text-primary",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-[52px] px-6 text-base rounded-2xl",
} as const;

export default function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const classes = cn(
    "group/button",
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.02em] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-navy)] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if ("asChild" in props && props.asChild) {
    const { asChild: _asChild, ...rest } = props as ButtonAsButton;
    return <Slot className={classes} {...rest} />;
  }

  if ("href" in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return <a href={href} className={classes} {...rest} />;
  }

  return <button className={classes} {...(props as ButtonAsButton)} />;
}
