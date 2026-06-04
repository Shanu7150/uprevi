# UPREVI — Master Build Spec (Claude Code)

You are building the UPREVI platform. This document is the single source of truth for everything that gets built on our side. Read it fully before writing code. Build in the phase order in §11. Ask before deviating from the architecture in §2.

---

## 0. How to use this doc

- This is a **Next.js (App Router) full-stack TypeScript** project. One app serves the marketing site, the client portal, the customer ordering experience, and the internal admin — separated by route groups, not separate repos.
- When a task is ambiguous, default to the simplest thing that satisfies the spec, ship it behind the tier/entitlement system (§6), and leave a `// TODO(uprevi):` note.
- Never hardcode secrets. Everything sensitive goes in `.env` (see §3).
- The brand is fixed (§9). Do not invent colors, fonts, or logos.

---

## 1. What we are building and why

UPREVI is a restaurant growth company. The business runs in two phases:

1. **90-Day Sprint (entry offer / customer acquisition):** A guaranteed engagement — we grow a restaurant's DoorDash + UberEats revenue by at least 20% in 90 days, or full refund plus $100 cash. This is the front door. It is intentionally low-margin; its job is to win the client and prove value.

2. **Ongoing Partnership (the real business / MRR):** After the sprint, the client converts to a monthly tier and UPREVI becomes their full restaurant growth partner. This recurring revenue is the company. The platform we are building is the infrastructure for this partnership.

**Positioning:** We do not sell "software." We sell a growth partnership backed by software, a human team, and a guarantee. The platform must make that partnership *visible* every time a client logs in.

**Our competitor is Owner.com.** They raised $178M and built restaurant software. We beat them on three things they structurally cannot match: (1) we optimize the delivery platforms they ignore, (2) we guarantee ROI, (3) we pair the software with a human team. The platform's job is to close the product gaps where Owner.com is ahead while keeping everything we already win on.

