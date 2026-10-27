"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Geist, JetBrains_Mono, Newsreader } from "next/font/google";
import styles from "./redesign-lab.module.css";
import { E, clamp01, hitPulse, mix, prog, useRunClock } from "./motion";
import { Plant } from "./machines";
import { PARTICLES } from "./particles";

// A faithful build of the pen.dev redesign (node dsolx, "Sable palette").
// Values come from the design's own export; keep them in step with it.
// The design renders Newsreader with its optical-size axis (tighter at
// display sizes); next/font only ships that axis when asked.
const serif = Newsreader({ variable: "--rl-serif", subsets: ["latin"], display: "swap", axes: ["opsz"] });
const sans = Geist({ variable: "--rl-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--rl-mono", subsets: ["latin"], display: "swap" });

/* Lucide-style strokes, inlined so the lab needs no icon dependency. */
const ICONS: Record<string, string> = {
  sparkles:
    "M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z",
  arrowUpRight: "M7 7h10v10M7 17 17 7",
  workflow: "M3 3h8v8H3zM13 13h8v8h-8zM7 11v4a2 2 0 0 0 2 2h4",
  plug: "M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8",
  bot: "M12 8V4H8M4 8h16v12H4zM2 14h2M20 14h2M15 13v2M9 13v2",
  check: "M20 6 9 17l-5-5",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  mail: "M2 4h20v16H2zM22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  table: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  truck:
    "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38A1 1 0 0 0 17.52 9H14M7 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  map: "M14.1 5.9 9.9 3.8a2 2 0 0 0-1.8 0L3.6 6.1A1 1 0 0 0 3 7v12.4a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V4.6a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0zM15 5.8v15M9 3.2v15",
  refresh:
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5",
  building:
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4",
  briefcase: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 6h20v14H2z",
  code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
};

function Icon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

// Hero stack, after paypath.ai: each tab cycles its four cards, then hands on
// to the next tab. Cards are [title, detail, chip, icon].
const HERO_TABS = {
  Workflows: [
    ["Invoice routed to finance", "Checked against the CRM · PO-2291", "Automated", "workflow"],
    ["Support inbox volume cut 54%", "1,212 of 2,240 tickets resolved", "Live", "inbox"],
    ["Intake form filed in 40 seconds", "14 fields extracted · nothing retyped", "Done", "file"],
    ["Mismatch flagged for review", "1 of 318 runs needed a human", "Review", "user"],
  ],
  Integrations: [
    ["4 tools connected, 0 migrations", "CRM · inbox · sheets · dashboard", "Synced", "plug"],
    ["HubSpot deal stage updated", "Pulled from the shared inbox", "Synced 2m", "users"],
    ["Ops sheet refreshed", "212 rows written · no copy-paste", "Live", "table"],
    ["Dashboard numbers current", "Read from 3 systems every hour", "Synced", "grid"],
  ],
  Agents: [
    ["Ops assistant updated 38 records", "3 escalated to a human today", "Live", "bot"],
    ["Reply drafted for Acme", "Waiting on the account owner", "Draft", "mail"],
    ["Order #4821 status sent", "Answered in the customer’s thread", "Sent", "sparkles"],
    ["Acme record updated", "3 fields changed · owner notified", "Done", "check"],
  ],
} as const;
const HERO_STOPS = ["Intake", "Triage", "Review", "Hand back"];
const CARD_MS = 2500;

// Stagger index for scroll reveals: each step delays a sibling by 80ms.
const delay = (i: number) => ({ "--i": i }) as CSSProperties;
type HeroTab = keyof typeof HERO_TABS;

const SERVICES = [
  {
    title: "Workflow automation",
    menu: "Repetitive chains of copy, paste, check and forward — rebuilt as systems that run on their own.",
    desc: "The repetitive chains of copy, paste, check, and forward — turned into systems that run themselves and flag only what needs a human.",
    glow: "20% 15%",
  },
  {
    title: "AI integrations",
    menu: "AI wired into your CRM, inbox, spreadsheets and dashboards — no migration.",
    desc: "AI wired into the tools you already use: your CRM, inbox, spreadsheets, and internal dashboards. No platform migration required.",
    glow: "85% 20%",
  },
  {
    title: "Document & data processing",
    menu: "Invoices, contracts and forms — extracted, structured and filed.",
    desc: "Invoices, contracts, forms, and reports — extracted, structured, and filed without anyone retyping a single field.",
    glow: "15% 90%",
  },
  {
    title: "AI assistants & agents",
    menu: "Assistants that triage, draft and keep records current.",
    desc: "Assistants that triage requests, draft responses, and keep records current, trained on how your business actually works.",
    glow: "80% 85%",
  },
];

const CASES = [
  {
    icon: "bag",
    client: "E-commerce retailer",
    cat: "Customer operations",
    work: "Order-status inquiries answered without the support queue",
    result: "Support inbox volume cut by more than half",
  },
  {
    icon: "file",
    client: "Professional services firm",
    cat: "Document processing",
    work: "Client intake documents processed the moment they arrive",
    result: "Days of manual data entry reduced to minutes",
  },
  {
    icon: "truck",
    client: "Logistics company",
    cat: "Workflow automation",
    work: "Dispatch updates that write themselves across three systems",
    result: "One source of truth, zero duplicate typing",
  },
];

