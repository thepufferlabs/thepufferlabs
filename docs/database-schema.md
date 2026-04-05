# The Puffer Labs — Database Schema

## Architecture Overview

The schema uses a **two-tier architecture**:

- **Foundation layer** (Domain 1) — profiles, auth triggers, audit log. **PROTECTED** — never dropped by cleanup. Without this, OAuth signup breaks.
- **Feature layers** (Domains 2-5) — products, licensing, payments, courses. Can be safely dropped and recreated without affecting auth.

```mermaid
graph TB
    subgraph "FOUNDATION (Protected — never dropped by cleanup)"
        AU[auth.users] --> P[profiles]
        P --> UI[user_identities]
        P --> AL[audit_log]
    end

    subgraph "Domain 2: Product Catalog"
        PR[products] --> PC[product_content]
        PR -.-> SB[(Storage Buckets)]
    end

    subgraph "Domain 3: Licensing"
        PL[plans] --> PP[plan_products]
        PP --> PR
        BU[bundles] --> BP[bundle_products]
        BP --> PR
        AU --> SUB[subscriptions]
        PL --> SUB
        AU --> UE[user_entitlements]
        PR --> UE
    end

    subgraph "Domain 4: Payments"
        AU --> OR[orders]
        PR --> OR
        BU --> OR
        PL --> OR
        CO[coupons] --> OR
        OR --> RE[refunds]
    end

    subgraph "Domain 5: Online Courses"
        PR --> CD[course_details]
        AU --> UCP[user_course_progress]
        PR --> UCP
        AU --> UBK[user_bookmarks]
        PR --> UBK
    end

    OR -.->|"trigger: on_order_paid"| UE
    SUB -.->|"trigger: on_subscription_change"| UE
    UE -.->|"user_has_access()"| PC

    style AU fill:#4A90D9,color:#fff
    style P fill:#4A90D9,color:#fff
    style PR fill:#2D9CDB,color:#fff
    style UE fill:#F2994A,color:#fff
    style OR fill:#27AE60,color:#fff
    style CD fill:#9B51E0,color:#fff
```

---

## Domain 1: Foundation (PROTECTED)

Migration: `20260405_001_foundation.sql`

The bedrock of the platform. Extends Supabase `auth.users` with profiles, federated identity links, and an immutable audit trail. Includes auth triggers that auto-create profiles on signup and track logins.

**This layer is never dropped by the standard cleanup.** Dropping it breaks OAuth signup with "Database error granting user". Only the nuclear cleanup (`000_cleanup_nuclear.sql`) touches this layer.

```mermaid
erDiagram
    auth_users ||--|| profiles : "extends"
    profiles ||--o{ user_identities : "has"
    profiles ||--o{ audit_log : "generates"

    profiles {
        uuid id PK "FK → auth.users"
        text email "NOT NULL"
        text full_name
        text display_name
        text avatar_url
        text bio
        text phone
        identity_provider primary_provider "DEFAULT email"
        user_role role "DEFAULT user"
        user_status status "DEFAULT active"
        jsonb preferences
        jsonb provider_meta
        timestamptz email_verified_at
        timestamptz last_sign_in_at
        timestamptz created_at
        timestamptz updated_at
    }

    user_identities {
        uuid id PK
        uuid user_id FK "→ profiles"
        identity_provider provider "NOT NULL"
        text provider_uid "NOT NULL, UNIQUE(provider, provider_uid)"
        text provider_email
        jsonb provider_data
        timestamptz linked_at
    }

    audit_log {
        uuid id PK
        uuid user_id FK "→ profiles, ON DELETE SET NULL"
        audit_action action "NOT NULL"
        inet ip_address
        text user_agent
        jsonb metadata
        timestamptz created_at
    }
```

### Enums

| Type | Values |
|------|--------|
| `user_role` | `user`, `premium`, `admin`, `super_admin` |
| `user_status` | `active`, `inactive`, `suspended`, `banned` |
| `identity_provider` | `email`, `github`, `google` |
| `audit_action` | `login`, `logout`, `register`, `password_reset`, `profile_update`, `role_change`, `subscription_change`, `premium_access`, `account_suspended`, `account_reactivated`, `purchase`, `refund` |

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| profiles | Users read own profile | `auth.uid() = id` |
| profiles | Users update own profile | `auth.uid() = id` |
| user_identities | Users read own identities | `auth.uid() = user_id` |
| audit_log | Users read own audit log | `auth.uid() = user_id` |

