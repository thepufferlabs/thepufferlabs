"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Years Experience", value: 11, suffix: "+" },
  { label: "Companies", value: 4, suffix: "" },
  { label: "Projects Delivered", value: 14, suffix: "+" },
  { label: "Team Members Led", value: 12, suffix: "+" },
];

function AnimatedNumber({ target, suffix, visible }: { target: number; suffix: string; visible: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible, target]);

  return (
    <span>
      {current}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative border-y border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-teal mb-1">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} visible={visible} />
              </p>
              <p className="text-xs text-text-dim font-mono uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
