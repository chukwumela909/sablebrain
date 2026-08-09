import type { GestureName } from "./bot-motion";

/** Index into the stage's rigs — 0 is the left bot, 1 the right. */
export type Speaker = 0 | 1;

export type Turn = {
  speaker: Speaker;
  text: string;
  /** Played on the speaker as the line appears. */
  gesture: GestureName;
  /** Played on the other bot — this is what makes them look responsive. */
  listener?: GestureName;
};

/** Rotated across runs so the loop doesn't repeat the same brief forever. */
const TOPICS = [
  "invoice approvals",
  "chasing signed contracts",
  "onboarding paperwork",
  "weekly status reports",
  "order-status emails",
];

let lastTopic = -1;

function nextTopic(): string {
  let i = Math.floor(Math.random() * TOPICS.length);
  if (i === lastTopic) i = (i + 1) % TOPICS.length;
  lastTopic = i;
  return TOPICS[i];
}

/** Longest topic that still fits a speech bubble without wrapping forever. */
const MAX_TOPIC = 48;

/**
 * Trim a typed topic down to something that fits in a bubble. React escapes
 * the value on render, so this is about layout, not safety.
 */
export function normaliseTopic(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return nextTopic();
  return clean.length > MAX_TOPIC ? `${clean.slice(0, MAX_TOPIC - 1).trimEnd()}…` : clean;
}

type Script = (topic: string) => Turn[];

const SCRIPTS: Script[] = [
  (topic) => [
    { speaker: 0, text: `Someone still does ${topic} by hand.`, gesture: "think", listener: "tilt" },
    { speaker: 1, text: "How many hours a week?", gesture: "tilt", listener: "shrug" },
    { speaker: 0, text: "Six. Every Monday morning.", gesture: "shrug", listener: "shake" },
    { speaker: 1, text: "We map it, build it, and it runs itself.", gesture: "point", listener: "nod" },
    { speaker: 0, text: "And the six hours?", gesture: "glance", listener: "heartbeat" },
    { speaker: 1, text: "Handed back.", gesture: "nod", listener: "wave" },
  ],
  (topic) => [
    { speaker: 1, text: `Show me where ${topic} breaks.`, gesture: "scan", listener: "think" },
    { speaker: 0, text: "It doesn't break. It just eats the week.", gesture: "shrug", listener: "nod" },
    { speaker: 1, text: "Worse. Nobody escalates a slow thing.", gesture: "alert", listener: "squint" },
    { speaker: 0, text: "So we watch one real cycle first.", gesture: "point", listener: "nod" },
    { speaker: 1, text: "Then automate what actually happened.", gesture: "nod", listener: "heartbeat" },
    { speaker: 0, text: "Not what the diagram claimed.", gesture: "wink", listener: "shake" },
  ],
  (topic) => [
    { speaker: 0, text: `Could you automate ${topic} by Friday?`, gesture: "tilt", listener: "think" },
    { speaker: 1, text: "The copying and filing, yes.", gesture: "nod", listener: "blink" },
    { speaker: 0, text: "And the judgement calls?", gesture: "squint", listener: "tilt" },
    { speaker: 1, text: "Those come to a human, flagged.", gesture: "alert", listener: "nod" },
    { speaker: 0, text: "That's the part people get wrong.", gesture: "shake", listener: "shrug" },
    { speaker: 1, text: "It's the only part that matters.", gesture: "leanIn", listener: "heartbeat" },
  ],
];

let lastScript = -1;

/**
 * Produce the exchange for a topic.
 *
 * Async on purpose: the body is scripted today, and swapping in a call to
 * `/api/bot-chat` later is a change to this function only. Everything
 * downstream already awaits it.
 */
export async function runConversation(topic = ""): Promise<Turn[]> {
  // Don't repeat the script we just used, so a second run visibly differs.
  let i = Math.floor(Math.random() * SCRIPTS.length);
  if (SCRIPTS.length > 1 && i === lastScript) i = (i + 1) % SCRIPTS.length;
  lastScript = i;
  return SCRIPTS[i](normaliseTopic(topic));
}

/** How long a line stays up, scaled to its length. */
export function dwellFor(text: string): number {
  return Math.min(4200, 1100 + text.length * 45);
}
