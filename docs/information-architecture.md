# Sable Brain — Information Architecture

Guide for the site redesign. This document decides **what exists and where it lives**; the design system decides how it looks and behaves.

## Brand & purpose

- **Brand:** Sable Brain (replaces the old Cadence demo).
- **What we do:** AI operations agency — we build AI workflows for companies to automate repetitive, boring tasks.
- **Audiences:** (1) businesses interested in integrating AI / setting up AI workflows — primary; (2) partners — secondary.
- **Primary action:** start a conversation with us (book a call / contact). The mechanism behind the CTA (WhatsApp, email, calendar booking, or a voice-assistant AI) is an implementation detail and may change — the IA and CTA label must not depend on it.

## Format decision

**One-pager, built as an index that can grow.** Matches the award-site ambition (content reveals on scroll) and the current content volume (no blog, no pricing, few case studies). Sections are designed to graduate into their own pages later without restructuring:

- Case-study cards → `/work/[slug]` pages when there are 4+ strong ones.
- Service blurbs → `/services/*` pages if depth is ever needed.
- Nav labels stay stable through that growth.

## Organization scheme: task-based narrative

The page is ordered as an argument that ends in the primary action — not a company brochure. Each section answers the visitor's next natural question:

| # | Section | Question it answers | Content |
|---|---------|--------------------|---------|
| 1 | **Hero** | "Am I in the right place?" | One-line positioning: AI workflows that automate the boring work. Primary CTA immediately visible. |
| 2 | **The problem** | "Do they get my pain?" | The cost of repetitive tasks — short, punchy, sets up everything after it. |
| 3 | **What we build** | "What exactly do they do?" | 3–4 service categories (workflow automation, AI integrations, …). |
| 4 | **Proof** | "Has it worked for anyone?" | 2–3 case-study cards, designed from day one to expand into standalone pages. |
| 5 | **How it works** | "What happens if I engage?" | 3-step engagement process — de-risks the CTA. |
| 6 | **Who we are** | "Can I trust these people?" | About/team, brief. Partners get a strip here, not their own section. |
| 7 | **Contact** | "Okay, how do I start?" | The big CTA moment — where the voice assistant will eventually live. |

## Navigation system

- Minimal sticky bar: logo, 3–4 anchor links, and a **persistently visible CTA button** (primary action is one click away at any scroll depth).
- Footer: fallback contact (plain email, socials) and legal.
- No breadcrumbs, no search — at this scale the scroll is the navigation.

## Labeling system

- Plain-spoken, short nav labels: `Work`, `Services`, `About`, CTA **"Talk to us"**.
- No clever labels in the nav — save personality for headlines. Nav labels are wayfinding; findability beats voice there.

## User journeys

- **Skimmer (most visitors):** Hero → CTA. Done in ~10 seconds. This is why the CTA lives in both the hero and the sticky nav.
- **Evaluator (real prospects):** full scroll — problem → services → proof → process → CTA. Section order is built for them.
- **Partner:** Hero → About/partners strip → footer contact. Low-friction secondary path that doesn't compete with the main CTA.

## Contact / voice-assistant policy

- Ship v1 with a simple mechanism (email or WhatsApp) behind the CTA.
- The voice-assistant AI slots in later behind the same button; on the backend it should capture visitor details for follow-up.
- **Always keep a plain email visible in the footer.** The assistant is an upgrade to contact, never a gate in front of it — some business visitors won't talk to an AI.

## Out of scope (for now)

- Blog, pricing, search/filtering systems. Revisit search only if content collections grow large.

## Component inventory implied by this IA

Checklist for the design system phase: sticky nav, hero, section-intro pattern, service cards, case-study cards, process steps, CTA block, partners strip, footer.
