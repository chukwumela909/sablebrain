import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import CookieConsent from "./cookie-consent";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Coolvetica Rg — the wordmark's own face. LICENSE DEBT: the bundled free EULA
// covers desktop use only and does not grant web embedding. Shipped anyway
// while the site is early; buy a Typodermic web license before it matters.
const coolvetica = localFont({
  src: "./fonts/CoolveticaRg.otf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sable Brain | AI workflows that automate the boring work",
  description:
    "Sable Brain is an AI operations agency. We design and build AI workflows that take repetitive work off your team's plate.",
};

export const viewport: Viewport = {
  themeColor: "#081120",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${coolvetica.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
