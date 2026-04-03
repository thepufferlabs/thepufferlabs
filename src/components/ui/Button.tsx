import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonAsLink = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants = {
  primary: "bg-teal text-btn-text font-semibold hover:bg-teal-dark shadow-[0_0_24px_rgba(45,212,191,0.25)] hover:shadow-[0_0_32px_rgba(45,212,191,0.4)] active:scale-[0.98]",
  secondary: "border border-teal/30 text-teal hover:bg-teal/10 hover:border-teal/50 active:scale-[0.98]",
  ghost: "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)] active:scale-[0.98]",
} as const;

const sizes = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-sm rounded-xl",
  lg: "px-8 py-4 text-base rounded-xl",
} as const;

export default function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return <a href={href} className={classes} {...rest} />;
  }

  return <button className={classes} {...(props as ButtonAsButton)} />;
}
