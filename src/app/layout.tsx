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
    "We guarantee 20% delivery revenue growth in 90 days or you get a full refund + $100 cash. The only restaurant growth agency that optimizes DoorDash and UberEats.",
  metadataBase: new URL("https://uprevi.com"),
  openGraph: {
    title: "UPREVI — 20% Delivery Revenue Growth Guaranteed",
    description:
      "Guarantee: 20% growth in 90 days or full refund + $100 cash. We optimize DoorDash & UberEats so you earn more from every order.",
    url: "https://uprevi.com",
    siteName: "UPREVI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPREVI — Restaurant Delivery Growth Guaranteed",
    description: "20% growth in 90 days. Guaranteed. Or full refund + $100.",
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
