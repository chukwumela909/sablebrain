# Design references

Sites to draw from when designing Sable Brain.

## [replicas.dev](https://replicas.dev/)

Dark, developer-flavoured AI-agent landing page.

- **Hero:** big imperative headline ("Turn Tasks Into Pull Requests"), a subhead, two CTAs (book demo / free signup), and a "no card required" note.
- **Live-agent ticker:** a scrolling strip of status labels (`RUNNING TESTS`, `MERGING`…) that makes the product feel alive.
- **Logo marquee:** a looping row of customer logos.
- **Terminal motifs:** headings like `$ cat replicas.md` / `$ echo`, `++++` dividers, and pause controls on animated sections.
- **Sections:** How it works (3 columns), Integrations (5 cards), Analytics, Sandboxed environments (3 features), testimonials with big stat callouts (`50%`, `23.5k`), FAQ.

## [paypath.ai](https://paypath.ai/)

AI-agent landing page pitched as an "autonomous workforce".

- **Hero:** a live-status badge above the headline ("7,834 accounts in your LMS · Synced"), a bold headline, and two CTAs ("Book a demo" / "Meet agents").
- **Agent tiles:** a 6-up grid, one tile per agent (Voice, Email, SMS, Compliance, Document, Payment).
- **Industry grid:** 6 cards.
- **Trust block:** "Built for institutions that can't take risks", plus security and compliance.
- **Animated number counters** and a before/after metrics comparison.
- Dashboard / audit-trail feature block, testimonials, FAQ.

### Hero background (saved in `docs/references/paypath/`)

Pulled from the live site on 2026-10-25. It's a Framer site; the hero is three stacked layers over a `rgb(6, 47, 38)` section background, body `rgb(14, 23, 17)`:

| File | Source | Role |
|---|---|---|
| `hero-hills.png` (2880×1600) | `framerusercontent.com/images/Ec6BRBatLvYRLBKm9h4Pk6S93A.png` | The rolling green hills with the light trail. `object-fit: cover`, fills the hero. |
| `hero-hills-blur.png` (2560×1423) | `framerusercontent.com/images/tEejaSbEY2eSMYm3v4aHAdM5I.png` | Heavily blurred version of the same shape, sits in a layer that fades (opacity 0 → 1) on load. |
| `hero-glow.webp` (3129×1138) | `framerusercontent.com/images/GoYX8B8Xtth6qLFn9v2LzviwQE.webp` | Soft lime glow blob, rendered at `1.8 × 100vw` so it spills past the edges — the ambient light over the hills. |

These are PayPath's assets: use them to study the look (dark green, one bright winding path, soft glow), not to ship. Headline is a serif in off-white `rgb(252, 250, 238)`; body copy is Geist.

#### Sable Brain blue versions

Same three layers remapped onto our palette with `recolor.mjs` (luminance → ramp `#040912` → `--color-background` → `--color-surface` → `--color-navy` → `--color-primary`, luma stretched so the trail peaks at `#00e5ff`):

- `hero-hills-blue.png` — the hills, gamma 0.8 (lifted mid-tones so the slopes still read).
- `hero-hills-blur-blue.png` — the blurred fade-in layer.
- `hero-glow-blue.webp` — the ambient glow, now cyan, alpha preserved.

Re-run with a different ramp or gamma: `node docs/references/paypath/recolor.mjs <in> <out> [gamma]` from the repo root (uses the `sharp` already in node_modules).

The homepage hero uses them: web-sized copies live in `public/hero/` and `src/app/hero-backdrop.tsx` stacks them (blur → hills fading in → glow screened on top → scrim), full-bleed behind the copy and the bots.

## Shared traits to borrow

- Short, confident copy that reads like a declaration.
- Agents shown as live, running things: status badges, tickers, counters.
- Stacked full-width sections, each with one heading and a single line of explanation.
- Grids of cards for agents, integrations and industries.

> Colors and typefaces weren't captured. Check the live sites for exact values.
