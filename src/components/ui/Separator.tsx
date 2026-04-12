import * as React from "react";
import { cn } from "@/lib/cn";
import { SeparatorPrimitive } from "@/lib/radix-ui";

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn("shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      style={{
        background:
          orientation === "horizontal"
            ? "linear-gradient(90deg, transparent, var(--theme-border-strong), transparent)"
            : "linear-gradient(180deg, transparent, var(--theme-border-strong), transparent)",
      }}
      {...props}
    />
  );
});

Separator.displayName = SeparatorPrimitive.Root.displayName;

export default Separator;
