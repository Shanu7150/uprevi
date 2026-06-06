/**
 * UPREVI brand tokens — single source of truth.
 *
 * Mirrored into `src/app/globals.css` `@theme` (Tailwind v4 has no
 * tailwind.config.ts) and consumed directly in TS where a literal color or
 * font family is needed. Keep the two in sync: edit here, then update the
 * matching CSS custom properties in globals.css.
 *
 * Brand rules (fixed): navy primary, gold accent, warm cream background,
 * Times New Roman (Tinos) for the wordmark/display, Inter for body.
 * "UPREVI" is always rendered all-caps.
 */

export const brandColors = {
  // ── Navy (primary) — values per master §9 ──
  navy: "#1E3A5F",
  navyDark: "#15293F",
  navyDeep: "#13263F", // darkest surface (footers, dark bands)
  navySoft: "#EAEFF6", // pale navy background (locked-state surfaces)
  navyHover: "#24456E",

  // ── Gold (accent) ──
  gold: "#9A7322",
  goldLight: "#B8923F",
  goldDark: "#7C5C18",
  goldSoft: "#F7F0E0",

  // ── Warm neutrals (tinted toward navy/gold, never pure black/white) ──
  bg: "#F4F1EA", // warm cream page background
  surface: "#FBFAF6", // raised cream
  card: "#FFFFFF",
  cardMuted: "#F7F4EC",

  // ── Ink / text (navy-tinted) ──
  ink: "#16202E", // primary text
  inkMuted: "#4A5568", // secondary text
  inkDim: "#7B8494", // tertiary / placeholders

  // ── Borders ──
  border: "#EAE5DC",
  borderLight: "#D6CFBC",

  // ── Status ──
  green: "#157A52",
  greenSoft: "#E6F4EC",
  red: "#C23B3B",
  blue: "#2D6CA8",
  amber: "#B8923F",
} as const;

export const brandFonts = {
  /** Display / wordmark — Times New Roman metric-compatible (Google: Tinos). */
  display: "var(--font-tinos), 'Times New Roman', Times, serif",
  /** Body / UI. */
  body: "var(--font-inter), system-ui, -apple-system, sans-serif",
} as const;

export const brand = {
  name: "UPREVI",
  colors: brandColors,
  fonts: brandFonts,
} as const;

export type BrandColor = keyof typeof brandColors;
