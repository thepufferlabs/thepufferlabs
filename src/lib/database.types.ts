/** Supabase database types — mirrors the schema in scripts/supabase-schema.sql */

export type UserRole = "user" | "premium" | "admin" | "super_admin";
export type UserStatus = "active" | "inactive" | "suspended" | "banned";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type IdentityProvider = "email" | "github" | "google";
export type AuditAction =
  | "login"
  | "logout"
  | "register"
  | "password_reset"
  | "profile_update"
  | "role_change"
  | "subscription_change"
  | "premium_access"
  | "account_suspended"
  | "account_reactivated";

export type ProductType = "course" | "data_service" | "tool" | "bundle";
export type ProductStatus = "draft" | "published" | "archived";
export type AccessLevel = "free" | "premium";
export type CouponType = "percent" | "fixed_amount";
export type PaymentProvider = "razorpay" | "stripe" | "manual" | "coupon";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded" | "disputed" | "canceled";
export type SubscriptionInterval = "month" | "quarter" | "year" | "lifetime";
export type EntitlementSource = "purchase" | "subscription" | "coupon" | "manual" | "trial";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone: string | null;
          primary_provider: IdentityProvider;
          role: UserRole;
          status: UserStatus;
          preferences: Json;
          provider_meta: Json;
          email_verified_at: string | null;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          primary_provider?: IdentityProvider;
          role?: UserRole;
          status?: UserStatus;
          preferences?: Json;
          provider_meta?: Json;
          email_verified_at?: string | null;
          last_sign_in_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          preferences?: Json;
        };
      };
      user_identities: {
        Row: {
          id: string;
          user_id: string;
          provider: IdentityProvider;
          provider_uid: string;
          provider_email: string | null;
          provider_data: Json;
          linked_at: string;
        };
        Insert: {
          user_id: string;
          provider: IdentityProvider;
          provider_uid: string;
          provider_email?: string | null;
          provider_data?: Json;
        };
        Update: {
          provider_email?: string | null;
          provider_data?: Json;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          gateway: string | null;
          gateway_subscription_id: string | null;
          gateway_customer_id: string | null;
          amount_cents: number | null;
          currency: string;
          interval: "month" | "year" | "lifetime";
          trial_starts_at: string | null;
          trial_ends_at: string | null;
          current_period_start: string;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          gateway?: string | null;
          gateway_subscription_id?: string | null;
          gateway_customer_id?: string | null;
          amount_cents?: number | null;
          currency?: string;
          interval?: "month" | "year" | "lifetime";
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          status?: SubscriptionStatus;
          gateway_subscription_id?: string | null;
          gateway_customer_id?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: AuditAction;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action: AuditAction;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
        };
        Update: never;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          product_type: ProductType;
          status: ProductStatus;
          title: string;
          short_description: string | null;
          long_description: string | null;
          category: string | null;
          level: string | null;
          tags: string[];
          banner_path: string | null;
          thumbnail_path: string | null;
          price_cents: number;
          currency: string;
          compare_price_cents: number | null;
          github_owner: string | null;
          github_repo: string | null;
          github_branch: string | null;
          storage_bucket: string | null;
          storage_prefix: string | null;
          free_content_count: number;
          premium_content_count: number;
          metadata: Json;
          version: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          product_type?: ProductType;
          status?: ProductStatus;
          title: string;
          short_description?: string | null;
          long_description?: string | null;
          category?: string | null;
          level?: string | null;
          tags?: string[];
          banner_path?: string | null;
          thumbnail_path?: string | null;
          price_cents?: number;
          currency?: string;
          compare_price_cents?: number | null;
          github_owner?: string | null;
          github_repo?: string | null;
          github_branch?: string | null;
          storage_bucket?: string | null;
          storage_prefix?: string | null;
          free_content_count?: number;
          premium_content_count?: number;
          metadata?: Json;
          version?: string | null;
        };
        Update: {
          slug?: string;
          product_type?: ProductType;
          status?: ProductStatus;
          title?: string;
          short_description?: string | null;
          long_description?: string | null;
          category?: string | null;
          level?: string | null;
          tags?: string[];
          banner_path?: string | null;
          thumbnail_path?: string | null;
          price_cents?: number;
          currency?: string;
          compare_price_cents?: number | null;
          metadata?: Json;
          version?: string | null;
        };
      };
      product_content: {
        Row: {
          id: string;
          product_id: string;
          content_key: string;
          title: string;
          section: string | null;
          access_level: AccessLevel;
          content_type: string;
          storage_path: string;
          tags: string[];
          sort_order: number;
          is_published: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          product_id: string;
          content_key: string;
          title: string;
          section?: string | null;
          access_level?: AccessLevel;
          content_type?: string;
          storage_path: string;
          tags?: string[];
          sort_order?: number;
          is_published?: boolean;
          metadata?: Json;
        };
        Update: {
          title?: string;
          section?: string | null;
          access_level?: AccessLevel;
          content_type?: string;
          storage_path?: string;
          tags?: string[];
          sort_order?: number;
          is_published?: boolean;
          metadata?: Json;
        };
      };
      course_details: {
        Row: {
          product_id: string;
          sidebar_data: Json;
          toc_data: Json;
          blog_count: number;
          code_sample_count: number;
          cheatsheet_count: number;
          has_interview_prep: boolean;
          estimated_hours: number | null;
          prerequisites: string[];
          learning_outcomes: string[];
          last_content_update: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          sidebar_data?: Json;
          toc_data?: Json;
          blog_count?: number;
          code_sample_count?: number;
          cheatsheet_count?: number;
          has_interview_prep?: boolean;
          estimated_hours?: number | null;
          prerequisites?: string[];
          learning_outcomes?: string[];
        };
        Update: {
          sidebar_data?: Json;
          toc_data?: Json;
          blog_count?: number;
          code_sample_count?: number;
          cheatsheet_count?: number;
          has_interview_prep?: boolean;
          estimated_hours?: number | null;
          prerequisites?: string[];
          learning_outcomes?: string[];
        };
      };
      user_course_progress: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          content_key: string;
          completed_at: string;
          time_spent_seconds: number;
        };
        Insert: {
          user_id: string;
          product_id: string;
          content_key: string;
          time_spent_seconds?: number;
        };
        Update: {
          time_spent_seconds?: number;
        };
      };
      user_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          content_key: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          content_key: string;
          note?: string | null;
        };
        Update: {
          note?: string | null;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          coupon_type: CouponType;
          discount_value: number;
          currency: string;
          max_uses: number | null;
          used_count: number;
          max_uses_per_user: number;
          min_purchase_cents: number;
          applies_to_product_id: string | null;
          applies_to_plan_id: string | null;
          applies_to_bundle_id: string | null;
          valid_from: string;
          valid_until: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          code: string;
          coupon_type: CouponType;
          discount_value: number;
          currency?: string;
          max_uses?: number | null;
          max_uses_per_user?: number;
          min_purchase_cents?: number;
          applies_to_product_id?: string | null;
          applies_to_plan_id?: string | null;
          applies_to_bundle_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          is_active?: boolean;
          metadata?: Json;
        };
        Update: {
          code?: string;
          coupon_type?: CouponType;
          discount_value?: number;
          currency?: string;
          max_uses?: number | null;
          max_uses_per_user?: number;
          min_purchase_cents?: number;
          applies_to_product_id?: string | null;
          applies_to_plan_id?: string | null;
          applies_to_bundle_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          is_active?: boolean;
          metadata?: Json;
        };
      };
      bundles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          compare_price_cents: number | null;
          is_active: boolean;
          valid_from: string | null;
          valid_until: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          compare_price_cents?: number | null;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          metadata?: Json;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          compare_price_cents?: number | null;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          metadata?: Json;
        };
      };
      bundle_products: {
        Row: {
          bundle_id: string;
          product_id: string;
        };
        Insert: {
          bundle_id: string;
          product_id: string;
        };
        Update: never;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          status: PaymentStatus;
          product_id: string | null;
          bundle_id: string | null;
          plan_id: string | null;
          coupon_id: string | null;
          subtotal_cents: number;
          discount_cents: number;
          tax_cents: number;
          total_cents: number;
          currency: string;
          provider: PaymentProvider;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          provider_signature: string | null;
          provider_data: Json;
          receipt_url: string | null;
          notes: string | null;
          paid_at: string | null;
          canceled_at: string | null;
          cancel_reason: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: PaymentStatus;
          product_id?: string | null;
          bundle_id?: string | null;
          plan_id?: string | null;
          coupon_id?: string | null;
          subtotal_cents: number;
          discount_cents?: number;
          tax_cents?: number;
          total_cents: number;
          currency?: string;
          provider: PaymentProvider;
          provider_order_id?: string | null;
          notes?: string | null;
          metadata?: Json;
        };
        Update: {
          status?: PaymentStatus;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          provider_data?: Json;
          receipt_url?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          canceled_at?: string | null;
          cancel_reason?: string | null;
          metadata?: Json;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          subscription_id: string | null;
          gateway: string | null;
          gateway_order_id: string | null;
          gateway_payment_id: string | null;
          gateway_signature: string | null;
          amount_cents: number;
          currency: string;
          status: "pending" | "paid" | "failed" | "refunded";
          receipt_url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id?: string | null;
          subscription_id?: string | null;
          gateway?: string | null;
          gateway_order_id?: string | null;
          gateway_payment_id?: string | null;
          gateway_signature?: string | null;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded";
          receipt_url?: string | null;
          metadata?: Json;
        };
        Update: {
          gateway_payment_id?: string | null;
          gateway_signature?: string | null;
          status?: "pending" | "paid" | "failed" | "refunded";
          receipt_url?: string | null;
          metadata?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_premium_access: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      subscription_status: SubscriptionStatus;
      identity_provider: IdentityProvider;
      audit_action: AuditAction;
      product_type: ProductType;
      product_status: ProductStatus;
      access_level: AccessLevel;
      coupon_type: CouponType;
      payment_provider: PaymentProvider;
      payment_status: PaymentStatus;
      subscription_interval: SubscriptionInterval;
      entitlement_source: EntitlementSource;
    };
  };
}
