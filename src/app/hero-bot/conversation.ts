import type { GestureName } from "./bot-motion";
import { readSignals, type VisitorSignals } from "./signals";

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

/**
 * The gestures a bot may use mid-conversation. Deliberately excludes the
 * system and manual-only ones — `bootUp`, `powerDown`, `glitch`, and `spin`
 * all read as a malfunction rather than as body language, and a model asked
 * for "an expressive gesture" reaches for `glitch` far too happily.
 *
 * Shared with /api/bot-chat, which uses it as the schema enum and as the
 * allowlist when validating what came back.
 */
export const DIALOGUE_GESTURES = [
  "blink",
  "doubleBlink",
  "wink",
  "squint",
  "glance",
  "scan",
  "nod",
  "shake",
  "tilt",
  "leanIn",
  "hop",
  "wave",
  "shrug",
  "point",
  "think",
  "heartbeat",
  "ping",
  "alert",
] as const satisfies readonly GestureName[];

/** Keyed on a squashed form so "lean in" and "leanIn" both resolve. */
const GESTURE_LOOKUP: ReadonlyMap<string, GestureName> = new Map(
  DIALOGUE_GESTURES.map((name) => [name.toLowerCase(), name as GestureName]),
);

/**
 * The next three readers exist because `strict: true` on the structured-output
 * request is a request, not a guarantee — the open-weight model behind this
 * happily returns `lines` for `turns`, `listenerGesture` for `listener`, and
 * `"botA"` for speaker `0`, with the dialogue itself perfectly good. Rejecting
 * those outright threw away entire usable batches, so the aliases are absorbed
 * here instead. Anything genuinely unusable still fails.
 */
function turnList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of ["turns", "lines", "dialogue", "exchange"]) {
      const list = (value as Record<string, unknown>)[key];
      if (Array.isArray(list)) return list;
    }
  }
  return null;
}

function readSpeaker(value: unknown): Speaker | null {
  if (value === 0 || value === 1) return value;
  if (typeof value !== "string") return null;
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "0" || key === "a" || key === "bota" || key === "left") return 0;
  if (key === "1" || key === "b" || key === "botb" || key === "right") return 1;
  return null;
}

function readGesture(value: unknown): GestureName | null {
  if (typeof value !== "string") return null;
  return GESTURE_LOOKUP.get(value.toLowerCase().replace(/[^a-z]/g, "")) ?? null;
}

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

/** Longest line that still fits a bubble — the model is asked for less, but
 *  a long one has to be rejected rather than allowed to overflow the scene. */
export const MAX_LINE = 64;

/** Turns per exchange. Fewer reads as a fragment; more outlasts a scroll. */
export const TURNS_PER_EXCHANGE = 6;

/**
 * Trim a typed topic down to something that fits in a bubble. React escapes
 * the value on render, so this is about layout, not safety.
 */
export function normaliseTopic(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return nextTopic();
  return clean.length > MAX_TOPIC ? `${clean.slice(0, MAX_TOPIC - 1).trimEnd()}…` : clean;
}

/**
 * Accept a value only if it's an exchange the stage can actually play.
 *
 * The model is prompted for this shape and constrained by a JSON schema, but
 * a bad line here would put a bogus gesture name into `motion.fire()` or
 * overflow a bubble, so the boundary is checked rather than trusted. Used on
 * the server before an exchange enters the pool, and again on the client.
 */
