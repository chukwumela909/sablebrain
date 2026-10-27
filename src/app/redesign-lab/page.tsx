import type { Metadata } from "next";
import RedesignLab from "./redesign-lab";

export const metadata: Metadata = {
  title: "Redesign lab — Sable Brain",
  robots: { index: false, follow: false },
};

export default function RedesignLabPage() {
  return <RedesignLab />;
}