---

## Domain 2: Product Catalog

Migration: `20260405_002_product_catalog.sql`

Generic product system that supports courses, data services, tools, and bundles. Content files are stored in Supabase Storage, metadata in the database.

```mermaid
erDiagram
    products ||--o{ product_content : "has"
    products {
        uuid id PK
        text slug "UNIQUE NOT NULL"
        product_type product_type "DEFAULT course"
        product_status status "DEFAULT draft"
        text title "NOT NULL"
        text short_description
        text long_description
        text category
        text level
        text_arr tags
        text banner_path
        text thumbnail_path
        int price_cents "DEFAULT 0"
        text currency "DEFAULT INR"
        int compare_price_cents
        text github_owner
        text github_repo
        text github_branch
        text storage_bucket
        text storage_prefix
        int free_content_count
        int premium_content_count
        jsonb metadata
        text version "DEFAULT 1.0.0"
        timestamptz last_synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    product_content {
        uuid id PK
        uuid product_id FK "→ products"
        text content_key "UNIQUE(product_id, content_key)"
        text title "NOT NULL"
        text section
        access_level access_level "DEFAULT free"
        text content_type "DEFAULT doc"
        text storage_path "NOT NULL"
        text_arr tags
        int sort_order
        boolean is_published
        jsonb metadata
        timestamptz created_at
    }
```

### Enums

| Type | Values |
|------|--------|
| `product_type` | `course`, `data_service`, `tool`, `bundle` |
| `product_status` | `draft`, `published`, `archived` |
| `access_level` | `free`, `premium` |

### Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `free-content` | Yes | Free docs, blogs, code samples, metadata JSONs |
| `premium-content` | No | Premium docs, blogs, code — RLS-gated by entitlements |
| `course-assets` | Yes | Banners, thumbnails, preview images |

### RLS Policies

| Table/Bucket | Policy | Rule |
|--------------|--------|------|
| products | Published products are public | `status = 'published'` |
| free-content | Free content is public | Public read |
| course-assets | Course assets are public | Public read |
| All buckets | Service role writes/updates/deletes | `auth.role() = 'service_role'` |

---

## Domain 3: Licensing, Subscriptions & Entitlements

Migration: `20260405_003_licensing.sql`

The access control layer. `user_entitlements` is the **single source of truth** for "can user X access product Y?"

```mermaid
erDiagram
    plans ||--o{ plan_products : "unlocks"
    plan_products }o--|| products : "references"
    bundles ||--o{ bundle_products : "contains"
    bundle_products }o--|| products : "references"
    plans ||--o{ subscriptions : "has"
    auth_users ||--o{ subscriptions : "subscribes"
    auth_users ||--o{ user_entitlements : "granted"
    products ||--o{ user_entitlements : "accessed"

    plans {
        uuid id PK
        text slug "UNIQUE NOT NULL"
        text name "NOT NULL"
        text description
        int price_cents "NOT NULL"
        text currency "DEFAULT INR"
        subscription_interval interval "NOT NULL"
        int trial_days "DEFAULT 0"
        boolean is_active "DEFAULT true"
        text_arr features
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    bundles {
        uuid id PK
        text slug "UNIQUE NOT NULL"
        text name "NOT NULL"
        text description
        int price_cents "NOT NULL"
        text currency "DEFAULT INR"
        int compare_price_cents
        boolean is_active "DEFAULT true"
        timestamptz valid_from
        timestamptz valid_until "flash sales"
        jsonb metadata
        timestamptz created_at
    }

    subscriptions {
        uuid id PK
        uuid user_id FK "→ auth.users"
        uuid plan_id FK "→ plans"
        uuid order_id FK "→ orders"
        subscription_status status "DEFAULT active"
        timestamptz current_period_start
        timestamptz current_period_end
        timestamptz trial_start
        timestamptz trial_end
        timestamptz canceled_at
        text cancel_reason
        boolean auto_renew "DEFAULT true"
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    user_entitlements {
        uuid id PK
        uuid user_id FK "→ auth.users"
        uuid product_id FK "→ products"
        entitlement_source source "NOT NULL"
        uuid source_id "order_id or subscription_id"
        timestamptz granted_at
        timestamptz expires_at "NULL = lifetime"
        boolean is_active "DEFAULT true"
        jsonb metadata
    }
```

