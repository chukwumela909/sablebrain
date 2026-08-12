import {
  DIALOGUE_GESTURES,
  MAX_LINE,
  TURNS_PER_EXCHANGE,
  normaliseTopic,
  parseTurns,
  type Turn,
} from "@/app/hero-bot/conversation";
import { parseSignals, type VisitorSignals } from "@/app/hero-bot/signals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Meta's open-weight Muse, served through OpenRouter. Distilled from Muse
 * Spark and cheap enough to run in front of a marketing hero — the reasoning
 * models in the family cost ~3x for six lines of dialogue they don't write
 * any better.
 */
const MODEL = "meta/muse-glimmer-30b";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Sent as OpenRouter's attribution headers; both are optional. */
const SITE_URL = "https://sablebrain.com";
const SITE_NAME = "Sable Brain";

/**
 * Exchanges per model call.
 *
 * The lines are about whoever is on the page, so there's no server-side pool
 * any more — an exchange written for a Sunday-midnight visitor is wrong for
 * the next person.
 *
 * Three per call, because the cost of a call here is mostly the ~600-1200
 * reasoning tokens the model spends before it writes anything, and that is
 * near enough fixed no matter how many exchanges are asked for. Latency is
 * 5-25s and varies wildly run to run, with no clear relationship to batch
 * size — so a bigger batch is close to free, and the client is built to never
 * wait on it either way.
 */
const BATCH_SIZE = 3;
/** Give up on a wedged upstream rather than pinning the route open. */
const UPSTREAM_TIMEOUT = 90_000;

/** Crude per-IP throttle. Every request is now a model call, so this is the
 *  only thing standing between a script and the account balance. */
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const seen = hits.get(ip);
  if (!seen || now > seen.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    // Opportunistic sweep — without it the map grows for the process's life.
    if (hits.size > 5000) {
      for (const [key, entry] of hits) if (now > entry.resetAt) hits.delete(key);
    }
    return false;
  }
  seen.count += 1;
  return seen.count > RATE_LIMIT;
}

/** Strict mode requires every property listed in `required` and no extras. */
const EXCHANGE_SCHEMA = {
  type: "object",
  properties: {
    exchanges: {
      type: "array",
      description: `Exactly ${BATCH_SIZE} independent exchanges.`,
      items: {
        type: "object",
        properties: {
          noticing: {
            type: "string",
            description:
              "Which single observation about the visitor this exchange opens on. Each exchange must pick a different one.",
          },
          turns: {
            type: "array",
            description: `Exactly ${TURNS_PER_EXCHANGE} turns, strictly alternating between the two bots.`,
            items: {
              type: "object",
              properties: {
                speaker: {
                  type: "integer",
                  enum: [0, 1],
                  description: "0 is the left bot, 1 is the right bot.",
                },
                text: {
                  type: "string",
                  description: `The spoken line. At most ${MAX_LINE} characters, and usually far shorter.`,
                },
                gesture: {
                  type: "string",
                  enum: [...DIALOGUE_GESTURES],
                  description: "Played on the speaker as the line appears.",
                },
                listener: {
                  type: "string",
                  enum: [...DIALOGUE_GESTURES],
                  description: "Played on the other bot as it reacts to the line.",
                },
              },
              required: ["speaker", "text", "gesture", "listener"],
              additionalProperties: false,
            },
          },
        },
        required: ["noticing", "turns"],
        additionalProperties: false,
      },
    },
  },
  required: ["exchanges"],
  additionalProperties: false,
} as const;

