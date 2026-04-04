"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error";

type ToastData = {
  id: number;
  message: string;
  type: ToastType;
};

let toastId = 0;
let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "success") {
  addToastFn?.(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-slide-in min-w-[320px] max-w-[420px]"
          style={{
            background: toast.type === "success" ? "rgba(13, 148, 136, 0.15)" : "rgba(239, 68, 68, 0.15)",
            borderColor: toast.type === "success" ? "rgba(45, 212, 191, 0.3)" : "rgba(239, 68, 68, 0.3)",
          }}
        >
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-teal">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            )}
          </div>

          {/* Message */}
          <p className={`text-sm flex-1 ${toast.type === "success" ? "text-teal" : "text-red-400"}`}>{toast.message}</p>

          {/* Dismiss */}
          <button onClick={() => dismiss(toast.id)} className="shrink-0 text-text-dim hover:text-text-muted transition-colors cursor-pointer" aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
