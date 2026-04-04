"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import AvatarCropper from "@/components/ui/AvatarCropper";
import { showToast } from "@/components/ui/Toast";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type Mode = "login" | "register" | "forgot";

const OAUTH_PROVIDERS: { id: Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
];

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail("");
    setPassword("");
    setFullName("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setRawImageSrc(null);
    setShowCropper(false);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    setRawImageSrc(URL.createObjectURL(file));
    setShowCropper(true);
  }

  function handleCropDone(blob: Blob) {
    const file = new File([blob], "avatar.png", { type: "image/png" });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setShowCropper(false);
    setRawImageSrc(null);
  }

  function handleCropCancel() {
    setShowCropper(false);
    setRawImageSrc(null);
  }

  function switchMode(m: Mode) {
    reset();
    setMode(m);
  }

  async function handleOAuth(provider: Provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/premium/`,
      },
    });
    if (error) showToast(error.message, "error");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      reset();
      onClose();
      showToast("Welcome back!", "success");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Convert avatar to base64 if provided (upload happens after email confirmation)
    let avatarDataUrl: string | undefined;
    if (avatarFile) {
      avatarDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(avatarFile);
      });
    }

    // 2. Sign up — store avatar as base64 in user_metadata temporarily
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(avatarDataUrl ? { avatar_url: avatarDataUrl, pending_avatar_upload: true } : {}),
        },
      },
    });

    if (error) {
      setLoading(false);
      showToast(error.message, "error");
      return;
    }

    setLoading(false);
    reset();
    onClose();
    showToast("Account created! Check your email for the confirmation link.", "success");
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/premium/`,
    });
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      reset();
      onClose();
      showToast("Password reset link sent to your email!", "success");
    }
  }

  if (!open) return null;

  const inputClass = "rounded-lg border bg-navy-light px-4 py-3 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-teal/50 transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8 px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 mx-auto my-auto"
        style={{
          background: "var(--color-navy)",
          borderColor: "var(--theme-border)",
          boxShadow: "0 0 60px rgba(45, 212, 191, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-text-primary">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {mode === "login" && "Sign in to access premium content"}
            {mode === "register" && "Join to unlock premium content"}
            {mode === "forgot" && "Enter your email to reset password"}
          </p>
        </div>

        {/* OAuth Providers — shown on login only */}
        {mode === "login" && (
          <>
            <div className="flex flex-col gap-3 mb-6">
              {OAUTH_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOAuth(p.id)}
                  className="flex items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-[var(--theme-white-alpha-5)] hover:border-teal/30 cursor-pointer"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  {p.icon}
                  Continue with {p.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "var(--theme-border)" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-text-dim" style={{ background: "var(--color-navy)" }}>
                  or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              style={{ borderColor: "var(--theme-border)" }}
            />
            <button type="submit" disabled={loading} className="rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-btn-text transition-all hover:bg-teal-dark disabled:opacity-50 cursor-pointer">
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => switchMode("forgot")} className="text-teal hover:underline cursor-pointer">
                Forgot password?
              </button>
              <button type="button" onClick={() => switchMode("register")} className="text-text-muted hover:text-text-primary cursor-pointer">
                Create account
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {/* Avatar picker / cropper */}
            {showCropper && rawImageSrc ? (
              <AvatarCropper imageSrc={rawImageSrc} onCrop={handleCropDone} onCancel={handleCropCancel} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <label className="relative cursor-pointer group" aria-label="Upload profile picture">
                  <div
                    className="flex items-center justify-center w-[240px] h-[240px] rounded-full border-2 border-dashed overflow-hidden transition-colors group-hover:border-teal/50"
                    style={{ borderColor: avatarPreview ? "var(--color-teal)" : "var(--theme-border)", background: "var(--color-navy-light)" }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-text-dim">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-sm">Add Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  {avatarPreview && (
                    <span className="absolute bottom-1 right-1 bg-teal text-btn-text rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </span>
                  )}
                </label>
                {avatarPreview && <p className="text-[11px] text-text-dim">Click to change photo</p>}
              </div>
            )}

            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              style={{ borderColor: "var(--theme-border)" }}
            />
            <button type="submit" disabled={loading} className="rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-btn-text transition-all hover:bg-teal-dark disabled:opacity-50 cursor-pointer">
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <button type="button" onClick={() => switchMode("login")} className="text-sm text-text-muted hover:text-text-primary cursor-pointer">
              Already have an account? Sign in
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            <button type="submit" disabled={loading} className="rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-btn-text transition-all hover:bg-teal-dark disabled:opacity-50 cursor-pointer">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => switchMode("login")} className="text-sm text-text-muted hover:text-text-primary cursor-pointer">
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
