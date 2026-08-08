import type { Metadata } from "next";
import BotLab from "./bot-lab";

export const metadata: Metadata = {
  title: "Bot lab — Sable Brain",
  robots: { index: false, follow: false },
};

export default function BotLabPage() {
  return <BotLab />;
}
