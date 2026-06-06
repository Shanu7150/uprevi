"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Sparkles, Check } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { generateReviewDraft, saveReviewResponse } from "./actions";

export interface ReviewT {
  id: string;
  platform: string;
  rating: number;
  reviewerName: string;
  body: string;
  sentiment: string | null;
  aiResponseDraft: string | null;
  respondedAt: string | null;
  createdAt: string;
}
export interface ReviewSummaryT {
  total: number;
  avgRating: number;
  sentiment: { positive: number; neutral: number; negative: number };
  distribution: number[];
  topThemes: string[];
}

const SENT_COLOR: Record<string, { bg: string; fg: string }> = {
  POSITIVE: { bg: "var(--green-dim)", fg: "var(--green)" },
  NEUTRAL: { bg: "var(--gold-dim)", fg: "var(--gold)" },
  NEGATIVE: { bg: "var(--red-dim)", fg: "var(--red)" },
};

export function ReviewsClient({ summary, reviews, currentTier }: { summary: ReviewSummaryT; reviews: ReviewT[]; currentTier: Tier }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary (monitoring) */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-base p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>Average rating</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-display text-3xl font-bold font-mono-price" style={{ color: "var(--navy)" }}>{summary.avgRating.toFixed(1)}</span>
            <Stars n={Math.round(summary.avgRating)} />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{summary.total} review{summary.total === 1 ? "" : "s"}</p>
        </div>
        <div className="card-base p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "var(--text-dim)" }}>Sentiment</p>
          <Bar label="Positive" value={summary.sentiment.positive} total={summary.total} color="var(--green)" />
          <Bar label="Neutral" value={summary.sentiment.neutral} total={summary.total} color="var(--gold)" />
          <Bar label="Negative" value={summary.sentiment.negative} total={summary.total} color="var(--red)" />
        </div>
        <div className="card-base p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "var(--text-dim)" }}>Top themes</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.topThemes.length === 0 && <span className="text-xs" style={{ color: "var(--text-dim)" }}>None yet</span>}
            {summary.topThemes.map((t) => (
              <span key={t} className="badge" style={{ background: "var(--cream)", color: "var(--text-muted)" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="flex flex-col gap-3">
        {reviews.length === 0 && <p className="text-sm" style={{ color: "var(--text-dim)" }}>No reviews yet.</p>}
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} currentTier={currentTier} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review, currentTier }: { review: ReviewT; currentTier: Tier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<string | null>(review.aiResponseDraft);
  const [responded, setResponded] = useState(Boolean(review.respondedAt));
  const sent = review.sentiment ? SENT_COLOR[review.sentiment] : null;

  const generate = () =>
    startTransition(async () => {
      const res = await generateReviewDraft(review.id);
      if (res.ok) setDraft(res.text);
      else alert(res.error);
    });

  const approve = () =>
    startTransition(async () => {
      if (!draft) return;
      const res = await saveReviewResponse({ reviewId: review.id, text: draft });
      if (res.ok) { setResponded(true); router.refresh(); }
      else alert(res.error);
    });

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{review.reviewerName}</p>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>{review.platform}</span>
          {sent && <span className="badge" style={{ background: sent.bg, color: sent.fg }}>{review.sentiment?.toLowerCase()}</span>}
        </div>
        <Stars n={review.rating} />
      </div>
      <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>&ldquo;{review.body}&rdquo;</p>

      <div className="mt-4">
        <Gated feature="reviews_ai" currentTier={currentTier}>
          {responded ? (
            <div className="rounded-lg p-3" style={{ background: "var(--green-dim)" }}>
              <p className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: "var(--green)" }}><Check size={13} /> Response posted</p>
              <p className="text-sm" style={{ color: "var(--text)" }}>{draft}</p>
            </div>
          ) : draft ? (
            <div className="flex flex-col gap-2">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="input-base px-3 py-2 text-sm resize-none" />
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={approve} className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60">Approve &amp; post</button>
                <button type="button" disabled={pending} onClick={generate} className="btn-ghost px-3 py-1.5 text-xs">Regenerate</button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={pending} onClick={generate} className="btn-accent px-4 py-2 text-sm disabled:opacity-60">
              <Sparkles size={14} /> {pending ? "Drafting…" : "Generate AI response"}
            </button>
          )}
        </Gated>
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={13} fill={i < n ? "var(--gold)" : "none"} stroke={i < n ? "none" : "var(--border-light)"} />
      ))}
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs w-14 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--cream)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span className="text-xs w-7 text-right font-mono-price" style={{ color: "var(--text-dim)" }}>{value}</span>
    </div>
  );
}
