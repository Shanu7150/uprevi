import type { Metadata } from "next";
import { Tinos, Inter } from "next/font/google";
import "./globals.css";

// Display / wordmark — Times New Roman metric-compatible.
const tinos = Tinos({
  subsets: ["latin"],
  variable: "--font-tinos",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body / UI.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPREVI — Restaurant Delivery Revenue Growth",
  description:
    "UPREVI helps independent restaurants grow DoorDash and Uber Eats revenue through hands-on menu, pricing, promotion, and listing optimization.",
  metadataBase: new URL("https://uprevi.com"),
  openGraph: {
    title: "UPREVI — 20% Delivery Revenue Growth Guaranteed",
    description:
      "A hands-on 90-day growth program for DoorDash and Uber Eats, backed by a written performance guarantee.",
    url: "https://uprevi.com",
    siteName: "UPREVI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPREVI — Restaurant Delivery Growth Guaranteed",
    description: "Hands-on DoorDash and Uber Eats optimization for independent restaurants.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${tinos.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