const SHOWCASE = [
  {
    back: ["Where is order #4821?", "Customer"],
    front: ["Status sent — arriving Thu", "Agent"],
    title: "Answered before anyone opens the inbox",
    desc: "Order-status questions are matched to live order data and replied to in the customer’s own thread.",
    tags: ["Inbox", "Order data", "Auto-reply"],
  },
  {
    back: ["intake_form.pdf", "Received"],
    front: ["14 fields extracted · filed", "Done"],
    title: "Filed the moment it arrives",
    desc: "Intake documents are read, structured, and pushed into the right records without a single retyped field.",
    tags: ["Extraction", "Validation", "Filing"],
  },
];

const STEPS = [
  {
    icon: "map",
    title: "Map the boring work",
    desc: "A short working session where we trace the repetitive tasks eating your team’s week and pick the highest-impact one.",
  },
  {
    icon: "workflow",
    title: "Build the workflow",
    desc: "We design and build the automation inside your existing tools, and test it against real work until it holds up.",
  },
  {
    icon: "refresh",
    title: "Run and improve",
    desc: "It ships, your team gets time back, and we keep tuning it as your business changes.",
  },
];

const PARTNERS = [
  { icon: "building", title: "Agencies", desc: "Offer AI workflows to your clients without hiring an in-house build team." },
  {
    icon: "briefcase",
    title: "Consultancies",
    desc: "Turn process recommendations into systems that actually run after the engagement ends.",
  },
  { icon: "code", title: "Software teams", desc: "Add AI automation to your product or delivery work, built to your standards." },
];

const FOOTER_COLS = [
  ["Services", ["Workflow automation", "AI integrations", "Document processing", "Assistants & agents"]],
  ["Company", ["Work", "How it works", "About", "Partners"]],
  ["Contact", ["hello@sablebrain.com", "LinkedIn", "Book a call"]],
] as const;

// Every mockup plays its own timed loop. The pinned services section pauses
// the ones not showing; each starts a fresh run when its service comes up.
type MockProps = { paused?: boolean };

// 01 · Invoice routing, choreographed with the cinetic skill. The invoice
// itself (a cyan square, the brand's marker) is the one object that travels:
// it drops in from the header, runs down the rail and passes through each
// station. Each check draws on the frame it arrives, the label arrives in the
// accent and relaxes to grey, and the run lands on the mismatch row (the one
// overshoot) as RUN rolls to the next number. Everything is a function of t,
// so scroll can play it forwards and back.
const PITCH = 30; // row height 18 + gap 12
const STATION = [0.1, 0.36, 0.62, 0.86]; // t at which the invoice reaches each station
const DWELL = 0.08; // how long it rests in a station before moving on
const RUN_F = 400; // frames per unit of t, for the pulse and settle envelopes
const centre = (i: number) => 9 + i * PITCH;

function invoiceY(t: number) {
  if (t < STATION[0]) return mix(-14, centre(0), prog(t, 0.02, STATION[0], E.out));
  for (let i = 0; i < 3; i++) {
    const leave = STATION[i] + DWELL;
    const arrive = STATION[i + 1];
    if (t < leave) return centre(i);
    if (t < arrive) return mix(centre(i), centre(i + 1), prog(t, leave, arrive, i === 2 ? E.contact : E.glide));
  }
  return centre(3);
}

function CheckGlyph({ drawn }: { drawn: number }) {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} />
    </svg>
  );
}

