import type { Metadata } from "next";
import VisualLab from "./visual-lab";

export const metadata: Metadata = {
  title: "Visual lab — Sable Brain",
  robots: { index: false, follow: false },
};

export default function VisualLabPage() {
  return <VisualLab />;
}
