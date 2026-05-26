"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { auth, setTokens } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await auth.login(email, password);
      if (res.success && res.data) {
        setTokens(res.data.tokens);
        router.push("/dashboard");
      } else {
        setError(res.error ?? "Invalid email or password.");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <Link href="/" className="block mb-8 text-center">
            <span
              className="font-display text-3xl font-bold tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              UPREVI
            </span>
          </Link>

          {/* Card */}
          <div className="card-base p-8">
            <h1 className="font-display text-2xl font-bold mb-1">
              Restaurant login
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Access your dashboard
            </p>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="input-base px-4 py-3 text-sm"
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base px-4 py-3 pr-11 text-sm w-full"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{
                    background: "var(--red-dim)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    color: "var(--red)",
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full py-3 text-sm mt-1 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-dim)" }}>
            Not a client yet?{" "}
            <Link
              href="/onboarding"
              style={{ color: "var(--accent)" }}
              className="hover:underline"
            >
              Start your 90-day sprint
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
