import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Manrope } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { AppShell } from "@/components/chrome/AppShell";
import { bootScript } from "@/components/providers/BootProvider";
import { site } from "@/lib/site";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const description =
  "Sohan Singh is a 3D game artist in Delhi, India, creating game-ready hard-surface props, vehicles, weapons and environments — clean topology, optimized geometry, crisp bakes and PBR texturing.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Sohan Singh — 3D Game Artist · Hard Surface",
    template: "%s — Sohan Singh · 3D Game Artist",
  },
  description,
  keywords: ["3D game artist", "hard surface artist", "game props", "PBR texturing", "Substance 3D Painter", "Autodesk Maya", "Arnold", "portfolio", "Delhi"],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    siteName: `${site.name} — 3D Game Artist`,
    title: "Sohan Singh — 3D Game Artist",
    description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "Sohan Singh — 3D Game Artist", description },
};

export const viewport: Viewport = {
  themeColor: "#060607",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${manrope.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <noscript>
          <style>{`.boot-loader{display:none!important}.split-char{transform:none!important;opacity:1!important}`}</style>
        </noscript>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