### The North Star — features that beat Owner.com
- Unified DoorDash + UberEats channel intelligence (Owner.com ignores delivery platforms entirely)
- Predictive revenue dashboard using weather, local events, and game-day data (Owner.com only shows what already happened)
- Smart promotion engine that auto-drafts promos tied to those predictions, owner-approved with one tap
- Smart AI upsell engine (frequently-bought-together, learns per restaurant)
- AI review engine (sentiment analysis, pattern detection, drafted responses)
- Loyalty/rewards with real CLV tracking and automated customer segmentation
- Branded ordering PWA (matches Owner.com's native app experience without an App Store build)
- Zero transaction fees (Owner.com charges 5% per order)

---

## 2. Architecture

**Custom platform is the front door. GHL is invisible back-office plumbing.**

- **Marketing site** lives at `uprevi.com` — public, for prospects. Captures leads and pushes them to GHL.
- **Client portal** lives at `app.uprevi.com` — restaurant owners log in here. Fully UPREVI-branded. This is where the partnership is managed.
- **Customer ordering** lives at `order.uprevi.com/{restaurant-slug}` (or the restaurant's custom domain) — the diner-facing PWA per restaurant.
- **Internal admin** lives at `app.uprevi.com/admin` — the UPREVI team manages clients, sprints, and tasks.

**GoHighLevel** is used only for the commodity layer and is never shown to clients directly:
- Internal sales CRM + pipeline for incoming leads (the UPREVI team's tool)
- Email/SMS sending infrastructure (called via API)
- Calendar/booking for the discovery/audit call
We integrate with GHL via its API + webhooks (§8). We do NOT rebuild CRM, messaging, or calendar — we rent those from GHL.

**Everything the client touches is our custom platform.** GHL stays behind the curtain.

### Route structure (App Router)
```
app/
  (marketing)/            -> uprevi.com  (landing, pricing, results, about)
  (portal)/               -> app.uprevi.com  (authenticated client portal)
    dashboard/
    orders/
    menu/
    promotions/
    reviews/
    customers/
    loyalty/
    tasks/
    settings/
    upgrade/
  (admin)/admin/          -> internal UPREVI team
  (order)/order/[slug]/   -> customer ordering PWA
  api/                    -> route handlers (REST + webhooks)
```
Use middleware to route by hostname/subdomain to the correct route group.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript, React Server Components |
| Styling | Tailwind CSS (brand tokens in §9) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Auth.js (NextAuth) — email/password + magic link; role-based (OWNER, STAFF, ADMIN, CUSTOMER) |
| Payments | Stripe — **Connect** for restaurant payouts (diner orders) AND **Billing/Subscriptions** for UPREVI monthly tiers |
| AI | Anthropic API (`claude-sonnet`) — review responses, promo drafting, upsell suggestions, content |
| Real-time | WebSocket / server-sent events for live order notifications |
| Weather | Open-Meteo or OpenWeatherMap API |
| Events / games | SportsDB / a sports schedule API + a local events feed (start with manual + sports, expand later) |
| Email/SMS | Via GHL API (do not integrate Twilio/SendGrid directly unless GHL can't cover it) |
| File/images | Cloudflare R2 or S3 + Sharp for menu photos |
| Deploy | Vercel (app) + managed Postgres (Neon/Supabase/RDS) |

### Required env vars
```
DATABASE_URL=
AUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
ANTHROPIC_API_KEY=
WEATHER_API_KEY=
SPORTS_API_KEY=
GHL_API_KEY=
GHL_LOCATION_ID=
GHL_WEBHOOK_SECRET=
R2_ACCESS_KEY= / R2_SECRET= / R2_BUCKET=
NEXT_PUBLIC_APP_URL=
```
Every feature that depends on an optional key (AI, weather, sports, GHL) must **degrade gracefully** when the key is missing — the rest of the app keeps working.

---

## 4. The four surfaces (what to build)

### 4.1 Marketing site — `uprevi.com`
Already designed; rebuild in Next.js from the approved landing page. Sections: hero (dollar-led: "We add real revenue to your DoorDash & UberEats — guaranteed"), trust strip, results (real proof points: ~$9K→$20K/mo; near-dormant → $2K/platform), how-it-works (3 steps), "we optimize the channels you already make money on" split, **"what happens after the sprint" partnership/tiers section**, the guarantee block, final CTA. Primary CTA = **Book a Free Audit** → lead form → GHL pipeline (§8). Lead with dollars, never percentages.

### 4.2 Client portal — `app.uprevi.com` (restaurant owner accounts)
The heart of the product. A restaurant owner logs in and manages their store(s) AND sees the partnership at work. One owner can own multiple restaurants (multi-location) and switch between them.

Pages (each gated by tier per §6):
- **Dashboard** — revenue (direct + DoorDash + UberEats unified), active orders, AI insights, sprint progress ("Day 47 of 90"), predictive forecast (tier-gated).
- **Orders** — live order feed + status state machine (PENDING→CONFIRMED→PREPARING→READY→OUT_FOR_DELIVERY→DELIVERED), real-time notifications.
- **Menu** — full CRUD: categories, items, modifiers, photos, pricing.
- **Promotions** — manual + AI smart promos (weather/event/game triggered), one-tap owner approval.
- **Reviews** — aggregated reviews, sentiment, AI-drafted responses (approve/edit/regenerate), pattern alerts.
- **Customers** — CRM with CLV, automated segments (Champions / Loyal / At-Risk / New), win-back triggers.
- **Loyalty** — points config, tiers, rewards, referral program.
- **Tasks** — the collaboration layer (§7.8): what UPREVI's team is doing, items awaiting owner approval, sprint milestones.
- **Settings** — restaurant profile, hours, platforms, payouts (Stripe Connect onboarding), team members.
- **Upgrade** — shows current tier and locked features with upsell (§6).

### 4.3 Customer ordering PWA — `order.uprevi.com/{slug}`
Installable PWA, mobile-first. Branded per restaurant. Menu browse + search + categories, item detail, cart with AI upsell suggestions, Stripe checkout (Connect → pays restaurant directly), pickup/delivery/dine-in, order throttling, scheduled orders, promo codes, live order tracker, loyalty points earned. Saved customer profiles.

### 4.4 Internal admin — `app.uprevi.com/admin`
For the UPREVI team (Shayan, Rob, PMs, VAs). Manage all client restaurants, assign tasks to clients, track every client's sprint status and conversion, see MRR and tier distribution, push promos/content for client approval, run the 90-day results call workflow.

---

## 5. Data model (Prisma — core models)

Carry over and extend the existing schema. Key models:

- **User** (role: OWNER | STAFF | ADMIN | CUSTOMER; belongsTo many Restaurants via membership)
- **Restaurant** (slug, name, address, platforms[], **tier**, **subscriptionStatus**, sprintStartDate, stripeConnectId)
- **Subscription** (restaurantId, tier, stripeSubscriptionId, status, currentPeriodEnd) — drives entitlements
- **RestaurantMembership** (userId, restaurantId, role) — enables multi-location
- **MenuCategory / MenuItem / ModifierGroup / Modifier**
- **Order / OrderItem / OrderItemModifier** (channel: DIRECT | DOORDASH | UBEREATS)
- **Customer / RestaurantCustomer** (CLV, segment, loyaltyPoints, loyaltyTier, lastOrderAt)
- **Review** (platform, rating, text, sentiment, category, aiDraftResponse, status)
- **Promotion** (type, triggerType: MANUAL | WEATHER | EVENT | GAMEDAY | SLOW_DAY, status, performance)
- **UpsellRule** (restaurantId, triggerItemId, suggestedItemId, conversionRate)
- **LoyaltyConfig / LoyaltyTier / LoyaltyReward**
- **ChannelRevenue** (restaurantId, date, channel, revenue, orders) — for unified intelligence
- **RevenuePrediction** (restaurantId, date, predictedRevenue, drivers[] {weather, event, game})
- **Task** (restaurantId, title, owner: UPREVI | CLIENT, status, type: APPROVAL | TODO | MILESTONE, dueDate) — §7.8
- **AuditLog**

Every business query MUST filter by `restaurantId` (multi-tenant isolation). Never trust client-sent prices — re-price from DB on every order.

---

## 6. Tier & entitlements system (feature gating) — BUILD THIS EARLY

This is core infrastructure. Everything else plugs into it.

### Tiers
```ts
enum Tier { SPRINT, STARTER, PRO, ACCELERATOR, PARTNER }
// SPRINT = 90-day entry engagement; the rest are monthly:
// STARTER $199 | PRO $499 | ACCELERATOR $999 | PARTNER $2499
```

### Entitlement map (single source of truth)
```ts
const ENTITLEMENTS: Record<Tier, Feature[]> = {
  SPRINT:      ['dashboard_basic','channel_single','reviews_monitor','reporting','tasks'],
  STARTER:     ['dashboard_basic','channel_single','reviews_monitor','reporting','tasks'],
  PRO:         [...STARTER, 'channel_both','ordering','loyalty','reviews_ai','menu_optimization'],
  ACCELERATOR: [...PRO, 'smart_promos','predictive_dashboard','smart_upsell','winback_automation','competitive_analysis'],
  PARTNER:     [...ACCELERATOR, 'google_ads','social_media','seo','dedicated_manager','video_content','catering_funnels'],
};
```
(Use array spreads conceptually; implement as additive sets.)

### Enforcement — three layers, all required
1. **Server guard:** a `requireEntitlement(restaurantId, feature)` helper called in every gated API route handler / server action. Reads tier from the active Subscription. Throws 403 if not entitled. **This is the real lock — never rely on the UI alone.**
2. **UI gating:** a `<Gated feature="smart_promos">` component. If entitled, render the feature. If not, render a locked state with an **"Upgrade to unlock"** CTA that deep-links to `/upgrade`. Locked features stay visible — this is the built-in upsell engine.
3. **Stripe sync:** a webhook updates `Subscription.tier` and `status` on `customer.subscription.updated/created/deleted`. Tier changes take effect immediately.

### Upsell mechanic
The `/upgrade` page shows the tier ladder, highlights what the next tier unlocks, and lets the owner upgrade via Stripe Billing self-serve (or request it, routing a Task to the UPREVI team). Locked features throughout the app point here.

---

## 7. Feature specs (the differentiators)

### 7.1 Unified Channel Intelligence
One view combining direct orders (from our ordering engine) + DoorDash + UberEats. Since DoorDash/UberEats have no clean public API, start with **CSV import + manual entry** per restaurant (build the importer + a clean entry form), store in `ChannelRevenue`, and design the UI so a live feed can replace it later. Show revenue by channel, trends, and platform-to-direct conversion (fee savings). Gated: `channel_both` (PRO+).

### 7.2 Predictive Revenue Dashboard
Daily cron pulls weather forecast + local sports/events for the restaurant's location, combines with historical `ChannelRevenue` + day-of-week patterns, writes `RevenuePrediction`. Surface as plain-language insights: "Thursday looks strong — Ravens game at 8pm, expect ~40% dinner spike" / "Rain Saturday — delivery historically +35%." Gated: `predictive_dashboard` (ACCELERATOR+).

### 7.3 Smart Promotion Engine
When a prediction crosses a threshold (rain, game, slow day), auto-draft a promo (via Anthropic) tied to it. Owner gets a one-tap **Approve / Customize / Dismiss**. On approve, the promo activates and (via GHL) messages the customer list. Track performance. Gated: `smart_promos` (ACCELERATOR+).

### 7.4 Smart Upsell Engine
On the ordering PWA, when an item is added, suggest complements from `UpsellRule` (frequently-bought-together). Learn per restaurant — track which suggestions convert and promote the winners. Gated: `smart_upsell` (ACCELERATOR+).

### 7.5 AI Review Engine
Ingest reviews (Google Business Profile API where possible, manual otherwise). Run sentiment + categorize (food / delivery / service / accuracy). Draft a personalized response for owner approval. Flag patterns ("5 reviews mention cold food this month"). Gated: `reviews_ai` (PRO+); monitoring-only at lower tiers.

### 7.6 Ordering Engine + Loyalty
Full menu management, cart, Stripe Connect checkout, order lifecycle, real-time notifications, scheduled orders, throttling, promo codes. Loyalty: points-per-dollar, tiers, birthday rewards, "X points away" nudges, referrals. Gated: `ordering` + `loyalty` (PRO+).

### 7.7 Customer CRM + Segmentation
Track every customer's CLV and order cadence. Nightly cron recomputes segments (Champions / Loyal / At-Risk / New). Trigger win-back automations for lapsed customers via GHL. Gated: segmentation + winback at ACCELERATOR+.

### 7.8 Task / Collaboration Layer (the partnership made visible)
A shared workspace per restaurant. UPREVI's team creates tasks (`owner: UPREVI`) the client can watch progress on, and approval items (`type: APPROVAL`) the client acts on (e.g., approve a promo, a menu change, new photos). Sprint milestones show as `type: MILESTONE` on a timeline. The client sees "here's what your UPREVI team did this week / here's what needs you." Available all tiers (`tasks`) — it's the relationship glue.

---

## 8. GHL integration layer

GHL is plumbing. Build a thin `lib/ghl.ts` wrapper around the GHL API:
- **Lead capture:** marketing-site form + ordering signups → create/update GHL contact + create opportunity in the sales pipeline. Fire on submit (server action → GHL API). Also accept GHL webhooks for status changes.
- **Messaging:** when the platform needs to email/SMS a diner or owner (promo blast, win-back, review request, order confirmation), call GHL's messaging API rather than a direct provider.
- **Calendar:** embed/booking for the free audit call uses GHL's calendar; capture the booking back into our DB + pipeline.
Never expose GHL UI to clients. If a GHL call fails, queue and retry; don't block the user flow.

---

## 9. Brand system (fixed)

```
Navy (primary):    #1E3A5F
Navy deep:         #13263F
Navy soft (bg):    #EAEFF6
Gold (accent):     #9A7322
Ink (text):        #16202E
Warm bg:           #F4F1EA
Card:              #FFFFFF
Green (positive):  #157A52
Red (negative):    #C23B3B
```
- **Wordmark font:** Times New Roman (use `Tinos` web font), all-caps "UPREVI". Display/headings use the same serif.
- **Body/UI font:** Inter (or Arial fallback).
- **Logo:** the official "UR" mark (up-arrow forming the U, curving into the R) lives in `/public/logo/`. Use the provided PNG/SVG assets — do NOT redraw the mark. Horizontal lockup in nav, mark alone for favicon/app icon, white-on-navy version for dark surfaces.
- Aesthetic: warm, editorial, premium. Navy primary with gold accents. Avoid washed-out all-white layouts — use the warm background and clear card separation. Restrained motion (fade-ups, hover lifts, count-ups).
- **Never** show DoorDash/UberEats logos in promotional graphics (trademark). UPREVI is always all-caps.

---

## 10. Build phases (do in this order)

**Phase 1 — Foundation**
1. Next.js + TS + Tailwind + Prisma + Postgres scaffolding; brand tokens; logo assets; layout shells for all four surfaces (hostname routing middleware).
2. Auth.js with roles + multi-tenant `RestaurantMembership`.
3. **Tier & entitlements system (§6)** — models, `requireEntitlement`, `<Gated>`, Stripe subscription webhook. Everything downstream depends on this.

**Phase 2 — Core portal + ordering**
4. Marketing site (uprevi.com) + lead form → GHL.
5. Client portal shell: dashboard, settings, menu CRUD, Stripe Connect onboarding.
6. Ordering PWA: menu, cart, checkout, order lifecycle, real-time notifications.
7. Orders page in portal.

**Phase 3 — Partnership + retention features**
8. Task/collaboration layer (§7.8).
9. Review engine (ingest + sentiment + AI responses).
10. Loyalty + Customer CRM + segmentation.
11. Channel intelligence (CSV import first).

**Phase 4 — The Owner.com-killers**
12. Predictive revenue dashboard (weather + events + games).
13. Smart promotion engine (predictions → AI drafts → one-tap approve → GHL send).
14. Smart upsell engine.

**Phase 5 — Top tier + scale**
15. Internal admin (client management, sprint tracking, MRR view).
16. Upgrade/self-serve billing flow + upsell surfaces.
17. POS integrations (Square/Clover/Toast) — last, hardest, one at a time.
18. Caching, monitoring, tests, CI/CD.

Ship each phase working end-to-end before starting the next. Seed demo data (a demo restaurant "Bella Cucina") so every screen is testable.

---

## 11. Coding standards & guardrails

- TypeScript strict. Validate every input with Zod. Standardized API responses.
- Multi-tenant: every query filters by `restaurantId`. Server-side price calculation always.
- Gated features enforced server-side via `requireEntitlement` — UI gating is cosmetic only.
- Graceful degradation when optional API keys are absent.
- No secrets in code. No DoorDash/UberEats logos in marketing assets. UPREVI always all-caps.
- Prefer Server Components + server actions; client components only where interactivity requires.
- Keep GHL behind `lib/ghl.ts`; never leak GHL into client-facing UI.
- Write seed data and a README section as you build each phase.

---

*Build the partnership, not just the software. Owner.com is software with no team and no guarantee. UPREVI is software + a team + a guarantee — and this platform is what makes that real.*
