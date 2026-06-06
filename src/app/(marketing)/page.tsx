"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  BarChart2,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  Star,
  Award,
  Clock,
  ShieldCheck,
} from "lucide-react";

// ── Testimonial ───────────────────────────────────────────────────────────────
function TestimonialCard({
  name, restaurant, city, quote, growth, delay,
}: {
  name: string; restaurant: string; city: string;
  quote: string; growth: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="card-base p-6 flex flex-col gap-4"
    >
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} fill="var(--gold)" stroke="none" />
        ))}
      </div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
            {restaurant} · {city}
          </p>
        </div>
        <span
          className="badge"
          style={{ background: "var(--green-dim)", color: "var(--green)" }}
        >
          +{growth}
        </span>
      </div>
    </motion.div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  name, price, period, features, highlight, badge, delay, cta,
}: {
  name: string; price: string; period: string; features: string[];
  highlight?: boolean; badge?: string; delay: number; cta: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="relative flex flex-col rounded-2xl p-6 gap-5"
      style={{
        background: highlight ? "var(--card-raised)" : "var(--card)",
        border: `${highlight ? "2px" : "1px"} solid ${highlight ? "var(--accent-border)" : "var(--border)"}`,
        boxShadow: highlight
          ? "0 0 0 1px rgba(30,58,95,0.06), 0 18px 50px rgba(30,58,95,0.14)"
          : "0 1px 2px rgba(30,58,95,0.04)",
      }}
    >
      {badge && (
        <div
          className="absolute -top-3 left-5 badge px-3 py-1 text-xs"
          style={{ background: "var(--accent)", color: "white" }}
        >
          {badge}
        </div>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-dim)" }}>
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span
            className="font-display text-4xl font-bold"
            style={{ color: highlight ? "var(--accent)" : "var(--text)" }}
          >
            {price}
          </span>
          <span className="text-sm pb-1.5" style={{ color: "var(--text-muted)" }}>{period}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
            <span style={{ color: "var(--text-muted)" }}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/onboarding"
        className="w-full py-3 text-sm font-bold rounded-xl text-center block transition-all"
        style={
          highlight
            ? {
                background: "var(--navy)",
                color: "white",
                boxShadow: "0 4px 16px rgba(30,58,95,0.22)",
              }
            : {
                background: "transparent",
                border: "1.5px solid var(--border-light)",
                color: "var(--text-muted)",
              }
        }
      >
        {cta}
      </Link>
    </motion.div>
  );
}

