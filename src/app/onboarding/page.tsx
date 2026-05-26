"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Building2,
  User,
  TrendingUp,
  PartyPopper,
} from "lucide-react";
import { restaurants } from "@/lib/api";
import type { OnboardingData } from "@/lib/types";

const STEPS = [
  { label: "Contact", icon: User },
  { label: "Restaurant", icon: Building2 },
  { label: "Revenue", icon: TrendingUp },
  { label: "Confirm", icon: PartyPopper },
];

const CUISINE_TYPES = [
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "Mediterranean",
  "BBQ",
  "Pizza",
  "Burgers",
  "Sandwiches",
  "Seafood",
  "Vegetarian/Vegan",
  "Caribbean",
  "Korean",
  "Other",
];

const REVENUE_RANGES = [
  "Under $2,000/mo",
  "$2,000 – $5,000/mo",
  "$5,000 – $10,000/mo",
  "$10,000 – $20,000/mo",
  "$20,000 – $50,000/mo",
  "Over $50,000/mo",
];

const GOALS = [
  "Increase order volume",
  "Increase average order value",
  "Improve DoorDash ranking",
  "Improve UberEats ranking",
  "Reduce refund rate",
  "Build a loyal repeat customer base",
];

const CHALLENGES = [
  "Low order volume despite being listed",
  "High refund/cancellation rate",
  "Poor listing visibility",
  "Negative reviews hurting conversions",
  "Competitor undercutting my prices",
  "Promotions not driving results",
  "Not sure — need an audit",
];

const EMPTY: OnboardingData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  restaurantName: "",
  cuisineType: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  onDoorDash: false,
  onUberEats: false,
  monthlyDeliveryRevenue: "",
  primaryGoal: "",
  biggestChallenge: "",
  plan: "installments",
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base px-4 py-3 text-sm"
      style={error ? { borderColor: "var(--red)" } : {}}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base px-4 py-3 text-sm appearance-none w-full"
        style={error ? { borderColor: "var(--red)" } : {}}
      >
        {placeholder && (
          <option value="" disabled style={{ color: "var(--text-dim)" }}>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "var(--card)", color: "var(--text)" }}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-dim)" }}
      />
    </div>
  );
}

// ── Toggle chip ───────────────────────────────────────────────────────────────
function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: selected ? "var(--accent-dim)" : "var(--card-hover)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        color: selected ? "var(--accent)" : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