export function parseTurns(value: unknown): Turn[] | null {
  const list = turnList(value);
  if (!list || list.length < 2) return null;

  const turns: Turn[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") return null;
    const row = raw as Record<string, unknown>;

    const speaker = readSpeaker(row.speaker ?? row.bot ?? row.who);
    const gesture = readGesture(row.gesture ?? row.speakerGesture);
    const listener = readGesture(row.listener ?? row.listenerGesture ?? row.reaction);
    const text = row.text ?? row.line ?? row.dialogue;

    if (speaker === null) return null;
    if (!gesture) return null;
    if (typeof text !== "string") return null;

    const line = text.replace(/\s+/g, " ").trim();
    if (!line || line.length > MAX_LINE) return null;

    turns.push({ speaker, text: line, gesture, listener: listener ?? undefined });
  }

  // Both bots have to talk, or one bubble never opens and the pair reads as
  // a monologue with a spectator.
  if (!turns.some((t) => t.speaker === 0) || !turns.some((t) => t.speaker === 1)) {
    return null;
  }
  return turns;
}

type Opener = { when: (s: VisitorSignals) => boolean; lines: (s: VisitorSignals) => Turn[] };

/**
 * The opener, written locally.
 *
 * A generated exchange takes the better part of ten seconds to come back, and
 * the bots standing mute through their own boot-up is a worse first
 * impression than a line that didn't come from a model. So the first thing a
 * visitor hears is assembled here, instantly, from the same signals the model
 * gets — and the generated gossip takes over from the second exchange on.
 *
 * These double as the outage path: no key, a timeout, or a rate limit leaves
 * the bots gossiping rather than leaves the hero silent.
 */
const OPENERS: Opener[] = [
  {
    when: (s) => s.hour >= 22 || s.hour < 5,
    lines: () => [
      { speaker: 1, text: "Someone's here. It's the middle of the night.", gesture: "glance", listener: "tilt" },
      { speaker: 0, text: "Nobody reads about automation at this hour.", gesture: "squint", listener: "shake" },
      { speaker: 1, text: "Not for fun, no.", gesture: "shrug", listener: "nod" },
      { speaker: 0, text: "Something's eating their week.", gesture: "think", listener: "leanIn" },
      { speaker: 1, text: "It always starts as one small task.", gesture: "point", listener: "nod" },
      { speaker: 0, text: "Then it owns every Monday.", gesture: "nod", listener: "heartbeat" },
    ],
  },
  {
    when: (s) => s.weekend,
    lines: (s) => [
      { speaker: 0, text: `They're here on a ${s.weekday}.`, gesture: "glance", listener: "squint" },
      { speaker: 1, text: "That's not a working day.", gesture: "tilt", listener: "shrug" },
      { speaker: 0, text: "Tell that to the backlog.", gesture: "shake", listener: "nod" },
      { speaker: 1, text: "Somebody's catching up on paperwork.", gesture: "think", listener: "nod" },
      { speaker: 0, text: "The copying and filing part.", gesture: "point", listener: "leanIn" },
      { speaker: 1, text: "Which is the part we take.", gesture: "nod", listener: "heartbeat" },
    ],
  },
  {
    when: (s) => s.arrival === "search",
    lines: () => [
      { speaker: 1, text: "They went looking for this.", gesture: "scan", listener: "leanIn" },
      { speaker: 0, text: "Nobody searches for automation idly.", gesture: "think", listener: "nod" },
      { speaker: 1, text: "So something's already gone wrong.", gesture: "squint", listener: "shake" },
      { speaker: 0, text: "Not wrong. Just slow, every week.", gesture: "shrug", listener: "tilt" },
      { speaker: 1, text: "Those are the ones nobody escalates.", gesture: "alert", listener: "nod" },
      { speaker: 0, text: "And the ones worth fixing first.", gesture: "point", listener: "heartbeat" },
    ],
  },
  {
    when: () => true,
    lines: () => [
      { speaker: 1, text: "Someone just walked in.", gesture: "glance", listener: "tilt" },
      { speaker: 0, text: "Straight to the top of the page.", gesture: "scan", listener: "nod" },
      { speaker: 1, text: "They're weighing something up.", gesture: "think", listener: "squint" },
      { speaker: 0, text: "Everyone arrives with the same list.", gesture: "shrug", listener: "leanIn" },
      { speaker: 1, text: "Invoices, forms, status emails.", gesture: "point", listener: "shake" },
      { speaker: 0, text: "All of it still copied by hand.", gesture: "nod", listener: "heartbeat" },
    ],
  },
];

