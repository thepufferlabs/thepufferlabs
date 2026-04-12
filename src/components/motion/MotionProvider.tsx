"use client";

import { type ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "@/lib/framer-motion";

interface MotionProviderProps {
  children: ReactNode;
}

export default function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
