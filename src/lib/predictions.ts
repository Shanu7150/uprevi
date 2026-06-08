import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

/**
 * Predictive revenue engine (§7.2).
 *
 * Combines historical ChannelRevenue + day-of-week patterns into a forecast.
 * Weather + local sports/event drivers layer on top WHEN keys are configured;
 * without them the engine degrades gracefully to history-only predictions
 * (still useful), so the dashboard keeps working without external APIs.
 *
 * TODO(uprevi): wire real providers behind WEATHER_API_KEY / SPORTS_API_KEY,
 * keyed off the restaurant's location, and run this from a daily cron.
 */

export type DriverKind = "WEATHER" | "EVENT" | "GAMEDAY" | "DOW";
export interface Driver {
  kind: DriverKind;
  label: string;
  impactPct: number;
}

export function weatherConfigured(): boolean {
  return Boolean(process.env.WEATHER_API_KEY);
}
export function sportsConfigured(): boolean {
  return Boolean(process.env.SPORTS_API_KEY);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Baseline {
  perDow: number[];
  overallAvg: number;
  days: number;
}

async function dowBaseline(restaurantId: string): Promise<Baseline> {
  const rows = await db.channelRevenue.findMany({
    where: { restaurantId },
    select: { date: true, revenue: true },
  });

  const dailyTotals = new Map<string, number>();
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + Number(r.revenue));
  }

  const dowSum = new Array(7).fill(0);
  const dowCount = new Array(7).fill(0);
  let total = 0;
  for (const [key, val] of dailyTotals) {
    const dow = new Date(`${key}T00:00:00Z`).getUTCDay();
    dowSum[dow] += val;
    dowCount[dow] += 1;
    total += val;
  }
  const n = dailyTotals.size;
  const overallAvg = n ? total / n : 0;
  const perDow = dowSum.map((s, i) => (dowCount[i] ? s / dowCount[i] : overallAvg));
  return { perDow, overallAvg, days: n };
}

/**
 * Live drivers (weather/game). Graceful: returns [] when no provider key is set.
 */
async function liveDrivers(_restaurantId: string, _date: Date): Promise<Driver[]> {
  if (!weatherConfigured() && !sportsConfigured()) return [];
  // TODO(uprevi): fetch real forecast + fixtures here and map to Driver[].
  return [];
}

function buildHeadline(date: Date, predicted: number, overallAvg: number, drivers: Driver[]): string {
  const weekday = WEEKDAYS[date.getUTCDay()];
  const live = drivers.filter((d) => d.kind !== "DOW");
  const liftVsAvg = overallAvg ? Math.round(((predicted - overallAvg) / overallAvg) * 100) : 0;

  if (live.length) {
    const reason = live.map((d) => d.label).join(" + ");
    return `${weekday} looks strong: ${reason}. Expect ~${Math.abs(liftVsAvg)}% ${liftVsAvg >= 0 ? "above" : "below"} a normal day.`;
  }
  if (liftVsAvg >= 12) return `${weekday} typically runs ~${liftVsAvg}% above your weekly average. Staff up and stock your top sellers.`;
  if (liftVsAvg <= -12) return `${weekday} is usually quiet (~${Math.abs(liftVsAvg)}% below average). A slow-day promo could fill it.`;
  return `${weekday} should track close to your weekly average.`;
}

export interface GeneratedPrediction {
  date: Date;
  predictedRevenue: number;
  baselineRevenue: number;
  liftPct: number;
  drivers: Driver[];
  headline: string;
}

/** Generate + persist forecasts for the next `days` days. Returns the rows. */
export async function generatePredictions(restaurantId: string, days = 7): Promise<GeneratedPrediction[]> {
  const { perDow, overallAvg } = await dowBaseline(restaurantId);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const out: GeneratedPrediction[] = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(today.getTime() + d * 86_400_000);
    const dow = date.getUTCDay();
    const baseline = perDow[dow] || overallAvg;

    const drivers: Driver[] = [];
    const dowLift = overallAvg ? Math.round(((baseline - overallAvg) / overallAvg) * 100) : 0;
    if (Math.abs(dowLift) >= 5) {
      drivers.push({ kind: "DOW", label: `${WEEKDAYS[dow]} day-of-week pattern`, impactPct: dowLift });
    }
    const live = await liveDrivers(restaurantId, date);
    drivers.push(...live);

    const liveMultiplier = 1 + live.reduce((s, x) => s + x.impactPct, 0) / 100;
    const predicted = baseline * liveMultiplier;
    const liftPct = overallAvg ? ((predicted - overallAvg) / overallAvg) * 100 : 0;

    out.push({
      date,
      predictedRevenue: Math.round(predicted * 100) / 100,
      baselineRevenue: Math.round(baseline * 100) / 100,
      liftPct: Math.round(liftPct * 10) / 10,
      drivers,
      headline: buildHeadline(date, predicted, overallAvg, drivers),
    });
  }

  for (const p of out) {
    await db.revenuePrediction.upsert({
      where: { restaurantId_date: { restaurantId, date: p.date } },
      update: {
        predictedRevenue: p.predictedRevenue,
        baselineRevenue: p.baselineRevenue,
        liftPct: p.liftPct,
        drivers: p.drivers as unknown as Prisma.InputJsonValue,
        headline: p.headline,
      },
      create: {
        restaurantId,
        date: p.date,
        predictedRevenue: p.predictedRevenue,
        baselineRevenue: p.baselineRevenue,
        liftPct: p.liftPct,
        drivers: p.drivers as unknown as Prisma.InputJsonValue,
        headline: p.headline,
      },
    });
  }
  return out;
}
