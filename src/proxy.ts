import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Hostname routing (Next.js 16 renamed Middleware → Proxy).
 *
 * UPREVI serves four surfaces from one app, by subdomain:
 *   - uprevi.com            → marketing            (route group `(marketing)`)
 *   - app.uprevi.com        → client portal/admin  (`(portal)` / `(admin)`)
 *   - order.uprevi.com/{s}  → customer ordering PWA (`(order)`, rewritten to /order/{s})
 *
 * Local testing uses the matching *.localhost hosts, which browsers resolve to
 * 127.0.0.1 automatically:
 *   - http://localhost:3000
 *   - http://app.localhost:3000
 *   - http://order.localhost:3000/bella-cucina
 *
 * Auth here is OPTIMISTIC only (cookie presence). The real enforcement lives in
 * the server DAL / requireEntitlement — never trust this layer alone.
 */

type Surface = "marketing" | "portal" | "order";

function surfaceForHost(hostname: string): Surface {
  // Strip port, lowercase.
  const host = hostname.split(":")[0].toLowerCase();
  const labels = host.split(".");

  // Subdomain is the first label when there's more than the bare domain or
  // "localhost". e.g. app.localhost → ["app","localhost"]; app.uprevi.com → ["app","uprevi","com"].
  const sub = labels.length > 1 ? labels[0] : "";

  if (sub === "order") return "order";
  if (sub === "app") return "portal";
  return "marketing";
}

// NextAuth v5 session cookie (dev + secure variants).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => req.cookies.has(name));
}

// Paths that never require auth on the portal host.
const PORTAL_PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/api", "/_next"];

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const surface = surfaceForHost(req.headers.get("host") ?? "");

  // ── Order surface: map the bare slug to the internal /order/{slug} route ──
  if (surface === "order") {
    if (
      path === "/order" ||
      path.startsWith("/order/") ||
      path.startsWith("/api") ||
      path.startsWith("/_next")
    ) {
      return NextResponse.next();
    }
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = path === "/" ? "/order" : `/order${path}`;
    return NextResponse.rewrite(rewritten);
  }

  // ── Portal surface: optimistic auth redirect ──
  if (surface === "portal") {
    const isPublic = PORTAL_PUBLIC_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
    if (!isPublic && !hasSessionCookie(req)) {
      const signIn = req.nextUrl.clone();
      signIn.pathname = "/sign-in";
      signIn.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signIn);
    }
    return NextResponse.next();
  }

  // ── Marketing surface: pass through ──
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and obvious static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
