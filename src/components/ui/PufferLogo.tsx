import Image from "next/image";

interface PufferLogoProps {
  className?: string;
  size?: number;
  variant?: "navy" | "dark" | "light";
}

const variantSrc: Record<string, string> = {
  navy: "/logos/puffer-navy-sm.png",
  dark: "/logos/puffer-black-sm.png",
  light: "/logos/puffer-white-sm.png",
};

export default function PufferLogo({ className = "", size = 32, variant = "navy" }: PufferLogoProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const src = `${basePath}${variantSrc[variant]}`;

  return <Image src={src} alt="The Puffer Labs logo" width={size} height={size} className={`object-contain ${className}`} priority />;
}
