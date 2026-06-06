import type { MetadataRoute } from "next";

// Installable PWA manifest (master §4.3). The ordering experience is mobile-first
// and installable without an App Store build.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UPREVI Ordering",
    short_name: "UPREVI",
    description: "Order directly from your favorite restaurant.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#1E3A5F",
    icons: [
      { src: "/logo/UPREVI-mark.png", sizes: "466x445", type: "image/png", purpose: "any" },
    ],
  };
}
