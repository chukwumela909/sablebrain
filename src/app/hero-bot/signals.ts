/**
 * What the bots are allowed to notice about whoever is on the page.
 *
 * Every field is derived locally from things the browser already hands any
 * page — the clock, the referrer, a media query, the scroll position. Nothing
 * is stored, nothing is read back across visits, and nothing here identifies a
 * person. The referrer is deliberately reduced to a category before it leaves
 * the browser, so the actual URL someone came from is never sent anywhere.
 *
 * The bar is "things you'd notice about someone across a room", not "things
 * you could look up about them".
 */
export type VisitorSignals = {
  /** Local hour, 0–23. */
  hour: number;
  /** Local weekday name. */
  weekday: string;
  /** Whether it's a working day where they are. */
  weekend: boolean;
  /** Bucketed referrer — never the URL itself. */
  arrival: "search" | "social" | "link" | "direct";
  /** They've asked their system to tone animation down. */
  reducedMotion: boolean;
  /** Roughly how long they've been on the page. */
  dwellSeconds: number;
  /** Which section they're looking at, or "top" for the hero. */
  section: string;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|startpage|qwant)\./i;
const SOCIAL =
  /(^|\.)(linkedin|twitter|x|facebook|instagram|reddit|threads|bsky|mastodon|t)\.(com|co|net|app|social)$|news\.ycombinator/i;

function arrivalFrom(referrer: string): VisitorSignals["arrival"] {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return "direct";
  }
  // Same-site navigation isn't an arrival at all.
  if (host === window.location.hostname) return "direct";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "link";
}

/** The section nearest the middle of the viewport, which is what they're reading. */
function sectionInView(): string {
  const sections = document.querySelectorAll<HTMLElement>("main[id], section[id]");
  const middle = window.innerHeight / 2;
  let current = "top";
  for (const el of sections) {
    if (el.getBoundingClientRect().top <= middle) current = el.id;
  }
  return current;
}

export function readSignals(): VisitorSignals {
  const now = new Date();
  return {
    hour: now.getHours(),
    weekday: WEEKDAYS[now.getDay()],
    weekend: now.getDay() === 0 || now.getDay() === 6,
    arrival: arrivalFrom(document.referrer),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // Since navigation start, so it survives the component remounting.
    dwellSeconds: Math.round(performance.now() / 1000),
    section: sectionInView(),
  };
}

/**
 * Reject anything that isn't a plausible signal set.
 *
 * The route feeds these into a prompt, so this is the boundary that stops a
 * hand-rolled request from writing the bots' dialogue for them.
 */
export function parseSignals(value: unknown): VisitorSignals | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const hour = raw.hour;
  const weekday = raw.weekday;
  const arrival = raw.arrival;
  const section = raw.section;
  const dwellSeconds = raw.dwellSeconds;

  if (typeof hour !== "number" || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (typeof weekday !== "string" || !WEEKDAYS.includes(weekday)) return null;
  if (arrival !== "search" && arrival !== "social" && arrival !== "link" && arrival !== "direct") {
    return null;
  }
  if (typeof section !== "string" || !/^[a-z-]{1,24}$/.test(section)) return null;
  if (typeof dwellSeconds !== "number" || !Number.isFinite(dwellSeconds)) return null;

  return {
    hour,
    weekday,
    weekend: raw.weekend === true,
    arrival,
    reducedMotion: raw.reducedMotion === true,
    // Clamped so a bogus value can't produce "they have been here for 400 years".
    dwellSeconds: Math.min(Math.max(Math.round(dwellSeconds), 0), 60 * 60 * 6),
    section,
  };
}
