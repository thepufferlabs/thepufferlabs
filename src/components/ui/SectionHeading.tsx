import Badge from "@/components/ui/Badge";
import Separator from "@/components/ui/Separator";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeading({ label, title, description, align = "center" }: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  const labelAlignment = align === "center" ? "justify-center" : "justify-start";

  return (
    <StaggerGroup className={`mb-16 max-w-3xl ${alignment}`} staggerChildren={0.1} amount={0.18}>
      {label && (
        <StaggerItem y={18} duration={0.52}>
          <div className={cn("mb-5 flex items-center gap-3", labelAlignment)}>
            <Badge variant="secondary" className="text-teal">
              {label}
            </Badge>
            <Separator className="hidden w-16 sm:block" />
          </div>
        </StaggerItem>
      )}
      <StaggerItem y={22} duration={0.6}>
        <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.08em] text-text-primary md:text-4xl lg:text-5xl">{title}</h2>
      </StaggerItem>
      {description && (
        <StaggerItem y={18} duration={0.56}>
          <p className="mt-5 text-base leading-relaxed text-text-muted md:text-lg">{description}</p>
        </StaggerItem>
      )}
    </StaggerGroup>
  );
}
