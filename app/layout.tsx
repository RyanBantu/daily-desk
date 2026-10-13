import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";
import { ImagePreview } from "@/components/ImagePreview";
import { StoreBoot } from "@/components/StoreBoot";
import { Toast } from "@/components/Toast";
import { STORAGE_KEY } from "@/lib/session";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  weight: ["600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Desk",
  description: "Demo school management portal. All data is stored in your browser.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.ico" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
};

const paletteScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");var p=s&&s.state&&s.state.db&&s.state.db.school&&s.state.db.school.palette;if(p)document.documentElement.setAttribute("data-palette",p)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-palette="blue" className={`${plexSans.variable} ${plexMono.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: paletteScript }} />
      </head>
      <body>
        <StoreBoot />
        {children}
        <Toast />
        <ImagePreview />
      </body>
    </html>
  );
}
