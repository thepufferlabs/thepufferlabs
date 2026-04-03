interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeading({ label, title, description, align = "center" }: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl mb-16 ${alignment}`}>
      {label && <span className="inline-block mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-teal font-mono">{label}</span>}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-[1.15]">{title}</h2>
      {description && <p className="mt-5 text-lg text-text-muted leading-relaxed">{description}</p>}
    </div>
  );
}
