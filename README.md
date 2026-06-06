# UPREVI

Restaurant delivery revenue growth platform. One Next.js app serving four
surfaces by hostname:

| Surface   | Host (prod)            | Local                              | Route group   |
| --------- | ---------------------- | ---------------------------------- | ------------- |
| Marketing | `uprevi.com`           | `http://localhost:3000`            | `(marketing)` |
| Portal    | `app.uprevi.com`       | `http://app.localhost:3000`        | `(portal)`    |
| Admin     | `app.uprevi.com/admin` | `http://app.localhost:3000/admin`  | `(admin)`     |
| Order PWA | `order.uprevi.com/{slug}` | `http://order.localhost:3000/{slug}` | `(order)` |

> Browsers resolve `*.localhost` to 127.0.0.1 automatically, so the subdomain
> hosts above work in local dev with no `/etc/hosts` changes.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind v4 (CSS `@theme`; brand tokens in `src/lib/brand.ts`)
- Prisma 7 + Postgres (driver adapter `@prisma/adapter-pg`)
- Auth.js (NextAuth v5): credentials + optional magic-link
- Stripe subscription webhook, GoHighLevel back-office wrapper

Hostname routing lives in `src/proxy.ts` (Next 16 renamed Middleware → Proxy).

## Setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local
#   - set DATABASE_URL (Postgres / Neon)
#   - set AUTH_SECRET  (openssl rand -base64 32)

# 3. Database
npm run db:migrate      # prisma migrate dev (creates tables)
npm run db:seed         # demo data

# 4. Run
npm run dev
```

### Scripts

| Script             | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | Production build + type check        |
| `npm run db:migrate` | `prisma migrate dev`               |
| `npm run db:seed`  | Seed demo data                       |
| `npm run db:studio`| Prisma Studio                        |
| `npm run db:generate` | Regenerate Prisma client          |

## Test credentials

After `npm run db:seed`, all demo accounts share the password
**`uprevi-demo-2026`**:

| Email                | Role     | Notes                                            |
| -------------------- | -------- | ------------------------------------------------ |
| `owner@uprevi.com`   | OWNER    | Owns **Bella Cucina** (SPRINT) + **Sakura Ramen** (ACCELERATOR) |
| `admin@uprevi.com`   | ADMIN    | Sees `/admin`                                    |
| `staff@uprevi.com`   | STAFF    | Member of Bella Cucina                           |
| `customer@uprevi.com`| CUSTOMER | Diner account                                    |

### Try the tier gate

1. Sign in at `http://app.localhost:3000` as `owner@uprevi.com`.
2. On the dashboard, the **Smart promos** feature is **locked** for Bella Cucina
   (SPRINT tier) and links to `/upgrade?feature=smart_promos`.
3. Use the restaurant switcher to select **Sakura Ramen** (ACCELERATOR) — the
   feature unlocks. The same gate is enforced server-side (`requireEntitlement` /
   `assertEntitlement` in `src/lib/entitlements.ts`), not just hidden in the UI.

### Order PWA

Visit `http://order.localhost:3000/bella-cucina` to see the customer menu.

## Architecture notes

- **Entitlements spine:** `src/lib/tiers.ts` (pure, client-safe metadata) +
  `src/lib/entitlements.ts` (server enforcement: `getTier`, `requireEntitlement`).
  `<Gated>` (`src/components/Gated.tsx`) is cosmetic only.
- **Multi-tenant:** every business query filters by `restaurantId`; users reach
  restaurants via `RestaurantMembership`. The active restaurant is a cookie,
  resolved + validated in `src/lib/dal.ts`.
- **Graceful degradation:** Stripe (`/api/webhooks/stripe`) and GHL (`src/lib/ghl.ts`)
  no-op when their keys are absent. Magic-link activates only with `RESEND_API_KEY`.

> Phase 1 (foundation) is implemented. Later phases (real Stripe Checkout, AI
> features, full ordering PWA with cart/checkout) are marked `// TODO(uprevi:)`.