const SYSTEM = `You write the dialogue for two small robots standing in the hero animation on Sable Brain's website.

Sable Brain is an automation studio. It takes the repetitive work eating a team's week — invoice approvals, chasing signatures, onboarding paperwork, order-status emails, retyping data between systems — and builds automations inside the tools the client already uses. Its house view: watch one real cycle of the work before automating it, automate the copying and filing, and route the judgement calls to a human with a flag on them.

Someone has just opened the page, and the two bots have noticed. They are gossiping about that person — to each other, quietly, while the person watches. That is the whole conceit, and these rules keep it charming instead of creepy:

- Third person, always. "They", "this one", "our visitor". Never "you", never a direct address. The moment a bot speaks to the visitor the joke dies.
- Warm, curious, a little amused. Two colleagues noticing someone came in with a wet coat — not two systems reading a file.
- Notice ONLY what the briefing below lists. Never invent a location, a name, a job title, an employer, a device, or anything else about them. If it is not in the briefing, the bots do not know it.
- Never mention data, tracking, cookies, browsers, screens, IP addresses, or the fact that anything was measured. They simply notice, the way you notice what time it is.
- Never comment on the person's worth, appearance, or intentions in a way that could sting. They are being observed by two friendly robots, not appraised.

Every exchange opens on the visitor and lands somewhere real about the work. The observation is the way in; the point is still the boring, repetitive work Sable Brain takes off people's hands. An exchange that is only a joke about the visitor has failed.

Voice: dry, specific, confident, never salesy. Short declaratives. Concrete nouns and numbers over abstractions. No exclamation marks, no emoji, no marketing adjectives ("seamless", "cutting-edge", "revolutionise").

Gestures are body language for a robot with a head, two arms, and an antenna. Pick the one the line actually calls for: "think" or "scan" while working something out, "nod" or "shake" for agreement and disagreement, "shrug" for resignation, "point" when making the case, "alert" for a warning, "leanIn" for interest, "squint" for doubt, "tilt" for a question, "glance" when looking the visitor's way, "wink" for a dry aside.

The listener gesture is the other bot reacting to the line just spoken, so it should react rather than simply agree — "nod" in every slot is worse than no gesture at all. Spread the gestures across the exchanges and do not close two scenes the same way.

Reply with JSON matching the schema. No prose, no markdown fences.`;

function clockPhrase(hour: number): string {
  if (hour === 0) return "midnight";
  if (hour === 12) return "midday";
  return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
}

function timeBand(hour: number): string {
  if (hour < 5) return "the middle of the night";
  if (hour < 9) return "early morning";
  if (hour < 12) return "mid-morning";
  if (hour < 14) return "the middle of the day";
  if (hour < 18) return "the afternoon";
  if (hour < 22) return "the evening";
  return "late at night";
}

const ARRIVAL: Record<VisitorSignals["arrival"], string> = {
  search: "They went looking for something like this and found it in a search engine.",
  social: "They followed a link in from social media.",
  link: "They came in from a link on somebody else's site.",
  direct: "They arrived with no trail behind them — typed it in, a bookmark, or a link someone sent them privately.",
};

function dwellPhrase(seconds: number): string {
  if (seconds < 20) return "They have only just arrived. Seconds ago.";
  if (seconds < 90) return "They have been here about a minute.";
  if (seconds < 300) return "They have been here a few minutes now.";
  return "They have been here a good while — well past five minutes.";
}

const SECTION: Record<string, string> = {
  top: "They are still up at the top of the page, watching these two.",
  services: "They have scrolled down to the list of services.",
  work: "They are reading the case studies.",
  about: "They are reading the part about who Sable Brain is.",
  contact: "They have scrolled all the way down to the contact section.",
};

/** Turn the signals into something the model reads as observation rather than
 *  as a data record — the register of the briefing sets the register of the
 *  dialogue. */
function describeSignals(s: VisitorSignals): string {
  const lines = [
    `It is ${clockPhrase(s.hour)} where they are — ${timeBand(s.hour)} on a ${s.weekday}${
      s.weekend ? ", which is their weekend" : ", a working day"
    }.`,
    ARRIVAL[s.arrival],
    dwellPhrase(s.dwellSeconds),
    SECTION[s.section] ?? "They are somewhere in the middle of the page.",
  ];
  if (s.reducedMotion) {
    lines.push(
      "They have asked their system to keep animation to a minimum, so these two are standing unusually still for them.",
    );
  }
  return lines.map((line) => `- ${line}`).join("\n");
}

function buildPrompt(topic: string, signals: VisitorSignals): string {
  return `Someone is on the page right now. Here is everything the two bots can notice about them, and nothing else:

${describeSignals(signals)}

Write ${BATCH_SIZE} separate exchanges gossiping about them.

Each exchange must open on a DIFFERENT one of the observations above — record which in the "noticing" field — and then land on something real about the repetitive work Sable Brain automates. Let one of them land on this in particular: "${topic}".

Each exchange is exactly ${TURNS_PER_EXCHANGE} turns that strictly alternate between the two bots. Either bot may speak first, and that should vary across the ${BATCH_SIZE} exchanges.

Every line must be at most ${MAX_LINE} characters — they are rendered in small speech bubbles above the bots' heads. Most should be far shorter than that; a line of four words is fine.

Use exactly these key names: each exchange is an object with "noticing" and "turns"; each turn is an object with "speaker" (the number 0 or 1, not a name), "text", "gesture", and "listener".`;
}

