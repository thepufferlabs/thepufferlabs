"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endsAt: string;
  className?: string;
}

export default function CountdownTimer({ endsAt, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => calcRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining(endsAt);
      setRemaining(r);
      if (r.total <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (remaining.total <= 0) return null;

  return (
    <span className={`font-mono text-[10px] ${className}`}>
      {remaining.days > 0 && `${remaining.days}d `}
      {String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:{String(remaining.seconds).padStart(2, "0")}
    </span>
  );
}

function calcRemaining(endsAt: string) {
  const total = Math.max(0, new Date(endsAt).getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}
