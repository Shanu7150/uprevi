import { describe, it, expect } from "vitest";
import { hasFeature, tierRank, minTierFor, monthlyPriceFor, MONTHLY_PRICE } from "@/lib/tiers";

describe("tier ladder", () => {
  it("orders tiers SPRINT < PRO < ACCELERATOR < PARTNER", () => {
    expect(tierRank("SPRINT")).toBeLessThan(tierRank("PRO"));
    expect(tierRank("PRO")).toBeLessThan(tierRank("ACCELERATOR"));
    expect(tierRank("ACCELERATOR")).toBeLessThan(tierRank("PARTNER"));
  });
});

describe("entitlements map", () => {
  it("SPRINT cannot use smart_promos", () => {
    expect(hasFeature("SPRINT", "smart_promos")).toBe(false);
  });

  it("PRO unlocks loyalty + reviews_ai but not smart_promos", () => {
    expect(hasFeature("PRO", "loyalty")).toBe(true);
    expect(hasFeature("PRO", "reviews_ai")).toBe(true);
    expect(hasFeature("PRO", "smart_promos")).toBe(false);
  });

  it("ACCELERATOR unlocks the Owner.com-killers", () => {
    expect(hasFeature("ACCELERATOR", "smart_promos")).toBe(true);
    expect(hasFeature("ACCELERATOR", "predictive_dashboard")).toBe(true);
    expect(hasFeature("ACCELERATOR", "smart_upsell")).toBe(true);
  });

  it("ACCELERATOR cannot use PARTNER-only agency services", () => {
    expect(hasFeature("ACCELERATOR", "google_ads")).toBe(false);
  });

  it("PARTNER unlocks everything below it plus agency services", () => {
    expect(hasFeature("PARTNER", "smart_promos")).toBe(true);
    expect(hasFeature("PARTNER", "google_ads")).toBe(true);
    expect(hasFeature("PARTNER", "catering_funnels")).toBe(true);
  });

  it("minTierFor reflects the ladder", () => {
    expect(minTierFor("smart_promos")).toBe("ACCELERATOR");
    expect(minTierFor("loyalty")).toBe("PRO");
  });
});

describe("MRR pricing", () => {
  it("SPRINT is 0 (entry engagement, not recurring MRR)", () => {
    expect(monthlyPriceFor("SPRINT")).toBe(0);
  });

  it("monthly tiers are priced per spec", () => {
    expect(MONTHLY_PRICE.STARTER).toBe(199);
    expect(MONTHLY_PRICE.PRO).toBe(499);
    expect(MONTHLY_PRICE.ACCELERATOR).toBe(999);
    expect(MONTHLY_PRICE.PARTNER).toBe(2499);
  });
});
