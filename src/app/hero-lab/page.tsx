import type { Metadata } from "next";
import HeroLab from "./hero-lab";

export const metadata: Metadata = {
  title: "Hero lab — Sable Brain",
  robots: { index: false, follow: false },
};

export default function HeroLabPage() {
  return <HeroLab />;
}