// ── Platform toggle (big) ─────────────────────────────────────────────────────
function PlatformToggle({
  name,
  description,
  selected,
  onClick,
}: {
  name: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-xl text-left transition-all w-full"
      style={{
        background: selected ? "var(--accent-dim)" : "var(--card-hover)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0"
        style={{
          background: selected ? "var(--accent)" : "transparent",
          border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-light)"}`,
        }}
      >
        {selected && <Check size={11} color="white" />}
      </div>
      <div>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
          {description}
        </p>
      </div>
    </button>
  );
}

// ── Step 1: Contact ───────────────────────────────────────────────────────────
function Step1({
  data,
  setData,
  errors,
}: {
  data: OnboardingData;
  setData: (d: OnboardingData) => void;
  errors: Partial<Record<keyof OnboardingData, string>>;
}) {
  const set = (key: keyof OnboardingData) => (v: string) =>
    setData({ ...data, [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">
          Let&apos;s get acquainted
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This takes 2 minutes. No payment yet — just tell us about yourself.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" error={errors.firstName}>
          <Input
            value={data.firstName}
            onChange={set("firstName")}
            placeholder="Marco"
            error={!!errors.firstName}
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <Input
            value={data.lastName}
            onChange={set("lastName")}
            placeholder="Esposito"
            error={!!errors.lastName}
          />
        </Field>
      </div>

      <Field label="Email address" error={errors.email}>
        <Input
          value={data.email}
          onChange={set("email")}
          placeholder="marco@bellacucina.com"
          type="email"
          error={!!errors.email}
        />
      </Field>

      <Field label="Phone number" error={errors.phone}>
        <Input
          value={data.phone}
          onChange={set("phone")}
          placeholder="+1 (555) 000-0000"
          type="tel"
          error={!!errors.phone}
        />
      </Field>

      <div
        className="p-4 rounded-xl text-sm"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid rgba(232,114,42,0.2)",
          color: "var(--text-muted)",
        }}
      >
        We will never sell your information. Your details are only used to
        schedule your onboarding call.
      </div>
    </div>
  );
}

// ── Step 2: Restaurant ────────────────────────────────────────────────────────
function Step2({
  data,
  setData,
  errors,
}: {
  data: OnboardingData;
  setData: (d: OnboardingData) => void;
  errors: Partial<Record<keyof OnboardingData, string>>;
}) {
  const set = (key: keyof OnboardingData) => (v: string) =>
    setData({ ...data, [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">
          About your restaurant
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Tell us where you operate and which platforms you&apos;re on.
        </p>
      </div>

      <Field label="Restaurant name" error={errors.restaurantName}>
        <Input
          value={data.restaurantName}
          onChange={set("restaurantName")}
          placeholder="Bella Cucina"
          error={!!errors.restaurantName}
        />
      </Field>

      <Field label="Cuisine type" error={errors.cuisineType}>
        <Select
          value={data.cuisineType}
          onChange={set("cuisineType")}
          options={CUISINE_TYPES}
          placeholder="Select cuisine type"
          error={!!errors.cuisineType}
        />
      </Field>

      <Field label="Street address">
        <Input
          value={data.address}
          onChange={set("address")}
          placeholder="123 Main St"
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Field label="City">
            <Input value={data.city} onChange={set("city")} placeholder="Chicago" />
          </Field>
        </div>
        <div>
          <Field label="State">
            <Input value={data.state} onChange={set("state")} placeholder="IL" />
          </Field>
        </div>
        <div>
          <Field label="ZIP">
            <Input value={data.zip} onChange={set("zip")} placeholder="60601" />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          Which platforms are you on?{" "}
          <span style={{ color: "var(--red)" }}>
            {errors.onDoorDash || errors.onUberEats
              ? "Select at least one"
              : ""}
          </span>
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <PlatformToggle
            name="DoorDash"
            description="Already active on DoorDash Marketplace"
            selected={data.onDoorDash}
            onClick={() => setData({ ...data, onDoorDash: !data.onDoorDash })}
          />
          <PlatformToggle
            name="UberEats"
            description="Already active on Uber Eats Marketplace"
            selected={data.onUberEats}
            onClick={() => setData({ ...data, onUberEats: !data.onUberEats })}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Revenue & Goals ───────────────────────────────────────────────────
function Step3({
  data,
  setData,
  errors,
}: {
  data: OnboardingData;
  setData: (d: OnboardingData) => void;
  errors: Partial<Record<keyof OnboardingData, string>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">
          Revenue & goals
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This helps us set your baseline and target. Everything is confidential.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          Current monthly delivery revenue{" "}
          {errors.monthlyDeliveryRevenue && (
            <span style={{ color: "var(--red)" }}>Required</span>
          )}
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {REVENUE_RANGES.map((r) => (
            <ToggleChip
              key={r}
              label={r}
              selected={data.monthlyDeliveryRevenue === r}
              onClick={() =>
                setData({ ...data, monthlyDeliveryRevenue: r })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          Primary growth goal{" "}
          {errors.primaryGoal && (
            <span style={{ color: "var(--red)" }}>Required</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <ToggleChip
              key={g}
              label={g}
              selected={data.primaryGoal === g}
              onClick={() => setData({ ...data, primaryGoal: g })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          Biggest challenge right now{" "}
          {errors.biggestChallenge && (
            <span style={{ color: "var(--red)" }}>Required</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {CHALLENGES.map((c) => (
            <ToggleChip
              key={c}
              label={c}
              selected={data.biggestChallenge === c}
              onClick={() => setData({ ...data, biggestChallenge: c })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Confirm & Pay ─────────────────────────────────────────────────────
function Step4({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: OnboardingData) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">
          Choose your start
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Both plans include the full 90-day sprint and the guarantee.
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setData({ ...data, plan: "installments" })}
          className="flex flex-col gap-3 p-5 rounded-xl text-left transition-all relative"
          style={{
            background:
              data.plan === "installments" ? "var(--accent-dim)" : "var(--card-hover)",
            border: `2px solid ${
              data.plan === "installments" ? "var(--accent)" : "var(--border)"
            }`,
          }}
        >
          {data.plan === "installments" && (
            <div
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Check size={11} color="white" />
            </div>
          )}
          <div
            className="badge text-xs"
            style={{ background: "var(--accent)", color: "white", width: "fit-content" }}
          >
            Most popular
          </div>
          <div>
            <p className="font-semibold mb-0.5">Payment plan</p>
            <p
              className="font-display text-3xl font-bold"
              style={{ color: "var(--accent)" }}
            >
              $99
              <span
                className="text-sm font-normal ml-1"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-outfit)" }}
              >
                down
              </span>
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              then 4 × ~$478 · $1,990 total
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--accent)" }} /> Low barrier to start
            </li>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--accent)" }} /> Full sprint included
            </li>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--accent)" }} /> Guarantee still applies
            </li>
          </ul>
        </button>

        <button
          type="button"
          onClick={() => setData({ ...data, plan: "upfront" })}
          className="flex flex-col gap-3 p-5 rounded-xl text-left transition-all relative"
          style={{
            background:
              data.plan === "upfront" ? "var(--accent-dim)" : "var(--card-hover)",
            border: `2px solid ${
              data.plan === "upfront" ? "var(--accent)" : "var(--border)"
            }`,
          }}
        >
          {data.plan === "upfront" && (
            <div
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Check size={11} color="white" />
            </div>
          )}
          <div
            className="badge text-xs"
            style={{ background: "var(--green-dim)", color: "var(--green)", width: "fit-content" }}
          >
            Save $295
          </div>
          <div>
            <p className="font-semibold mb-0.5">Pay upfront</p>
            <p className="font-display text-3xl font-bold">$1,695</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              one-time payment
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--green)" }} /> Best value — save $295
            </li>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--green)" }} /> Full sprint included
            </li>
            <li className="flex gap-1.5 items-center">
              <Check size={11} style={{ color: "var(--green)" }} /> Guarantee still applies
            </li>
          </ul>
        </button>
      </div>

      {/* Summary */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--card-hover)", border: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--text-dim)" }}
        >
          Your summary
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Name</span>
            <span className="font-medium">
              {data.firstName} {data.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Email</span>
            <span className="font-medium">{data.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Restaurant</span>
            <span className="font-medium">{data.restaurantName}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Platforms</span>
            <span className="font-medium">
              {[data.onDoorDash && "DoorDash", data.onUberEats && "UberEats"]
                .filter(Boolean)
                .join(" + ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Monthly revenue</span>
            <span className="font-medium">{data.monthlyDeliveryRevenue}</span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div
        className="rounded-xl p-5 text-sm"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid rgba(232,114,42,0.2)",
        }}
      >
        <p className="font-semibold mb-3" style={{ color: "var(--accent)" }}>
          What happens after you submit
        </p>
        <ol className="space-y-2 list-decimal list-inside" style={{ color: "var(--text-muted)" }}>
          <li>You&apos;ll receive a confirmation email within 5 minutes</li>
          <li>
            We&apos;ll call or text you within 1 business day to schedule your
            onboarding call
          </li>
          <li>
            On the onboarding call, we set your baseline and issue your first
            invoice
          </li>
          <li>
            No payment is charged until after your onboarding call confirms the
            fit
          </li>
        </ol>
      </div>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(step: number, data: OnboardingData) {
  const errors: Partial<Record<keyof OnboardingData, string>> = {};
  if (step === 0) {
    if (!data.firstName.trim()) errors.firstName = "Required";
    if (!data.lastName.trim()) errors.lastName = "Required";
    if (!data.email.trim() || !data.email.includes("@"))
      errors.email = "Valid email required";
    if (!data.phone.trim()) errors.phone = "Required";
  }
  if (step === 1) {
    if (!data.restaurantName.trim()) errors.restaurantName = "Required";
    if (!data.cuisineType) errors.cuisineType = "Required";
    if (!data.onDoorDash && !data.onUberEats)
      errors.onDoorDash = "Select at least one platform";
  }
  if (step === 2) {
    if (!data.monthlyDeliveryRevenue)
      errors.monthlyDeliveryRevenue = "Required";
    if (!data.primaryGoal) errors.primaryGoal = "Required";
    if (!data.biggestChallenge) errors.biggestChallenge = "Required";
  }
  return errors;
}

// ── Main component ────────────────────────────────────────────────────────────
function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPlan =
    searchParams.get("plan") === "upfront" ? "upfront" : "installments";

  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...EMPTY,
    plan: initialPlan,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  const next = () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setApiError("");
    try {
      const res = await restaurants.onboard(data);
      if (res.success) {
        setSubmitted(true);
      } else {
        setApiError(res.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "var(--bg)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full text-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--accent-dim)", border: "2px solid var(--accent)" }}
          >
            <PartyPopper size={32} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">
            You&apos;re in!
          </h1>
          <p
            className="text-lg mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Welcome to UPREVI, {data.firstName}.
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--text-dim)" }}>
            We&apos;ll reach out within 1 business day to schedule your
            onboarding call. Check your email for a confirmation from us.
          </p>
          <div className="space-y-3">
            {[
              "Confirmation email sent to " + data.email,
              "Onboarding call scheduled within 1 business day",
              "No payment until after your call",
              "20% growth guarantee starts day 1 of sprint",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-left"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Check size={14} style={{ color: "var(--green)", flexShrink: 0 }} />
                <span style={{ color: "var(--text-muted)" }}>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/")}
            className="btn-ghost mt-8 px-8 py-3 text-sm"
          >
            Back to home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 h-16 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          UPREVI
        </Link>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Step {step + 1} of 4
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar steps (desktop) */}
        <div
          className="hidden lg:flex flex-col w-64 shrink-0 p-8 gap-8"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              Getting started
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Takes about 2 minutes
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {STEPS.map(({ label, icon: Icon }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  background:
                    i === step ? "var(--accent-dim)" : "transparent",
                  border: `1px solid ${
                    i === step
                      ? "rgba(232,114,42,0.3)"
                      : "transparent"
                  }`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    background:
                      i < step
                        ? "var(--green)"
                        : i === step
                        ? "var(--accent)"
                        : "var(--card-hover)",
                    color: i <= step ? "white" : "var(--text-dim)",
                    border: `1px solid ${
                      i < step
                        ? "var(--green)"
                        : i === step
                        ? "var(--accent)"
                        : "var(--border)"
                    }`,
                  }}
                >
                  {i < step ? <Check size={12} /> : <Icon size={12} />}
                </div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color:
                      i === step ? "var(--accent)" : i < step ? "var(--text)" : "var(--text-dim)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Guarantee reminder */}
          <div
            className="mt-auto p-4 rounded-xl text-xs"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-dim)",
            }}
          >
            <p className="font-semibold mb-1" style={{ color: "var(--gold)" }}>
              The Guarantee
            </p>
            20% delivery revenue growth in 90 days or full refund + $100 cash.
            No questions asked.
          </div>
        </div>

        {/* Main form area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Progress bar (mobile) */}
          <div className="lg:hidden h-1 w-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${((step + 1) / 4) * 100}%`,
                background: "var(--accent)",
              }}
            />
          </div>

          <div className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && (
                  <Step1 data={data} setData={setData} errors={errors} />
                )}
                {step === 1 && (
                  <Step2 data={data} setData={setData} errors={errors} />
                )}
                {step === 2 && (
                  <Step3 data={data} setData={setData} errors={errors} />
                )}
                {step === 3 && <Step4 data={data} setData={setData} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={back}
                disabled={step === 0}
                className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30"
              >
                <ArrowLeft size={15} />
                Back
              </button>

              {apiError && (
                <p
                  className="text-xs text-center flex-1 px-4"
                  style={{ color: "var(--red)" }}
                >
                  {apiError}
                </p>
              )}

              {step < 3 ? (
                <button
                  onClick={next}
                  className="btn-accent px-5 py-2.5 text-sm"
                >
                  Continue
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn-accent px-6 py-2.5 text-sm disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit & get started"}
                  {!submitting && <ArrowRight size={15} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)" }}
          />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
