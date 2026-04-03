import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`
        relative rounded-2xl border border-glass-border bg-glass backdrop-blur-sm
        p-6 md:p-8
        ${hover ? "transition-all duration-300 hover:border-teal/20 hover:bg-navy-light/80 hover:shadow-[0_0_40px_rgba(45,212,191,0.06)]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