### Enums

| Type | Values |
|------|--------|
| `subscription_status` | `trialing`, `active`, `past_due`, `canceled`, `expired` |
| `subscription_interval` | `month`, `quarter`, `year`, `lifetime` |
| `entitlement_source` | `purchase`, `subscription`, `coupon`, `manual`, `trial` |

### Access Control Functions

```sql
-- Check if user has active entitlement for a product
user_has_access(user_id uuid, product_id uuid) → boolean

-- Check if content is free OR user has access to its product
user_can_read_content(user_id uuid, content_id uuid) → boolean
```

### Triggers

| Trigger | Event | Action |
|---------|-------|--------|
| `trg_subscription_change` | subscription status changes | Grants entitlements for all plan products when `active`, revokes when `canceled`/`expired` |

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| plans | Plans are public | `is_active = true` |
| bundles | Active bundles are public | `is_active = true` |
| plan_products | Plan products are public | Always visible |
| bundle_products | Bundle products are public | Always visible |
| subscriptions | Users see own subs | `auth.uid() = user_id` |
| user_entitlements | Users see own entitlements | `auth.uid() = user_id` |
| product_content | Free public, premium gated | `access_level = 'free' OR user_has_access()` |
| premium-content bucket | Premium storage gated | Matches product slug from folder path against user entitlements |

---

## Domain 4: Payment Gateway & Order Management

Migration: `20260405_004_payments.sql`

Provider-agnostic payment system supporting Razorpay (India) and Stripe (international). Full order lifecycle with refund tracking.

```mermaid
erDiagram
    auth_users ||--o{ orders : "places"
    products ||--o{ orders : "purchased via"
    bundles ||--o{ orders : "purchased via"
    plans ||--o{ orders : "subscribed via"
    coupons ||--o{ orders : "applied to"
    orders ||--o{ refunds : "refunded"

    coupons {
        uuid id PK
        text code "UNIQUE NOT NULL"
        coupon_type coupon_type "NOT NULL"
        int discount_value "NOT NULL"
        text currency "DEFAULT INR"
        int max_uses "NULL = unlimited"
        int used_count "DEFAULT 0"
        int max_uses_per_user "DEFAULT 1"
        int min_purchase_cents "DEFAULT 0"
        uuid applies_to_product_id FK
        uuid applies_to_plan_id FK
        uuid applies_to_bundle_id FK
        timestamptz valid_from
        timestamptz valid_until
        boolean is_active "DEFAULT true"
        jsonb metadata
        timestamptz created_at
    }

    orders {
        uuid id PK
        text order_number "UNIQUE, auto-generated"
        uuid user_id FK "→ auth.users"
        payment_status status "DEFAULT pending"
        uuid product_id FK
        uuid bundle_id FK
        uuid plan_id FK
        uuid coupon_id FK
        int subtotal_cents "NOT NULL"
        int discount_cents "DEFAULT 0"
        int tax_cents "DEFAULT 0"
        int total_cents "NOT NULL"
        text currency "DEFAULT INR"
        payment_provider provider "NOT NULL"
        text provider_order_id
        text provider_payment_id
        text provider_signature
        jsonb provider_data
        text receipt_url
        text notes
        timestamptz paid_at
        timestamptz canceled_at
        text cancel_reason
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    refunds {
        uuid id PK
        uuid order_id FK "→ orders"
        uuid user_id FK "→ auth.users"
        int amount_cents "NOT NULL"
        text currency "DEFAULT INR"
        text reason
        text status "pending, processed, failed"
        payment_provider provider
        text provider_refund_id
        jsonb provider_data
        timestamptz processed_at
        timestamptz created_at
    }
```

### Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending : Order created
    pending --> authorized : Payment authorized
    pending --> failed : Payment failed
    pending --> canceled : User/system cancels
    authorized --> paid : Payment captured
    authorized --> canceled : Auth expired
    paid --> refunded : Full refund
    paid --> disputed : Chargeback
    refunded --> [*]
    canceled --> [*]
    failed --> [*]
    disputed --> refunded : Resolved
```

### Enums

| Type | Values |
|------|--------|
| `payment_provider` | `razorpay`, `stripe`, `manual`, `coupon` |
| `payment_status` | `pending`, `authorized`, `paid`, `failed`, `refunded`, `disputed`, `canceled` |
| `coupon_type` | `percent`, `fixed_amount` |

### Triggers

| Trigger | Event | Action |
|---------|-------|--------|
| `trg_order_status` | order status changes to `paid` | Grants 1-year entitlements for product/bundle, updates coupon usage, logs to audit |
| `trg_order_status` | order status changes to `refunded` | Revokes entitlements, logs to audit |
| `trg_order_status` | order status changes to `canceled` | Sets `canceled_at` timestamp |

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| coupons | Valid coupons are public | `is_active AND valid AND under max_uses` |
| orders | Users see own orders | `auth.uid() = user_id` |
| orders | Users create orders | `auth.uid() = user_id` |
| refunds | Users see own refunds | `auth.uid() = user_id` |

---

## Domain 5: Online Courses

Migration: `20260405_005_online_courses.sql`

Course-specific extensions on top of the generic product catalog. Stores sidebar/TOC as JSONB and tracks user learning progress.

```mermaid
erDiagram
    products ||--|| course_details : "extends"
    auth_users ||--o{ user_course_progress : "tracks"
    products ||--o{ user_course_progress : "for"
    auth_users ||--o{ user_bookmarks : "saves"
    products ||--o{ user_bookmarks : "for"

    course_details {
        uuid product_id PK "FK → products"
        jsonb sidebar_data
        jsonb toc_data
        int blog_count "DEFAULT 0"
        int code_sample_count "DEFAULT 0"
        int cheatsheet_count "DEFAULT 0"
        boolean has_interview_prep "DEFAULT false"
        numeric estimated_hours
        text_arr prerequisites
        text_arr learning_outcomes
        timestamptz last_content_update
        timestamptz created_at
        timestamptz updated_at
    }

    user_course_progress {
        uuid id PK
        uuid user_id FK "→ auth.users"
        uuid product_id FK "→ products"
        text content_key "UNIQUE(user_id, product_id, content_key)"
        timestamptz completed_at
        int time_spent_seconds "DEFAULT 0"
    }

    user_bookmarks {
        uuid id PK
        uuid user_id FK "→ auth.users"
        uuid product_id FK "→ products"
        text content_key "UNIQUE(user_id, product_id, content_key)"
        text note
        timestamptz created_at
    }
```

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| course_details | Course details are public | Always visible (catalog info) |
| user_course_progress | Users see/track/update own progress | `auth.uid() = user_id` |
| user_bookmarks | Users manage own bookmarks | `auth.uid() = user_id` |

---

## Entitlement Flow

The system auto-manages access through database triggers. No application code needed for granting/revoking access.

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js App
    participant PG as Payment Gateway
    participant DB as Supabase DB
    participant S as Supabase Storage

    U->>App: Purchase course
    App->>PG: Create order (Razorpay/Stripe)
    App->>DB: INSERT order (status: pending)
    PG->>App: Payment success callback
    App->>DB: UPDATE order SET status = 'paid'

    Note over DB: trigger: on_order_paid()
    DB->>DB: INSERT user_entitlement (1 year)
    DB->>DB: UPDATE coupon used_count
    DB->>DB: INSERT audit_log

    U->>App: Access premium content
    App->>DB: SELECT product_content (RLS checks entitlement)
    DB-->>App: Content metadata
    App->>S: Fetch from premium-content bucket (RLS checks entitlement)
    S-->>App: Markdown file
    App-->>U: Rendered content
```

### Subscription Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js App
    participant DB as Supabase DB

    U->>App: Subscribe to plan
    App->>DB: INSERT subscription (status: active)

    Note over DB: trigger: on_subscription_change()
    DB->>DB: INSERT entitlements for all plan products

    Note over DB: When subscription expires
    App->>DB: UPDATE subscription SET status = 'expired'

    Note over DB: trigger: on_subscription_change()
    DB->>DB: UPDATE entitlements SET is_active = false
```

---

## Content Sync Pipeline

GitHub Actions sync content from course repos to Supabase on every push.

```mermaid
flowchart LR
    subgraph "Course Repo (GitHub)"
        MJ[meta.json]
        FD[docs/free/*.md]
        PD[docs/premium/*.md]
        AS[assets/*]
        CI[content-index.json]
        SJ[sidebar.json]
        TJ[toc.json]
    end

    subgraph "GitHub Actions"
        WF[sync-course-content.yml]
    end

    subgraph "Supabase Storage"
        FB[(free-content bucket)]
        PB[(premium-content bucket)]
        AB[(course-assets bucket)]
    end

    subgraph "Supabase DB"
        PT[products table]
        PCT[product_content table]
        CDT[course_details table]
    end

    FD --> WF
    PD --> WF
    AS --> WF
    MJ --> WF
    CI --> WF
    SJ --> WF
    TJ --> WF

    WF -->|free docs, blogs, code| FB
    WF -->|premium docs, blogs, code| PB
    WF -->|banners, thumbnails| AB
    WF -->|meta.json fields| PT
    WF -->|content-index.json| PCT
    WF -->|sidebar + toc JSON| CDT
```

---

## Migration Files

| File | Layer | What it creates |
|------|-------|-----------------|
| `20260405_000_cleanup.sql` | Feature | Drops domains 2-5 only. **Auth stays intact.** |
| `20260405_000_cleanup_nuclear.sql` | ALL | Drops everything including foundation. Auth breaks. |
| `20260405_001_foundation.sql` | Foundation | `profiles`, `user_identities`, `audit_log`, auth triggers, `update_updated_at()` |
| `20260405_002_product_catalog.sql` | Feature | `products`, `product_content` + storage buckets |
| `20260405_003_licensing.sql` | Feature | `plans`, `plan_products`, `bundles`, `bundle_products`, `subscriptions`, `user_entitlements` |
| `20260405_004_payments.sql` | Feature | `coupons`, `orders`, `refunds` |
| `20260405_005_online_courses.sql` | Feature | `course_details`, `user_course_progress`, `user_bookmarks` |

### Running Migrations

```bash
# Fresh setup (run in order)
supabase db query --linked --file supabase/migrations/20260405_001_foundation.sql
supabase db query --linked --file supabase/migrations/20260405_002_product_catalog.sql
supabase db query --linked --file supabase/migrations/20260405_003_licensing.sql
supabase db query --linked --file supabase/migrations/20260405_004_payments.sql
supabase db query --linked --file supabase/migrations/20260405_005_online_courses.sql
```

### Cleanup Modes

| Mode | Scope | Auth works after? | Confirmation |
|------|-------|-------------------|-------------|
| `features-only` | Drops domains 2-5 tables | Yes | Type `DELETE` |
| `features-and-data` | Drops domains 2-5 + truncates user data | Yes (schema intact, users cleared) | Type `DELETE` |
| `nuclear` | Drops ALL tables, functions, enums, triggers | No — must re-run 001-005 | Type `NUCLEAR DELETE` |

```bash
# Reset products only (safe — auth keeps working)
supabase db query --linked --file supabase/migrations/20260405_000_cleanup.sql
# Then re-run 002-005

# Full nuclear reset (breaks auth until 001 is re-run)
supabase db query --linked --file supabase/migrations/20260405_000_cleanup_nuclear.sql
# Then re-run 001-005
```

### GitHub Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `supabase-migrate.yml` | Push to `supabase/migrations/` or manual | Runs pending migrations in order, skips cleanup files |
| `supabase-clean.yml` | Manual only | 3 cleanup modes with confirmation |
| `sync-course-content.yml` | Called by course repos | Syncs content to storage + upserts DB records |

---

## Schema Statistics

| Metric | Count |
|--------|-------|
| Tables | 16 |
| Enum types | 12 |
| Functions | 7 |
| Triggers | 9 |
| RLS policies | 33 |
| Storage buckets | 3 |
| Foreign keys | 28 |