let lastOpener = -1;

function localGossip(): Turn[] {
  let signals: VisitorSignals | null = null;
  try {
    signals = readSignals();
  } catch {
    // Server render or a locked-down browser — the catch-all opener holds.
  }

  const eligible = signals
    ? OPENERS.map((o, i) => [o, i] as const).filter(([o]) => o.when(signals))
    : [[OPENERS[OPENERS.length - 1], OPENERS.length - 1] as const];

  // Don't repeat the opener we just used, so a second run visibly differs.
  let pick = Math.floor(Math.random() * eligible.length);
  if (eligible.length > 1 && eligible[pick][1] === lastOpener) {
    pick = (pick + 1) % eligible.length;
  }
  const [opener, index] = eligible[pick];
  lastOpener = index;
  return opener.lines(signals ?? readSignalsFallback());
}

/** Only reached if `readSignals` threw, which means no DOM to read. */
function readSignalsFallback(): VisitorSignals {
  return {
    hour: 12,
    weekday: "Monday",
    weekend: false,
    arrival: "direct",
    reducedMotion: false,
    dwellSeconds: 0,
    section: "top",
  };
}

/**
 * Deliberately longer than the route's own upstream timeout, so the client is
 * never the one to give up first and throw away a batch the server is about to
 * return. Nothing on screen waits on this — a slow batch just means the gossip
 * starts an exchange or two later. It exists only so a wedged request
 * eventually releases and lets the next one try.
 */
const REQUEST_TIMEOUT = 95_000;

/**
 * Refill once the queue is down to its last exchange, so the request has a
 * full exchange of runway (~25s) to land in. Waiting until empty would leave
 * a gap the local opener has to cover.
 */
const REFILL_AT = 1;

/**
 * Exchanges already generated for this visitor.
 *
 * The lines are about whoever is on the page, so they can't be pooled on the
 * server and handed to the next person — the queue lives here instead. One
 * request buys a batch, which is why a visit costs a model call every few
 * exchanges rather than every exchange.
 */
const queue: Turn[][] = [];
let inFlight: Promise<void> | null = null;

async function requestBatch(topic: string): Promise<void> {
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch("/api/bot-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Read at request time, not at module load — a batch fetched four
      // minutes in should know it's four minutes in.
      body: JSON.stringify({ topic, signals: readSignals() }),
      signal: abort.signal,
    });
    if (!res.ok) return;
    const body = (await res.json()) as { exchanges?: unknown };
    if (!Array.isArray(body.exchanges)) return;
    for (const raw of body.exchanges) {
      const turns = parseTurns(raw);
      if (turns) queue.push(turns);
    }
  } catch {
    // Offline, aborted, or malformed — the caller falls back to a script.
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Top the queue up in the background, collapsing concurrent callers onto one
 * request. Deliberately not awaited by `runConversation` — see below.
 */
export function prefetchExchange(topic = ""): void {
  if (queue.length > REFILL_AT) return;
  inFlight ??= requestBatch(normaliseTopic(topic)).finally(() => {
    inFlight = null;
  });
}

/**
 * Produce the next exchange, without ever blocking on the network.
 *
 * A generated exchange takes the better part of ten seconds, and an exchange
 * runs for about twenty-five — so as long as something is queued by the time
 * the current one ends, the latency is invisible. Waiting here instead would
 * put that delay on screen as silence, which is why the first exchange is a
 * local opener and the generated gossip starts from the second.
 */
export function runConversation(topic = ""): Turn[] {
  const next = queue.shift();
  // Immediately start replacing whatever was just taken.
  prefetchExchange(topic);
  return next ?? localGossip();
}

/** How long a line stays up, scaled to its length. */
export function dwellFor(text: string): number {
  return Math.min(4200, 1100 + text.length * 45);
}
