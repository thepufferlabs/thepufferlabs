"use client";

import {
  CsharpOriginal,
  TypescriptOriginal,
  JavascriptOriginal,
  PythonOriginal,
  GoOriginal,
  RustOriginal,
  JavaOriginal,
  BashOriginal,
  DockerOriginal,
  Html5Original,
  Css3Original,
  KotlinOriginal,
  SwiftOriginal,
} from "devicons-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  "C#": CsharpOriginal,
  "c#": CsharpOriginal,
  csharp: CsharpOriginal,
  TypeScript: TypescriptOriginal,
  typescript: TypescriptOriginal,
  JavaScript: JavascriptOriginal,
  javascript: JavascriptOriginal,
  Python: PythonOriginal,
  python: PythonOriginal,
  Go: GoOriginal,
  go: GoOriginal,
  Rust: RustOriginal,
  rust: RustOriginal,
  Java: JavaOriginal,
  java: JavaOriginal,
  Shell: BashOriginal,
  shell: BashOriginal,
  Bash: BashOriginal,
  bash: BashOriginal,
  Dockerfile: DockerOriginal,
  dockerfile: DockerOriginal,
  HTML: Html5Original,
  html: Html5Original,
  CSS: Css3Original,
  css: Css3Original,
  Kotlin: KotlinOriginal,
  kotlin: KotlinOriginal,
  Swift: SwiftOriginal,
  swift: SwiftOriginal,
};

interface LanguageIconProps {
  language: string;
  size?: number;
  className?: string;
}

export default function LanguageIcon({ language, size = 16, className }: LanguageIconProps) {
  const Icon = ICON_MAP[language];

  if (!Icon) {
    // Fallback: colored dot
    return (
      <span
        className={`inline-block rounded-full shrink-0 ${className ?? ""}`}
        style={{ width: size * 0.7, height: size * 0.7, backgroundColor: "#6B7280" }}
      />
    );
  }

  return <Icon size={size} className={className} />;
}
