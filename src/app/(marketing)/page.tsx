"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AuditForm } from "./AuditForm";
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
        href="#book"
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
          <Link href="#book" className="btn-accent px-5 py-2.5 text-sm">
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
                Our written guarantee targets 20% growth in 90 days, measured
                against your agreed revenue baseline.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link href="#book" className="btn-accent btn-cta-breathe px-8 py-4 text-base">
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
                {["Written agreement", "90-day sprint", "Performance guarantee", "Flat-rate pricing"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check size={11} style={{ color: "var(--green)" }} />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: restaurant owner + guarantee */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl min-h-[540px] lg:sticky lg:top-24"
              style={{ boxShadow: "0 24px 70px rgba(30,58,95,0.22)" }}
            >
              <Image
                src="/photos/restaurant-owner.jpg"
                alt="Independent restaurant owner serving guests"
                width={800}
                height={1200}
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,24,42,.92) 0%, rgba(10,24,42,.08) 65%)" }} />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#e4c46f" }}>
                  Built for independent operators
                </p>
                <p className="font-display text-3xl font-bold leading-tight mb-3">
                  More orders. Better margins. A team behind you.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.78)" }}>
                  We handle the marketplace work while you focus on running the restaurant.
                </p>
              </div>
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
            Your restaurant already has demand on DoorDash and Uber Eats. We help
            you convert more of that demand through stronger menus, pricing,
            merchandising, promotions, and ongoing optimization.
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
              Three focused phases, then ongoing growth support if you want it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              {
                step: "01",
                icon: BarChart2,
                title: "Phase 1 — Build the menu",
                body: "We restructure categories, prices, sizing, modifiers, descriptions, and images to make the menu easier to shop and more profitable.",
                delay: 0,
              },
              {
                step: "02",
                icon: Zap,
                title: "Phase 2 — Make it sell",
                body: "We build margin-aware deals, bundles, BOGOs, upsells, and promotional merchandising designed for each restaurant and market.",
                delay: 0.1,
              },
              {
                step: "03",
                icon: Award,
                title: "Phase 3 — Optimize what works",
                body: "We monitor performance, adjust weak offers, expand what is converting, manage reviews, and document results against the agreed baseline.",
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

          {/* Operator story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="card-base overflow-hidden grid lg:grid-cols-[1.05fr_.95fr]"
          >
            <div className="relative min-h-[360px]">
              <Image src="/photos/pizzeria-team.jpg" alt="Restaurant operator working beside pizza ovens" width={1200} height={800} className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>Your growth team</p>
              <h3 className="font-display font-bold text-3xl mb-4">Software shows the work. Our team moves it forward.</h3>
              <p className="leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                See changes, approvals, blockers, and performance in one place—while UpRevi handles the ongoing execution behind the scenes.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {["Clear ownership", "Documented changes", "Ongoing communication"].map((item) => <span key={item} className="badge">{item}</span>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Verified result ─────────────────────────────────────────────────── */}
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
              We protect client identity while showing the underlying before-and-after performance.
            </p>
          </motion.div>
          <div className="card-base p-7 md:p-10 grid md:grid-cols-[1fr_auto_1fr] gap-7 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-dim)" }}>Before UpRevi</p>
              <p className="font-display text-5xl md:text-6xl font-extrabold" style={{ color: "var(--navy)" }}>~$7</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>monthly Uber Eats revenue</p>
            </div>
            <ArrowRight className="hidden md:block" size={30} style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-dim)" }}>After optimization</p>
              <p className="font-display text-5xl md:text-6xl font-extrabold" style={{ color: "var(--green)" }}>~$2,000</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>average monthly Uber Eats revenue</p>
            </div>
            <p className="md:col-span-3 pt-6 border-t text-sm leading-relaxed" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Anonymized Washington coffee shop. Results reflect this client&apos;s reported platform revenue and are not a promise that every restaurant will achieve the same outcome.
            </p>
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
              Built for a different growth problem
            </h2>
            <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
              Direct-ordering platforms help restaurants build first-party channels. UpRevi begins by improving the DoorDash and Uber Eats channels customers already use.
            </p>
          </motion.div>

          <div className="card-base overflow-hidden">
            <div
              className="grid grid-cols-3 py-3.5 px-6 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ background: "var(--card-hover)", borderBottom: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text-dim)" }}>Feature</span>
              <span className="text-center" style={{ color: "var(--text-dim)" }}>Direct-ordering tools</span>
              <span className="text-center" style={{ color: "var(--accent)" }}>UPREVI</span>
            </div>
            <div className="px-6">
              <CompRow feature="Primary focus" them="First-party ordering" us="Marketplace growth" delay={0} />
              <CompRow feature="DoorDash/Uber Eats optimization" them="Not the core service" us="Core service" delay={0.04} />
              <CompRow feature="Hands-on menu restructuring" them="Varies" us="Included" delay={0.08} />
              <CompRow feature="Human strategy & account management" them="Varies" us="Included" delay={0.12} />
              <CompRow feature="Written performance guarantee" them="Varies" us="Included" delay={0.16} />
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
              <Link href="#book" className="btn-ghost w-full py-3.5 text-sm text-center block">
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
              <Link href="#book" className="btn-accent w-full py-3.5 text-sm text-center block">
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
          <FAQ q="What exactly does the guarantee mean?" a="The signed agreement defines the eligible platforms, measurement period, client responsibilities, and remedy if the agreed 20% gross delivery-revenue target is not reached. We document the baseline together before work begins." delay={0} />
          <FAQ q="How is the baseline calculated?" a="The program compares eligible gross delivery revenue against the prior 12-month monthly average, subject to the definitions and requirements in the signed agreement. We document the source data at kickoff so both sides work from the same baseline." delay={0.05} />
          <FAQ q="Do I need to be on DoorDash and UberEats already?" a="You need to be active on at least one platform. If you're only on one, we'll optimize that one and, if it makes sense, help you set up the other during the sprint." delay={0.1} />
          <FAQ q="Why focus on DoorDash and Uber Eats?" a="They are established discovery and ordering channels for many independent restaurants. UpRevi focuses on improving how your restaurant converts and earns within those marketplaces while you evaluate broader direct-ordering opportunities separately." delay={0.15} />
          <FAQ q="Do I have to sign up for the ongoing monthly plan after the sprint?" a="No. The sprint is a standalone engagement. At day 90 we'll present your results and tell you what continued support would look like, but there's no auto-enrollment and no obligation." delay={0.2} />
          <FAQ q="What if I'm already doing pretty well on delivery?" a="A stronger starting point changes the strategy. We review your current revenue, margins, menu structure, conversion opportunities, and operational capacity before confirming whether the program is a fit." delay={0.25} />
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
              href="#book"
              className="btn-cta-breathe px-10 py-4 text-base inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all"
              style={{ background: "#fff", color: "var(--navy)", boxShadow: "0 8px 28px rgba(0,0,0,0.28)" }}
            >
              Start your 90-day sprint
              <ArrowRight size={18} />
            </Link>
            <p className="mt-5 text-sm" style={{ color: "rgba(245,244,240,0.55)" }}>
              $99 onboarding · Payment plan available · Written agreement required
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Book a Free Audit ────────────────────────────────────────────────── */}
      <section
        id="book"
        className="py-24 px-6 section-raised"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--accent)" }}>
              Book a Free Audit
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4 tracking-tight" style={{ color: "var(--navy)" }}>
              See where your delivery revenue is leaking.
            </h2>
            <p className="text-lg mb-6 max-w-md" style={{ color: "var(--text-muted)" }}>
              A free, no-commitment review of your DoorDash and UberEats presence.
              We&apos;ll show you the gaps and exactly what the 90-day sprint would fix.
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                "Live walkthrough of your listings & menu",
                "Revenue opportunities ranked by impact",
                "Your 20% growth plan, mapped out",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Check size={15} style={{ color: "var(--accent)" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <AuditForm />
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
            <span>© 2026 UPREVI. All rights reserved.</span>
            <span>Built for independent restaurant operators.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