// ── Comparison row ────────────────────────────────────────────────────────────
function CompRow({
  feature, them, us, delay,
}: {
  feature: string; them: string | boolean; us: string | boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      viewport={{ once: true }}
      className="grid grid-cols-3 py-4 border-b text-sm items-center"
      style={{ borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>{feature}</span>
      <div className="flex justify-center">
        {typeof them === "boolean" ? (
          them ? <Check size={14} style={{ color: "var(--green)" }} /> : <span style={{ color: "var(--red)" }}>✕</span>
        ) : (
          <span style={{ color: "var(--text-dim)" }}>{them}</span>
        )}
      </div>
      <div className="flex justify-center">
        {typeof us === "boolean" ? (
          us ? <Check size={14} style={{ color: "var(--green)" }} /> : <span style={{ color: "var(--red)" }}>✕</span>
        ) : (
          <span className="font-semibold" style={{ color: "var(--accent)" }}>{us}</span>
        )}
      </div>
    </motion.div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      viewport={{ once: true }}
      className="border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 font-medium"
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          style={{
            color: "var(--text-dim)",
            transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {a}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.86)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="UPREVI home">
            <Image
              src="/logo/UPREVI-logo-horizontal.png"
              alt="UPREVI"
              width={132}
              height={32}
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["How It Works", "Pricing", "Results", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {item}
              </a>
            ))}
          </nav>
          <Link href="/onboarding" className="btn-accent px-5 py-2.5 text-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-20 px-6 overflow-hidden hero-grid">
        {/* Radial wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 22% 45%, rgba(30,58,95,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-[1fr_400px] gap-16 xl:gap-24 items-center">

            {/* Left: copy */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs font-bold uppercase tracking-[0.18em] mb-8"
                style={{ color: "var(--accent)" }}
              >
                Restaurant Delivery Growth Agency
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-extrabold leading-[1.0] tracking-tight mb-8"
                style={{ fontSize: "clamp(52px, 7vw, 96px)" }}
              >
                We grow your
                <br />
                delivery revenue.
                <br />
                <span style={{ color: "var(--accent)" }}>Guaranteed.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg leading-relaxed mb-3 max-w-xl"
                style={{ color: "var(--text-muted)" }}
              >
                We optimize your DoorDash and UberEats presence — listings,
                menus, photos, reviews, promotions — so you earn more from
                every order.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-base font-semibold mb-10"
                style={{ color: "var(--gold)" }}
              >
                Miss 20% growth in 90 days? Full refund + $100 cash. No questions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link href="/onboarding" className="btn-accent btn-cta-breathe px-8 py-4 text-base">
                  Start your 90-day sprint
                  <ArrowRight size={17} />
                </Link>
                <a href="#how-it-works" className="btn-ghost px-8 py-4 text-base">
                  See how it works
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                {["No contracts", "90-day sprint", "Money-back guarantee", "Flat-rate pricing"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check size={11} style={{ color: "var(--green)" }} />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: guarantee card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="guarantee-card p-8 flex flex-col gap-6 lg:sticky lg:top-24"
            >
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] mb-4"
                  style={{ color: "var(--accent)" }}
                >
                  The Guarantee
                </p>
                <div
                  className="font-display font-extrabold leading-none mb-2"
                  style={{ fontSize: "clamp(56px, 8vw, 80px)", color: "var(--accent)" }}
                >
                  20%
                </div>
                <p className="font-semibold text-lg leading-snug">
                  delivery revenue growth<br />
                  <span style={{ color: "var(--text-muted)" }}>in 90 days.</span>
                </p>
              </div>

              <div
                className="py-5 px-5 rounded-xl text-sm"
                style={{ background: "var(--card-hover)", border: "1px solid var(--border)" }}
              >
                <p className="font-semibold mb-2" style={{ color: "var(--gold)" }}>
                  Or we write you a check.
                </p>
                <p style={{ color: "var(--text-muted)" }}>
                  Full refund of everything you paid, plus $100 cash. Guaranteed in writing on day one.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: "Guarantee in writing, day one" },
                  { icon: Clock, text: "First optimizations live within 7 days" },
                  { icon: TrendingUp, text: "67% average growth across all clients" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <Icon size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-muted)" }}>{text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/onboarding"
                className="btn-accent w-full py-3.5 text-sm"
              >
                Start for $99 today
                <ArrowRight size={15} />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Proof strip ─────────────────────────────────────────────────────── */}
      <section
        className="py-14 px-6"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl font-semibold leading-relaxed max-w-3xl"
            style={{ color: "var(--text-muted)" }}
          >
            Our clients average{" "}
            <span className="font-extrabold font-display" style={{ color: "var(--accent)", fontSize: "1.25em" }}>67%</span>
            {" "}growth in 90 days. We only guarantee{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>20%</span>
            {" "}because we sandbag the promise.{" "}
            <span className="font-extrabold font-display" style={{ color: "var(--green)", fontSize: "1.1em" }}>$0</span>
            {" "}hidden fees.{" "}
            <span className="font-extrabold font-display" style={{ color: "var(--green)", fontSize: "1.1em" }}>$0</span>
            {" "}transaction cuts. Just results.
          </motion.p>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 section-dark">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              The Process
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
              How UPREVI works
            </h2>
            <p className="text-lg max-w-lg" style={{ color: "var(--text-muted)" }}>
              A structured 90-day sprint, then ongoing growth if you want it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              {
                step: "01",
                icon: BarChart2,
                title: "Deep platform audit",
                body: "We analyze your DoorDash and UberEats presence — listings, photos, menu structure, pricing, reviews, and promotion history. We find exactly where revenue is leaking.",
                delay: 0,
              },
              {
                step: "02",
                icon: Zap,
                title: "90-day optimization sprint",
                body: "Menu engineering, photo optimization, listing improvements, targeted promotions, review response strategy, and weekly performance monitoring. Every lever pulled.",
                delay: 0.1,
              },
              {
                step: "03",
                icon: Award,
                title: "Results or full refund",
                body: "At day 90 we review your numbers together. If we missed 20% growth, we issue a full refund plus $100 cash. If we won — and we almost always do — we talk about what's next.",
                delay: 0.2,
              },
            ].map(({ step, icon: Icon, title, body, delay }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="card-base p-6 relative overflow-hidden"
              >
                <div
                  className="absolute -top-2 -right-2 font-display font-extrabold text-7xl opacity-[0.06] select-none"
                  style={{ color: "var(--accent)", lineHeight: 1 }}
                >
                  {step}
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
                >
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="card-base p-8"
          >
            <h3 className="font-display font-bold text-xl mb-8">What happens after you sign up</h3>
            <div>
              {[
                { day: "Day 1", title: "Onboarding call", desc: "We go deep on your menu, pricing, platforms, and revenue baseline. You meet your dedicated account lead." },
                { day: "Days 2–7", title: "Audit + quick wins", desc: "Full platform audit delivered. First optimizations go live within the week — listing updates, photo improvements, description rewrites." },
                { day: "Days 8–30", title: "Menu engineering", desc: "Pricing strategy, item positioning, modifier optimization, category restructuring. The biggest revenue lever." },
                { day: "Days 31–75", title: "Promotion campaigns", desc: "Targeted DoorDash and UberEats promotions. Timed offers, reorder loops, and customer win-back sequences." },
                { day: "Days 76–90", title: "Review optimization", desc: "AI-assisted review response strategy and reputation management to improve conversion on new visitors." },
                { day: "Day 90", title: "Results review", desc: "We present your growth numbers side-by-side. Refund if we missed. Upgrade conversation if we won." },
              ].map(({ day, title, desc }, i, arr) => (
                <div key={day} className="flex gap-5 pb-7 relative">
                  {i < arr.length - 1 && (
                    <div
                      className="absolute left-[23px] top-12 bottom-0 w-px"
                      style={{ background: "var(--border)" }}
                    />
                  )}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-center text-xs font-bold shrink-0 z-10 leading-tight"
                    style={{
                      background: i === arr.length - 1
                        ? "var(--navy)"
                        : "var(--cream)",
                      border: `1.5px solid ${i === arr.length - 1 ? "var(--navy)" : "var(--border-light)"}`,
                      color: i === arr.length - 1 ? "white" : "var(--accent)",
                      boxShadow: i === arr.length - 1 ? "0 4px 16px rgba(30,58,95,0.22)" : "none",
                    }}
                  >
                    {day.includes("–") ? day.split("–")[0] : day.replace("Day ", "")}
                  </div>
                  <div className="pt-2.5">
                    <p className="font-semibold mb-0.5">{title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section
        id="results"
        className="py-24 px-6 section-raised"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              Client Results
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
              Real restaurants. Real growth.
            </h2>
            <p className="text-lg max-w-lg" style={{ color: "var(--text-muted)" }}>
              Our internal target is 60–70% growth. We only guarantee 20% because we sandbag the promise.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            <TestimonialCard
              name="Marco Esposito"
              restaurant="Bella Cucina"
              city="Chicago, IL"
              quote="UPREVI completely restructured our DoorDash menu. Within 45 days we were doing 30% more orders at a higher average ticket. The photo optimization alone was a game changer."
              growth="34% in 58 days"
              delay={0}
            />
            <TestimonialCard
              name="Priya Sharma"
              restaurant="Spice Route"
              city="Austin, TX"
              quote="I was skeptical about the guarantee but they actually mean it. We hit 28% delivery revenue growth by month 2. Their promotion strategy on UberEats alone drove $4k extra last month."
              growth="28% in 52 days"
              delay={0.1}
            />
            <TestimonialCard
              name="James Okafor"
              restaurant="The Jerk Spot"
              city="Atlanta, GA"
              quote="After owner.com pulled us off third-party platforms and we lost 40% of revenue, UPREVI rebuilt our entire delivery presence. Now we're making more on DoorDash than ever before."
              growth="71% in 90 days"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── vs Owner.com ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              Head to Head
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
              Why restaurants switch from Owner.com
            </h2>
            <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
              Owner.com pulls you off the platforms where you already make money. We optimize them.
            </p>
          </motion.div>

          <div className="card-base overflow-hidden">
            <div
              className="grid grid-cols-3 py-3.5 px-6 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ background: "var(--card-hover)", borderBottom: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text-dim)" }}>Feature</span>
              <span className="text-center" style={{ color: "var(--text-dim)" }}>Owner.com</span>
              <span className="text-center" style={{ color: "var(--accent)" }}>UPREVI</span>
            </div>
            <div className="px-6">
              <CompRow feature="Delivery platform optimization" them="None" us="Full service" delay={0} />
              <CompRow feature="ROI guarantee" them={false} us={true} delay={0.04} />
              <CompRow feature="Transaction fees" them="5% per order" us="Zero" delay={0.08} />
              <CompRow feature="Human strategy & account mgmt" them="Automated only" us="Dedicated lead" delay={0.12} />
              <CompRow feature="Transparent flat-rate pricing" them={false} us={true} delay={0.16} />
              <CompRow feature="Review management" them="Basic" us="AI + human" delay={0.20} />
              <CompRow feature="DoorDash/UberEats optimization" them="Pulls you off" us="Maximizes" delay={0.24} />
              <CompRow feature="Promotion strategy" them="Pre-made, no customization" us="Custom calendar" delay={0.28} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-24 px-6 section-raised"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              Pricing
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
              Simple. Transparent. No surprises.
            </h2>
            <p className="text-lg max-w-lg" style={{ color: "var(--text-muted)" }}>
              Start with the 90-day sprint, then choose a monthly plan that fits.
            </p>
          </motion.div>

          {/* Sprint options */}
          <div className="grid md:grid-cols-2 gap-5 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="card-base p-7"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "var(--text-dim)" }}>
                90-Day Sprint — Upfront
              </p>
              <div className="flex items-end gap-1.5 mb-1.5">
                <span className="font-display text-5xl font-extrabold tracking-tight">$1,695</span>
                <span className="pb-2 text-sm" style={{ color: "var(--text-muted)" }}>one time</span>
              </div>
              <p className="text-sm mb-6 font-semibold" style={{ color: "var(--green)" }}>
                Save $295 vs. payment plan
              </p>
              <ul className="space-y-2.5 mb-7">
                {["Full 90-day sprint", "Guaranteed 20% growth", "Full refund + $100 if missed", "All optimizations included"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={13} style={{ color: "var(--accent)" }} />
                    <span style={{ color: "var(--text-muted)" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/onboarding?plan=upfront" className="btn-ghost w-full py-3.5 text-sm text-center block">
                Get started — pay upfront
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative guarantee-card p-7"
            >
              <div
                className="absolute -top-3 left-6 badge px-3 py-1.5 text-xs"
                style={{ background: "var(--accent)", color: "white", boxShadow: "0 4px 12px rgba(154,115,34,0.32)" }}
              >
                Most popular
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "var(--text-dim)" }}>
                90-Day Sprint — Payment Plan
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="font-display text-5xl font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
                  $99
                </span>
                <span className="pb-2 text-sm" style={{ color: "var(--text-muted)" }}>down</span>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                then 4 monthly payments of ~$478 · $1,990 total
              </p>
              <ul className="space-y-2.5 mb-7">
                {[
                  "Full 90-day sprint",
                  "Guaranteed 20% growth",
                  "Full refund + $100 if missed",
                  "All optimizations included",
                  "Low barrier to start",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={13} style={{ color: "var(--accent)" }} />
                    <span style={{ color: "var(--text-muted)" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/onboarding?plan=installments" className="btn-accent w-full py-3.5 text-sm text-center block">
                Start for $99 today
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          </div>

          {/* MRR plans */}
          <div>
            <p className="text-sm font-semibold mb-6" style={{ color: "var(--text-dim)" }}>
              After your sprint — optional ongoing monthly plans
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PlanCard name="Growth Starter" price="$199" period="/mo"
                features={["Single platform (DD or UE)", "Listing optimization", "Monthly performance report", "Review monitoring"]}
                delay={0} cta="Start sprint first" />
              <PlanCard name="Growth Pro" price="$499" period="/mo"
                features={["Both platforms", "Menu & photo audit", "Review monitoring", "Biweekly reports"]}
                highlight badge="Most chosen" delay={0.1} cta="Start sprint first" />
              <PlanCard name="Growth Accelerator" price="$999" period="/mo"
                features={["Everything in Pro", "Promotion management", "Reorder loop campaigns", "Biweekly check-ins", "Competitive analysis"]}
                delay={0.2} cta="Start sprint first" />
              <PlanCard name="Growth Partner" price="$2,499" period="/mo"
                features={["Everything in Accelerator", "Video content creation", "Catering funnels", "Menu engineering", "Dedicated account manager"]}
                delay={0.3} cta="Start sprint first" />
            </div>
          </div>
        </div>
      </section>

      {/* ── What we do ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              The Work
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
              Every lever we pull
            </h2>
            <p className="text-lg max-w-lg" style={{ color: "var(--text-muted)" }}>
              We&apos;re not a software tool. We&apos;re a growth team that does the work.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BarChart2, title: "Menu engineering", body: "Item positioning, pricing psychology, category restructuring, modifier optimization, name and description rewrites.", delay: 0 },
              { icon: TrendingUp, title: "Photo optimization", body: "Professional food photography direction, thumbnail optimization for conversion, image sequencing for DoorDash and UberEats feeds.", delay: 0.05 },
              { icon: MessageSquare, title: "Review strategy", body: "AI-powered review response drafting, escalation playbooks, pattern detection to fix recurring complaints.", delay: 0.1 },
              { icon: Zap, title: "Promotion campaigns", body: "Targeted DoorDash/UberEats promos timed to your peak hours, weather patterns, and local events. No spray-and-pray.", delay: 0.15 },
              { icon: Users, title: "Customer retention", body: "Reorder loop campaigns, loyalty prompts, and win-back sequences to turn one-time orders into regulars.", delay: 0.2 },
              { icon: Star, title: "Listing optimization", body: "Search keyword tuning, category tag optimization, business info cleanup, and platform algorithm alignment.", delay: 0.25 },
            ].map(({ icon: Icon, title, body, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="card-base p-6"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
                >
                  <Icon size={16} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-display font-bold text-base mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="py-24 px-6 section-raised"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              FAQ
            </p>
            <h2 className="font-display font-extrabold text-4xl tracking-tight">Common questions</h2>
          </motion.div>
          <FAQ q="What exactly does the guarantee mean?" a="If your DoorDash and UberEats combined delivery revenue doesn't grow by at least 20% from your baseline in 90 days, we issue a full refund of everything you paid, plus $100 cash. No hoops, no negotiations, no minimums. We put it in writing." delay={0} />
          <FAQ q="How is the baseline calculated?" a="We use your actual platform revenue data from the 30 days before we start. We document it at kickoff and you sign off on the number. There's no ambiguity — we both see the same data." delay={0.05} />
          <FAQ q="Do I need to be on DoorDash and UberEats already?" a="You need to be active on at least one platform. If you're only on one, we'll optimize that one and, if it makes sense, help you set up the other during the sprint." delay={0.1} />
          <FAQ q="Why don't you just pull me off the platforms like Owner.com?" a="Because 40–70% of most restaurants' delivery revenue comes from DoorDash and UberEats. Abandoning those platforms is leaving real money on the table. Our entire thesis is to win on the channels where you already have customers." delay={0.15} />
          <FAQ q="Do I have to sign up for the ongoing monthly plan after the sprint?" a="No. The sprint is a standalone engagement. At day 90 we'll present your results and tell you what continued support would look like, but there's no auto-enrollment and no obligation." delay={0.2} />
          <FAQ q="What if I'm already doing pretty well on delivery?" a="The higher your baseline, the harder the 20% guarantee is to miss. We've achieved 60–70% growth on average. Even restaurants already doing $20k/month in delivery have seen meaningful gains from menu restructuring and promotion timing." delay={0.25} />
          <FAQ q="How much of my time does this require?" a="Very little. You'll need a 60-minute onboarding call, access to your platform accounts, and maybe 15 minutes per week to approve changes or answer questions. We do the work — you run the restaurant." delay={0.3} />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 section-navy relative overflow-hidden"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(184,146,63,0.20) 0%, transparent 65%)" }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-extrabold tracking-tight mb-6" style={{ fontSize: "clamp(44px, 6vw, 72px)", color: "#fff" }}>
              Ready to grow?
            </h2>
            <p className="text-xl mb-8 max-w-lg mx-auto" style={{ color: "rgba(245,244,240,0.78)" }}>
              Takes 5 minutes to start. We handle everything. Results in 90 days or your money back.
            </p>
            <Link
              href="/onboarding"
              className="btn-cta-breathe px-10 py-4 text-base inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all"
              style={{ background: "#fff", color: "var(--navy)", boxShadow: "0 8px 28px rgba(0,0,0,0.28)" }}
            >
              Start your 90-day sprint
              <ArrowRight size={18} />
            </Link>
            <p className="mt-5 text-sm" style={{ color: "rgba(245,244,240,0.55)" }}>
              $99 down · Payment plan available · No contracts
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer
        className="py-12 px-6 section-raised"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <Image
                src="/logo/UPREVI-logo-horizontal.png"
                alt="UPREVI"
                width={132}
                height={32}
              />
              <p className="text-sm mt-1.5 max-w-xs" style={{ color: "var(--text-dim)" }}>
                Restaurant delivery revenue growth. Guaranteed.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm" style={{ color: "var(--text-dim)" }}>
              <a href="#how-it-works" className="transition-colors hover:text-white">How It Works</a>
              <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
              <a href="#results" className="transition-colors hover:text-white">Results</a>
              <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
              <Link href="/login" className="transition-colors hover:text-white">Restaurant Login</Link>
            </div>
          </div>
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-xs"
            style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }}
          >
            <span>© 2025 UPREVI. All rights reserved.</span>
            <span>Built by Rob &amp; Shayan Malik</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
