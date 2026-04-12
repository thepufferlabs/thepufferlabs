"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export function useCourseOwnership(slug: string) {
  const { user, loading } = useAuth();
  const [isOwned, setIsOwned] = useState(false);
  const [ownershipResolved, setOwnershipResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOwnership() {
      if (loading) return;

      if (!user || !slug) {
        if (!cancelled) {
          setIsOwned(false);
          setOwnershipResolved(true);
        }
        return;
      }

      if (!cancelled) {
        setOwnershipResolved(false);
      }

      try {
        const { data: product } = await supabase.from("products").select("id").eq("slug", slug).single();

        if (!product) {
          if (!cancelled) {
            setIsOwned(false);
            setOwnershipResolved(true);
          }
          return;
        }

        const { data: entitlement } = await supabase.from("user_entitlements").select("id").eq("user_id", user.id).eq("product_id", product.id).eq("is_active", true).limit(1);

        if (!cancelled) {
          setIsOwned(!!(entitlement && entitlement.length > 0));
          setOwnershipResolved(true);
        }
      } catch {
        if (!cancelled) {
          setIsOwned(false);
          setOwnershipResolved(true);
        }
      }
    }

    void checkOwnership();

    return () => {
      cancelled = true;
    };
  }, [loading, slug, user]);

  return { isOwned, ownershipResolved };
}