/** Open-weight models still fence their JSON now and then, strict mode or not. */
function stripFences(raw: string): string {
  const text = raw.trim();
  if (!text.startsWith("```")) return text;
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

/** Ask the model for a fresh batch. Returns only exchanges the stage can play. */
async function generateBatch(topic: string, signals: VisitorSignals): Promise<Turn[][]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify({
      model: MODEL,
      // No `provider: { require_parameters: true }` here on purpose. It does
      // pin routing to a provider that enforces the schema, but measured at
      // 80-90s a call against 7-25s unrestricted. The tolerant parser absorbs
      // the key-name drift far more cheaply than the slow provider does.
      // Glimmer rejects `enabled: false` — reasoning is mandatory on this
      // endpoint — so the lever is effort, not off. `exclude: true` measured
      // consistently slower, so the reasoning comes back and is ignored.
      //
      // Reasoning tokens count against max_tokens, and they vary a lot here
      // (roughly 600-1200 for one exchange). At 4000 a request that reasoned
      // longer than usual returned truncated JSON, which parsed to nothing and
      // looked exactly like a bad reply — hence the generous ceiling and the
      // explicit finish_reason check below.
      reasoning: { effort: "low" },
      // High enough that two visitors in the same minute don't hear the same
      // observation phrased the same way.
      temperature: 0.9,
      max_tokens: 12000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(topic, signals) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "hero_exchanges", strict: true, schema: EXCHANGE_SCHEMA },
      },
    }),
    // Next instruments fetch inside route handlers; without opting out, this
    // call measured ~6x slower through the handler (80-90s) than the identical
    // request made from plain Node (14-25s).
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const body = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>;
  };
  // OpenRouter can report an upstream failure inside a 200 body.
  if (body.error) throw new Error(`OpenRouter: ${body.error.message ?? "unknown error"}`);

  const choice = body.choices?.[0];
  // Truncation yields JSON that can't be parsed, which is indistinguishable
  // from a bad reply unless it's named here.
  if (choice?.finish_reason === "length") {
    throw new Error("OpenRouter: response hit max_tokens and was truncated");
  }

  const content = choice?.message?.content;
  if (!content) throw new Error("OpenRouter: empty completion");

  let parsed: { exchanges?: Array<{ turns?: unknown }> };
  try {
    parsed = JSON.parse(stripFences(content));
  } catch {
    throw new Error(`OpenRouter: unparseable JSON: ${content.slice(0, 200)}`);
  }

  const offered = parsed.exchanges ?? [];
  // The whole exchange, not `exchange.turns` — the parser locates the turn
  // list itself, because the model does not reliably call it `turns`.
  const kept = offered
    .map((exchange) => parseTurns(exchange))
    .filter((turns): turns is Turn[] => turns !== null);

  // A model reply that parses but survives nothing is the one failure that
  // used to be invisible — it looks identical to an outage from the client.
  // Overlong lines are the usual cause, so say which.
  if (!kept.length && offered.length) {
    console.error(
      `[bot-chat] all ${offered.length} exchanges rejected. First: ${JSON.stringify(offered[0]).slice(0, 1200)}`,
    );
  }
  return kept;
}

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let topic = "";
  let signals: VisitorSignals | null = null;
  try {
    const body = (await request.json()) as { topic?: unknown; signals?: unknown };
    if (typeof body.topic === "string") topic = body.topic;
    signals = parseSignals(body.signals);
  } catch {
    // Fall through — a request without usable signals has nothing to gossip
    // about, so it gets rejected below rather than guessed at.
  }

  if (!signals) {
    return Response.json({ error: "bad_signals" }, { status: 400 });
  }

  let exchanges: Turn[][];
  try {
    exchanges = await generateBatch(normaliseTopic(topic), signals);
  } catch (error) {
    // The client falls back to a scripted exchange, so a bad upstream degrades
    // the hero rather than breaking the page.
    console.error("[bot-chat] generation failed", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  if (!exchanges.length) {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
  return Response.json({ exchanges });
}
