import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Desk",
    short_name: "Daily Desk",
    start_url: "/",
    display: "standalone",
    theme_color: "#1F5BC6",
    background_color: "#F7F8FA",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
