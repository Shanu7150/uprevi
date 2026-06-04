# UPREVI — Foundation Starter (read me first)

This folder is the **Phase 1 spine** for the UPREVI platform. Commit these files to your repo, then run **Claude Code** with `UPREVI-MASTER-BUILD-PROMPT.md` to build everything on top of them.

## Why these files exist
They lock in the decisions that are easy to get wrong and expensive to fix later — your brand, your data model, and especially your **tier/feature-gating system**. Giving Claude Code a correct spine means it builds the rest *on* your decisions instead of guessing.

## What's here
```
prisma/schema.prisma     -> full data model (multi-tenant, tiers, all core entities)
lib/entitlements.ts      -> THE tier system: tiers, feature map, requireEntitlement() guard
lib/brand.ts             -> brand color + font tokens (mirror into tailwind.config.ts)
lib/ghl.ts               -> thin GHL wrapper (lead capture + messaging, behind the curtain)
components/Gated.tsx      -> UI feature-lock with built-in "Upgrade to unlock" upsell
public/logo/             -> the official UPREVI logo files (DO NOT redraw the mark)
```

## How to start (order matters)
1. **Drop these into the repo** at the matching paths (`prisma/`, `src/lib/`, `src/components/`, `public/logo/`).
2. **Set up env vars** from §3 of the master prompt (at minimum `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`). Optional keys (GHL, weather, sports) can come later — the build degrades gracefully without them.
3. **Run Claude Code** in the repo and give it `UPREVI-MASTER-BUILD-PROMPT.md`. Tell it: *"Use the files already in the repo as the foundation. Start with Phase 1, then proceed in order. Don't redraw the logo — use /public/logo."*
4. Build **phase by phase** (the prompt lists 5 phases). Get each phase working end-to-end before the next. Don't let it try to build everything at once.

## The tier system (your recurring question — it's solved here)
- `lib/entitlements.ts` is the single source of truth for what each tier unlocks.
- **Server lock:** call `requireEntitlement(restaurantId, "smart_promos", getTier)` at the top of any gated route. This is the real enforcement.
- **UI lock + upsell:** wrap features in `<Gated feature="smart_promos" tier={tier}>…</Gated>`. Locked features stay visible with an "Upgrade to unlock" CTA — the platform sells upgrades for you.
- **Stripe sync:** a webhook (Claude Code builds this in Phase 1) updates `Subscription.tier` so changes take effect instantly.

To change pricing or which feature sits at which tier, edit the `ENTITLEMENTS` map — nothing else.

## While Claude Code builds: your GHL track
You set up GHL in parallel (sales pipeline + automations). The platform talks to GHL through `lib/ghl.ts`. When your GHL is ready, drop in `GHL_API_KEY` + `GHL_LOCATION_ID` and leads/messages start flowing. Ask me for the lean GHL configuration blueprint when you want the exact pipeline stages and automations to set up.
