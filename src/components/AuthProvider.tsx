"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import type { UserRole } from "@/lib/database.types";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  hasPurchases: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  hasPurchases: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Upload pending base64 avatar to storage, then update user metadata with the public URL */
async function uploadPendingAvatar(user: User) {
  const meta = user.user_metadata ?? {};
  if (!meta.pending_avatar_upload || !meta.avatar_url?.startsWith("data:")) return;

  try {
    // Convert base64 data URL to Blob
    const res = await fetch(meta.avatar_url);
    const blob = await res.blob();
    const filePath = `${user.id}/avatar.png`;

    const { error } = await supabase.storage.from("avatars").upload(filePath, blob, { upsert: true, contentType: "image/png" });

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Replace base64 with public URL and clear pending flag
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, pending_avatar_upload: null },
      });
    }
  } catch {
    // Silent fail — avatar stays as base64 until next sign-in
  }
}

/** Sync OAuth demographics into the profiles table on each sign-in */
async function syncProfile(user: User) {
  const meta = user.user_metadata ?? {};

  // Upload pending avatar first so we get the storage URL
  await uploadPendingAvatar(user);

  // Re-read metadata in case avatar URL was updated
  const { data } = await supabase.auth.getUser();
  const freshMeta = data?.user?.user_metadata ?? meta;

  const avatar = freshMeta.avatar_url || freshMeta.picture || null;
  const name = freshMeta.full_name || freshMeta.name || freshMeta.user_name || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any)
    .update({
      full_name: name,
      display_name: name,
      avatar_url: avatar,
    })
    .eq("id", user.id);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [hasPurchases, setHasPurchases] = useState(false);

  async function fetchRole(userId: string) {
    try {
      const { data } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", userId)
        .single() as { data: { role: UserRole } | null };
      setRole(data?.role ?? null);
    } catch {
      setRole(null);
    }
  }

  async function fetchPurchases(userId: string) {
    try {
      const { count } = await (supabase.from("orders") as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "paid") as { count: number | null };
      setHasPurchases((count ?? 0) > 0);
    } catch {
      setHasPurchases(false);
    }
  }

  useEffect(() => {
    // Handle auth errors in URL hash (e.g. expired email confirmation links)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("error=")) {
        const params = new URLSearchParams(hash.substring(1));
        const errorDesc = params.get("error_description");
        if (errorDesc) {
          showToast(errorDesc.replace(/\+/g, " "), "error");
        }
        // Clean up the URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    supabase.auth.getSession().then(async ({ data: { session: localSession } }) => {
      if (localSession) {
        // Validate the session against the server to catch revoked tokens
        const {
          data: { user: validatedUser },
          error,
        } = await supabase.auth.getUser();
        if (error || !validatedUser) {
          // Token is invalid/revoked — clear it
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setUser(null);
          setRole(null);
        } else {
          setSession(localSession);
          setUser(validatedUser);
          await Promise.all([fetchRole(validatedUser.id), fetchPurchases(validatedUser.id)]);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync profile demographics on sign-in / token refresh
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        syncProfile(session.user);
        fetchRole(session.user.id);
        fetchPurchases(session.user.id);

        // Check for pending redirect (set before OAuth flow or email confirmation)
        if (typeof window !== "undefined" && event === "SIGNED_IN") {
          const pendingRedirect = sessionStorage.getItem("auth_redirect");
          if (pendingRedirect) {
            sessionStorage.removeItem("auth_redirect");
            showToast("Welcome to The Puffer Labs!", "success");
            window.location.href = pendingRedirect;
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    // Revoke session on server, then clear locally as a safety net
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // If global revoke fails (network error), still clear local session
      await supabase.auth.signOut({ scope: "local" });
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setHasPurchases(false);
    window.location.href = "/";
  }

  return <AuthContext.Provider value={{ user, session, loading, role, hasPurchases, signOut }}>{children}</AuthContext.Provider>;
}