function InvoiceMock({ paused }: MockProps) {
  const [ref, clockT, cycle] = useRunClock(7000, paused);
  const t = clockT;
  // The clock's tail (t > 1) eases everything back to the empty state.
  const reset = prog(t, 1, 1.15, E.smooth);
  const keep = 1 - reset;

  const y = invoiceY(Math.min(t, 1));
  const nearest = Math.min(...[0, 1, 2, 3].map((i) => Math.abs(y - centre(i))));
  const tokenShow = clamp01((nearest - 4) / 7) * prog(t, 0.02, 0.05) * (t < STATION[3] ? 1 : 0);
  const fillTo = Math.max(centre(0), y);

  const landed = t >= STATION[3];
  const settleK = (t - STATION[3]) * RUN_F;
  const settle = landed ? 1 - Math.exp(-settleK / 4) * Math.sin(settleK / 1.6) * 0.035 : 1;
  const flagIn = prog(t, STATION[3] - 0.05, STATION[3], E.contact);
  const reviewAccent = 1 - prog(t, STATION[3] + 0.02, STATION[3] + 0.1, E.smooth);

  const run = 4812 + cycle;
  const roll = reset > 0 ? 1 : prog(t, STATION[3], STATION[3] + 0.04, E.ui);
  const steps = ["Copy from inbox", "Check against CRM", "Forward to finance"];

  return (
    <div ref={ref} className={styles.mock}>
      <MockHead
        icon="workflow"
        label="Invoice routing"
        meta={
          <span className={styles.runCounter}>
            RUN <Roll before={run.toLocaleString("en-US")} after={(run + 1).toLocaleString("en-US")} roll={roll} />
          </span>
        }
        progress={prog(t, 0.02, STATION[3]) * keep}
      />
      <div className={styles.invoiceSteps}>
        <span className={styles.rail} aria-hidden="true">
          <span style={{ height: Math.max(0, fillTo - centre(0)) * keep }} />
        </span>
        <span
          className={styles.invoiceToken}
          aria-hidden="true"
          style={{ transform: `translateY(${y - 3}px) scale(${tokenShow})`, opacity: tokenShow * keep }}
        />
        {steps.map((step, i) => {
          const at = STATION[i];
          const drawn = prog(t, at, at + 0.06, E.out) * keep;
          const pulse = hitPulse((t - at) * RUN_F) * keep;
          const accent = t >= at ? (1 - prog(t, at + 0.02, at + 0.12, E.smooth)) * keep : 0;
          const heading = t < at && t >= (i === 0 ? 0.02 : STATION[i - 1] + DWELL);
          const colour =
            t >= at && keep > 0.5
              ? `color-mix(in oklab, var(--cyan) ${Math.round(accent * 100)}%, var(--mute-dark))`
              : heading
                ? "var(--cream)"
                : "rgba(147, 169, 196, 0.5)";
          return (
            <div key={step} className={styles.mockStep}>
              <span
                className={styles.station}
                data-done={drawn > 0 ? "" : undefined}
                style={{ boxShadow: `0 0 0 ${pulse * 4}px rgba(0, 229, 255, ${pulse * 0.35})` }}
              >
                <CheckGlyph drawn={drawn} />
              </span>
              <span style={{ color: colour }}>{step}</span>
            </div>
          );
        })}
        <div className={`${styles.mockStep} ${styles.mockStepFlag}`}>
          <span
            className={styles.station}
            style={{ color: landed ? "var(--cream)" : "transparent", opacity: landed ? keep : 1 }}
          >
            <Icon name="user" size={11} />
          </span>
          <span
            className={styles.flagBody}
            style={{
              opacity: flagIn * keep,
              transform: `translateY(${(1 - flagIn) * -8 - reset * 6}px) scale(${settle})`,
            }}
          >
            <span>Mismatch on PO-2291</span>
            <span
              className={styles.badge}
              style={{ background: `color-mix(in oklab, var(--cyan) ${Math.round(reviewAccent * 100)}%, var(--cream))` }}
            >
              REVIEW
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// A label whose changed characters roll up from `before` to `after` over
// `roll` (a masked vertical slide; never a crossfade of two values).
function Roll({ before, after, roll }: { before: string; after: string; roll: number }) {
  const width = Math.max(before.length, after.length);
  const from = before.padStart(width, " ");
  const to = after.padStart(width, " ");
  return (
    <>
      {to.split("").map((ch, i) =>
        ch === from[i] ? (
          <span key={i}>{ch}</span>
        ) : (
          <span key={i} className={styles.rollDigit}>
            <span style={{ transform: `translateY(${-roll * 50}%)` }}>
              {from[i]}
              <br />
              {ch}
            </span>
          </span>
        ),
      )}
    </>
  );
}

// Where a travelling token sits on a rail of stations `pitch` apart: it
// drops in from above, rests `dwell` in each station, and glides on (the last
// leg accelerating into its landing).
function railY(t: number, stations: number[], dwell: number, pitch: number, half: number) {
  const centre = (i: number) => half + i * pitch;
  if (t < stations[0]) return mix(-14, centre(0), prog(t, 0.02, stations[0], E.out));
  for (let i = 0; i < stations.length - 1; i++) {
    const leave = stations[i] + dwell;
    if (t < leave) return centre(i);
    if (t < stations[i + 1]) {
      const ease = i === stations.length - 2 ? E.contact : E.glide;
      return mix(centre(i), centre(i + 1), prog(t, leave, stations[i + 1], ease));
    }
  }
  return centre(stations.length - 1);
}
// A colour arriving in the accent and relaxing to `rest` from `at`.
const accentTo = (t: number, at: number, rest: string, keep: number) =>
  `color-mix(in oklab, var(--cyan) ${Math.round((1 - prog(t, at + 0.02, at + 0.12, E.smooth)) * keep * 100)}%, ${rest})`;

// 02 · Connected tools. A record drops in and runs down the rail through the
// live dots. Each tool it reaches flashes the accent, its dot lights, its
// "synced 2m" rolls up to "synced now", and the header counts it in.
const TOOL_AT = [0.12, 0.34, 0.56, 0.78];
const TOOL_PITCH = 36; // row 24 + gap 12

function ToolsMock({ paused }: MockProps) {
  const [ref, clockT] = useRunClock(7000, paused);
  const t = clockT;
  const keep = 1 - (prog(t, 1, 1.15, E.smooth));
  const tools = [
    ["users", "HubSpot CRM", "synced 2m"],
    ["mail", "Shared inbox", "synced 1m"],
    ["table", "Ops spreadsheet", "synced 8m"],
    ["grid", "Internal dashboard", "synced 4m"],
  ];
  const y = railY(Math.min(t, 1), TOOL_AT, 0.06, TOOL_PITCH, 12);
  const nearest = Math.min(...TOOL_AT.map((_, i) => Math.abs(y - (12 + i * TOOL_PITCH))));
  const tokenShow = clamp01((nearest - 3) / 7) * prog(t, 0.02, 0.05) * (t < TOOL_AT[3] ? 1 : 0) * keep;
  const synced = TOOL_AT.filter((at) => t >= at).length;
  const countRoll = synced === 0 ? 1 : prog(t, TOOL_AT[synced - 1], TOOL_AT[synced - 1] + 0.04, E.ui);
  const shown = keep < 1 ? Math.round(synced * keep) : synced;

  return (
    <div ref={ref} className={styles.mock}>
      <MockHead
        icon="plug"
        label="Connected tools"
        meta={
          <span className={styles.runCounter}>
            <Roll before={String(Math.max(0, shown - 1))} after={String(shown)} roll={keep < 1 ? 1 : countRoll} /> / 4
          </span>
        }
      />
      <div className={styles.toolRows}>
        <span className={styles.toolRail} aria-hidden="true">
          <span style={{ height: Math.max(0, y - 12) * keep }} />
        </span>
        <span
          className={`${styles.token} ${styles.toolToken}`}
          aria-hidden="true"
          style={{ transform: `translateY(${y - 3}px) scale(${tokenShow})`, opacity: tokenShow }}
        />
        {tools.map(([icon, name, sync], i) => {
          const at = TOOL_AT[i];
          const reached = t >= at;
          const pulse = hitPulse((t - at) * RUN_F) * keep;
          const roll = prog(t, at, at + 0.04, E.ui) * keep;
          return (
            <div key={name} className={styles.mockTool}>
              <span
                className={styles.appTile}
                style={
                  reached
                    ? {
                        color: accentTo(t, at, "var(--cream)", keep),
                        background: `color-mix(in oklab, var(--cyan) ${Math.round((1 - prog(t, at + 0.02, at + 0.12, E.smooth)) * keep * 18)}%, rgba(244, 248, 252, 0.08))`,
                      }
                    : undefined
                }
              >
                <Icon name={icon} size={12} />
              </span>
              <span className={styles.toolName}>{name}</span>
              <span className={`${styles.mono10} ${styles.syncLabel}`} style={reached ? { color: accentTo(t, at, "var(--cream)", keep) } : undefined}>
                <span style={{ transform: `translateY(${-roll * 50}%)` }}>
                  {sync}
                  <br />
                  synced now
                </span>
              </span>
              <span
                className={styles.liveDot}
                style={{
                  opacity: reached && keep > 0.5 ? 1 : 0.35,
                  boxShadow: `0 0 0 ${pulse * 4}px rgba(0, 229, 255, ${pulse * 0.4})`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 03 · Extraction. The cyan square is the caret: it reads down the document,
// and each value, blank until then, types in at about 3 frames a character,
// arriving in cream and relaxing to the accent. The header counts the fields
// and turns to EXTRACTED when the last one lands.
const FIELD_AT = [0.1, 0.32, 0.54, 0.76];
const FIELD_TYPE = 0.12; // typing time per value
const FIELD_PITCH = 34; // row 22 + gap 12

function ExtractMock({ paused }: MockProps) {
  const [ref, clockT] = useRunClock(7000, paused);
  const t = clockT;
  const reset = prog(t, 1, 1.15, E.smooth);
  const keep = 1 - reset;
  const fields = [
    ["VENDOR", "Northwind Supply"],
    ["INVOICE NO.", "INV-0423"],
    ["AMOUNT", "$4,280.00"],
    ["DUE", "Nov 14, 2026"],
  ];
  const done = FIELD_AT[3] + FIELD_TYPE;
  const y = railY(Math.min(t, 1), FIELD_AT, FIELD_TYPE, FIELD_PITCH, 11);
  const caret = prog(t, 0.02, 0.05) * (1 - prog(t, done, done + 0.04)) * keep;
  const read = FIELD_AT.filter((at) => t >= at + FIELD_TYPE).length;

  return (
    <div ref={ref} className={styles.mock}>
      <MockHead
        icon="file"
        label="invoice_0423.pdf"
        meta={t >= done && keep > 0.5 ? "EXTRACTED" : `READING ${keep > 0.5 ? read : 0}/4`}
      />
      <div className={styles.fieldRows}>
        <span
          className={`${styles.token} ${styles.caretToken}`}
          aria-hidden="true"
          style={{ transform: `translateY(${y - 3}px)`, opacity: caret }}
        />
        {fields.map(([k, v], i) => {
          const at = FIELD_AT[i];
          const typed = Math.round(prog(t, at, at + FIELD_TYPE) * v.length * keep);
          return (
            <div key={k} className={styles.mockField}>
              <span className={styles.mono10}>{k}</span>
              {typed === 0 ? (
                <span className={styles.fieldBlank} />
              ) : (
                <span
                  className={styles.fieldValue}
                  style={{ color: `color-mix(in oklab, var(--cream) ${Math.round((1 - prog(t, at + FIELD_TYPE, at + FIELD_TYPE + 0.1, E.smooth)) * 100)}%, var(--cyan))` }}
                >
                  {v.slice(0, typed)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 04 · Assistant. The question rises in, the avatar arrives, the typing dots
// run, then the reply streams in word by word. The record count rolls on the
// frame the reply finishes, and the whole exchange lifts away on the reset.
const REPLY = "Done — 3 fields updated and the account owner notified.".split(" ");
const REPLY_AT = 0.42;
const WORD_GAP = 0.028;

function AssistantMock({ paused }: MockProps) {
  const [ref, clockT, cycle] = useRunClock(7000, paused);
  const t = clockT;
  const reset = prog(t, 1, 1.15, E.smooth);
  const keep = 1 - reset;
  const lift = `translateY(${-reset * 6}px)`;
  const ask = prog(t, 0.04, 0.14, E.out);
  const avatar = prog(t, 0.16, 0.22, E.out);
  const typing = t >= 0.18 && t < REPLY_AT;
  const replyDone = REPLY_AT + (REPLY.length - 1) * WORD_GAP + 0.06;
  const records = 37 + cycle;
  const phase = (t * RUN_F) / 54;

  return (
    <div ref={ref} className={styles.mock}>
      <MockHead
        icon="bot"
        label="Ops assistant"
        meta={
          <span className={styles.runCounter}>
            UPDATED{" "}
            <Roll before={String(records)} after={String(records + 1)} roll={reset > 0 ? 1 : prog(t, replyDone, replyDone + 0.04, E.ui)} />
          </span>
        }
      />
      <div className={styles.requestRow}>
        <div className={styles.request} style={{ opacity: ask * keep, transform: `translateY(${(1 - ask) * 8 - reset * 6}px)` }}>
          Can you update the Acme record?
        </div>
      </div>
      <div className={styles.replyRow} style={{ opacity: keep, transform: lift }}>
        <span className={styles.avatar} style={{ opacity: avatar, transform: `scale(${0.6 + 0.4 * avatar})` }}>
          <Icon name="sparkles" size={11} />
        </span>
        {typing ? (
          <div className={styles.typing} aria-label="Typing">
            {[0, 1, 2].map((i) => {
              const bob = Math.max(0, Math.sin(2 * Math.PI * (phase - i * 0.17)));
              return <i key={i} style={{ opacity: 0.35 + 0.65 * bob, transform: `translateY(${-3 * bob}px)` }} />;
            })}
          </div>
        ) : (
          <div
            className={styles.reply}
            style={{
              opacity: prog(t, REPLY_AT, REPLY_AT + 0.03),
              outlineColor: `color-mix(in oklab, var(--cyan) ${Math.round(20 + (1 - prog(t, replyDone, replyDone + 0.1, E.smooth)) * 50)}%, transparent)`,
            }}
          >
            {REPLY.map((word, i) => {
              const w = prog(t, REPLY_AT + i * WORD_GAP, REPLY_AT + i * WORD_GAP + 0.06, E.out);
              return (
                <span key={i} className={styles.word} style={{ opacity: w, transform: `translateY(${(1 - w) * 0.2}em)` }}>
                  {word}{" "}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const SERVICE_MOCKS = [InvoiceMock, ToolsMock, ExtractMock, AssistantMock];

const PIN_QUERY = "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";

// Which illustration style the service tiles use, switchable from a floating
// control while comparing directions. Remembered in this browser when storage
// allows; otherwise only for the visit.
const LOOKS = ["Machines", "Particles", "Cards"] as const;
type Look = (typeof LOOKS)[number];
const LOOK_KEY = "rl-illustration";
const lookListeners = new Set<() => void>();
let chosenLook: Look | null = null;
const readLook = (): Look => {
  if (chosenLook) return chosenLook;
  try {
    const stored = localStorage.getItem(LOOK_KEY);
    if (stored && (LOOKS as readonly string[]).includes(stored)) return stored as Look;
  } catch {}
  return "Machines";
};
const chooseLook = (look: Look) => {
  chosenLook = look;
  try {
    localStorage.setItem(LOOK_KEY, look);
  } catch {}
  lookListeners.forEach((notify) => notify());
};
const subscribeLook = (onChange: () => void) => {
  lookListeners.add(onChange);
  return () => lookListeners.delete(onChange);
};
const subscribePin = (onChange: () => void) => {
  const mq = window.matchMedia(PIN_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// "What we build". On desktop (with motion allowed) the body is a tall
// scroll track: a sticky panel keeps the menu and one large tile on screen,
// and the scroll position picks the service, about one screen of scrolling
// each. The card animations run on their own clocks either way; only the
// showing one plays. Elsewhere it is the plain 2×2 grid. In the Machines
// style the services are stations on one plant: pinned, a single plant
// stays on screen and its camera travels the line with the scroll; in the
// grid, each tile frames its own station.
function Services() {
  const trackRef = useRef<HTMLDivElement>(null);
  const shot = useRef(0);
  const pinned = useSyncExternalStore(
    subscribePin,
    () => window.matchMedia(PIN_QUERY).matches,
    () => false,
  );
  const [active, setActive] = useState(0);
  const look = useSyncExternalStore(subscribeLook, readLook, (): Look => "Machines");
  const [inView, setInView] = useState(false);

  // The style switch shows only while this section is on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(track);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!pinned || !track) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / (rect.height - window.innerHeight), 0), 0.9999);
      const index = Math.floor(progress * SERVICES.length);
      const local = progress * SERVICES.length - index;
      // How far through this service's stretch, for the menu's progress line.
      track.style.setProperty("--local", local.toFixed(3));
      shot.current = progress * SERVICES.length;
      setActive(index);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pinned]);

  const plant = look === "Machines";
  const onePlant = plant && pinned;

  // Pinned, the menu scrolls to that service's stretch (for the plant, the
  // middle of it, where the camera rests on the station).
  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!pinned || !track) return setActive(i);
    const travel = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const into = plant ? 0.5 : 0.8;
    window.scrollTo({ top: top + (travel * (i + into)) / SERVICES.length, behavior: "smooth" });
  };

  return (
    <div ref={trackRef} className={styles.servicesBody} data-pinned={pinned ? "" : undefined}>
      <div className={styles.servicesPin}>
        <ul className={styles.serviceMenu} data-reveal style={delay(1)}>
          {SERVICES.map((s, i) => (
            <li key={s.title} className={i === active ? styles.menuActive : ""}>
              <button onClick={() => goTo(i)} aria-pressed={i === active}>
                <span className={styles.menuRow}>
                  {i === active ? (
                    <span className={styles.menuMarker} />
                  ) : (
                    <span className={styles.menuIndex}>{String(i + 1).padStart(2, "0")}</span>
                  )}
                  <span className={styles.menuTitle}>{s.title}</span>
                </span>
                {i === active && <span className={styles.menuDesc}>{s.menu}</span>}
                {i === active && pinned && <span className={styles.menuProgress} />}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.serviceGrid} data-plant={onePlant ? "" : undefined}>
          {onePlant && (
            <div className={`${styles.tileVisual} ${styles.plantFrame}`}>
              <Plant shot={shot} />
            </div>
          )}
          {SERVICES.map((s, i) => {
            const Mock = SERVICE_MOCKS[i];
            const Particles = PARTICLES[i];
            const paused = pinned && i !== active;
            return (
              <article
                key={s.title}
                className={styles.tile}
                data-reveal={pinned ? undefined : ""}
                data-pos={pinned ? Math.sign(i - active) : undefined}
                aria-hidden={pinned && i !== active ? true : undefined}
                style={delay(i % 2)}
              >
                {!onePlant && (
                  <div className={styles.tileVisual} data-look={look} style={{ "--glow": s.glow } as CSSProperties}>
                    {plant ? <Plant focus={i} /> : look === "Particles" ? <Particles paused={paused} /> : <Mock paused={paused} />}
                  </div>
                )}
                <div className={styles.tileText}>
                  <h3>
                    <span className={styles.tileNum}>{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h3>
                  <p>{s.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.lookSwitch} data-on={inView ? "" : undefined} role="radiogroup" aria-label="Illustration style">
        <span>Illustration</span>
        {LOOKS.map((option) => (
          <button key={option} role="radio" aria-checked={look === option} onClick={() => chooseLook(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MockHead({ icon, label, meta, progress }: { icon: string; label: string; meta: ReactNode; progress?: number }) {
  return (
    <>
      <div className={styles.mockHead}>
        <span className={styles.mockHeadLeft}>
          <Icon name={icon} size={14} className={styles.cyan} />
          {label}
        </span>
        <span className={styles.mono10}>{meta}</span>
      </div>
      <div className={styles.mockDivider}>
        {progress !== undefined && <span style={{ transform: `scaleX(${progress})` }} />}
      </div>
    </>
  );
}

export default function RedesignLab() {
  const [tab, setTab] = useState<HeroTab>("Workflows");
  const [step, setStep] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll reveals: anything marked data-reveal fades up once it enters the
  // viewport. data-motion arms the hidden state, so the page stays fully
  // visible if this never runs; reduced motion is handled in the CSS.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    root.dataset.motion = "";
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "";
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Advance one card every CARD_MS; after the fourth, move to the next tab.
  // With reduced motion the stack holds still on whatever tab is chosen.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      if (step < 3) return setStep(step + 1);
      const tabs = Object.keys(HERO_TABS) as HeroTab[];
      setTab(tabs[(tabs.indexOf(tab) + 1) % tabs.length]);
      setStep(0);
    }, CARD_MS);
    return () => clearTimeout(id);
  }, [tab, step]);

  return (
    <div ref={rootRef} className={`${styles.root} ${serif.variable} ${sans.variable} ${mono.variable}`}>
      {/* ───────── Hero ───────── */}
      <section className={styles.hero}>
        <Image src="/redesign/hero-wave.webp" alt="" fill priority sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />

        <header className={styles.nav}>
          <div className={styles.navInner}>
            <a href="#" aria-label="Sable Brain home">
              <Image src="/sablebrain-wordmark.png" alt="Sable Brain" width={147} height={27} priority />
            </a>
            <nav className={styles.navLinks} aria-label="Primary">
              <a href="#work">Work</a>
              <a href="#services">Services</a>
              <a href="#about">About</a>
              <a href="#partners">Partners</a>
            </nav>
            <div className={styles.navActions}>
              <a href="#contact" className={styles.btnLight}>
                Talk to us
              </a>
            </div>
          </div>
        </header>

        <div className={styles.heroCenter}>
          <div className={styles.line}>
            <div className={styles.lineFill} key={tab} style={{ animationDuration: `${CARD_MS * 4}ms` }} />
            {HERO_STOPS.map((stop) => (
              <span key={stop} className={styles.stop}>
                <span className={styles.stopDot} />
                {stop}
              </span>
            ))}
          </div>

          <div className={styles.heroWidget}>
            <div className={styles.tabs} role="tablist" aria-label="Pipeline examples">
              {(Object.keys(HERO_TABS) as HeroTab[]).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                  onClick={() => {
                    setTab(t);
                    setStep(0);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className={styles.heroStack} key={tab} aria-live="polite">
              {HERO_TABS[tab].map(([title, sub, chip, icon], i) => {
                const pos = (i - step + 4) % 4;
                return (
                  <div
                    key={title}
                    className={styles.statusCard}
                    data-pos={pos}
                    data-exit={pos === 3 && step > 0 ? "" : undefined}
                    aria-hidden={pos !== 0}
                  >
                    <span className={styles.statusIcon}>
                      <Icon name={icon} size={20} />
                    </span>
                    <span className={styles.statusText}>
                      <strong>{title}</strong>
                      <span>{sub}</span>
                    </span>
                    <span className={styles.chip}>{chip}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.heroBottom}>
          <h1 className={styles.heroHeadline}>
            AI workflows that <br />
            automate the <br />
            boring work.
          </h1>
          <div className={styles.heroAside}>
            <p>
              Sable Brain builds AI systems that take repetitive tasks off your team’s plate — inside the tools you
              already use — so your people can do the work that actually needs them.
            </p>
            <div className={styles.btnRow}>
              <a href="#contact" className={styles.btnCyan}>
                Talk to us
              </a>
              <a href="#work" className={styles.btnGlass}>
                See our work
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── The problem ───────── */}
      <section className={`${styles.section} ${styles.problem}`}>
        <div className={styles.inner}>
          <div className={styles.eyebrowRow} data-reveal>
            <span className={styles.eyebrow}>[ THE PROBLEM ]</span>
            <span className={styles.index}>01 / 02</span>
          </div>
          <div className={styles.statement} data-reveal style={delay(1)}>
            <p>
              Every week, your best people spend hours copying data, chasing updates, and re-typing what a system
              already knows.
            </p>
            <mark>That isn’t work. That’s friction.</mark>
          </div>
        </div>
      </section>

      {/* ───────── What we build ───────── */}
      <section id="services" className={`${styles.section} ${styles.build}`}>
        <div className={styles.inner}>
          <div className={styles.buildHeader} data-reveal>
            <div>
              <span className={styles.eyebrow}>[ WHAT WE BUILD ]</span>
              <h2 className={styles.h2}>Practical AI, where the work already happens.</h2>
            </div>
            <a href="#contact" className={styles.btnLight}>
              Talk to us <Icon name="arrowUpRight" size={15} />
            </a>
          </div>

          <Services />
        </div>
      </section>

      {/* ───────── About — quote ───────── */}
      <section id="about" className={styles.quoteSection}>
        <div className={styles.inner}>
          <div className={styles.progressRule} data-reveal>
            <span />
          </div>
          <blockquote className={styles.quote} data-reveal style={delay(1)}>
            “We’re a small team that has run the workflows
            <br />
            we now automate. <mark>We measure our work in hours</mark>
            <br />
            <mark>handed back to your team</mark> — not in demos
            <br />
            that never ship.”
          </blockquote>
          <div className={styles.attribution} data-reveal style={delay(2)}>
            <span className={styles.mark}>
              <Icon name="sparkles" size={20} />
            </span>
            <strong>Operators first, AI builders second.</strong>
            <span>The Sable Brain team</span>
            <span className={styles.dots}>
              <i className={styles.dotOn} />
              <i />
            </span>
          </div>
        </div>
      </section>

      {/* ───────── Proof ───────── */}
      <section id="work" className={`${styles.section} ${styles.light} ${styles.proof}`}>
        <div className={styles.inner}>
          <div className={styles.splitHeader} data-reveal>
            <div className={styles.splitLeft}>
              <span className={styles.eyebrowDark}>[ PROOF ]</span>
              <h2 className={styles.h2}>Boring work we’ve already made disappear.</h2>
            </div>
            <div className={styles.splitRight}>
              <p className={styles.intro}>
                Three teams, three workflows nobody wanted to own. Each one now runs on its own — and only asks for a
                human when it should.
              </p>
              <a href="#contact" className={styles.btnCyanLg}>
                Talk to us
              </a>
            </div>
          </div>

          <div className={styles.caseTable}>
            {CASES.map((c, i) => (
              <div key={c.client} className={styles.caseRow} data-reveal style={delay(i)}>
                <div className={styles.caseClient}>
                  <Icon name={c.icon} size={20} />
                  <div>
                    <strong>{c.client}</strong>
                    <span className={styles.monoCaps}>{c.cat}</span>
                  </div>
                </div>
                <p className={styles.caseWork}>{c.work}</p>
                <div className={styles.caseResult}>
                  <span className={styles.monoCaps}>Result</span>
                  <p>{c.result}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.showcase}>
            {SHOWCASE.map((t, i) => (
              <div key={t.title} className={styles.showTile} data-reveal style={delay(i)}>
                <div className={styles.cardStack}>
                  <div className={`${styles.stackCard} ${styles.stackBack}`}>
                    <span className={styles.stackIcon}>
                      <Icon name="inbox" size={16} />
                    </span>
                    <span className={styles.stackTitle}>{t.back[0]}</span>
                    <span className={styles.stackChip}>{t.back[1]}</span>
                  </div>
                  <div className={`${styles.stackCard} ${styles.stackFront}`}>
                    <span className={styles.stackIcon}>
                      <Icon name="sparkles" size={16} />
                    </span>
                    <span className={styles.stackTitle}>{t.front[0]}</span>
                    <span className={styles.stackChip}>{t.front[1]}</span>
                  </div>
                </div>
                <div className={styles.caption}>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                  <div className={styles.tags}>
                    {t.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className={`${styles.section} ${styles.light} ${styles.how}`}>
        <div className={styles.inner}>
          <div className={styles.splitHeader} data-reveal>
            <div className={styles.howLeft}>
              <span className={styles.eyebrowDark}>[ HOW IT WORKS ]</span>
              <h2 className={styles.h2}>
                Three steps.
                <br />
                No rip-and-replace.
              </h2>
            </div>
            <p className={`${styles.intro} ${styles.howIntro}`}>
              We start with the single task your team complains about most, build it into the tools you already run,
              and keep tuning it once it ships.
            </p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.step} data-reveal style={delay(i)}>
                <div className={styles.stepTrack}>
                  <span
                    style={{
                      width: `${((i + 1) / 3) * 100}%`,
                      background: i === 0 ? "#00e5ff" : "#66eeff",
                    }}
                  />
                </div>
                <div className={styles.stepTop}>
                  <span className={styles.stepNum}>[ {String(i + 1).padStart(2, "0")} ]</span>
                  <Icon name={s.icon} size={20} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Partners ───────── */}
      <section id="partners" className={`${styles.section} ${styles.light} ${styles.partners}`}>
        <div className={`${styles.inner} ${styles.partnersInner}`}>
          <div className={styles.partnersLeft} data-reveal>
            <span className={styles.limeTag}>PARTNERS</span>
            <h2 className={styles.h2}>AI capability behind your own client work.</h2>
          </div>
          <div className={styles.partnersList}>
            {PARTNERS.map((p, i) => (
              <div key={p.title} className={styles.partner} data-reveal style={delay(i + 1)}>
                <h3>
                  <Icon name={p.icon} size={18} />
                  {p.title}
                </h3>
                <p>{p.desc}</p>
              </div>
            ))}
            <p className={styles.contactNote} data-reveal style={delay(4)}>
              If that sounds like you, reach us at <a href="mailto:hello@sablebrain.com">hello@sablebrain.com</a>.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section id="contact" className={styles.cta}>
        <div className={styles.inner}>
          <span className={styles.eyebrow} data-reveal>
            [ GET STARTED ]
          </span>
          <h2 className={styles.ctaHeadline} data-reveal style={delay(1)}>
            Tell us about your <br />
            most boring task.
          </h2>
          <p className={styles.ctaBody} data-reveal style={delay(2)}>
            Bring one repetitive workflow — the one everyone complains about. We’ll show you exactly how it
            disappears.
          </p>
          <div className={styles.btnRow} data-reveal style={delay(3)}>
            <a href="mailto:hello@sablebrain.com" className={styles.btnCyanXl}>
              Talk to us
            </a>
            <a href="#work" className={styles.btnDarkXl}>
              See our work
            </a>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.footerTop} data-reveal>
            <div className={styles.brand}>
              <Image src="/sablebrain-wordmark.png" alt="Sable Brain" width={174} height={32} />
              <p>Practical AI for the work nobody wants to do.</p>
            </div>
            <div className={styles.footerCols}>
              {FOOTER_COLS.map(([title, links]) => (
                <div key={title}>
                  <span className={styles.colTitle}>{title.toUpperCase()}</span>
                  <ul>
                    {links.map((l) => (
                      <li key={l}>
                        <a href={l.includes("@") ? `mailto:${l}` : "#"}>{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.legal}>
            <span>© 2026 Sable Brain. All rights reserved.</span>
            <span className={styles.legalLinks}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
            </span>
          </div>
          <div className={styles.giant} aria-hidden="true" data-reveal>
            sable brain
          </div>
        </div>
      </footer>
    </div>
  );
}
