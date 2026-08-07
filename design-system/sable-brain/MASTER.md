# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Sable Brain
**Generated:** 2026-08-07 02:51:16
**Category:** AI/Chatbot Platform
**Design Dials:** Variance 7/10 (Balanced / Modern) | Motion 7/10 (Standard) | Density 3/10 (Spacious)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#00E5FF` | `--color-primary` |
| On Primary | `#081120` | `--color-on-primary` |
| Brand Navy | `#1E3A5F` | `--color-navy` |
| Accent/CTA | `#00E5FF` | `--color-accent` |
| Background | `#081120` | `--color-background` |
| Surface/Card | `#12233C` | `--color-surface` |
| Foreground | `#F4F8FC` | `--color-foreground` |
| Muted | `#1E3A5F` | `--color-muted` |
| Muted Foreground | `#93A9C4` | `--color-muted-foreground` |
| Border | `#1E3A5F` | `--color-border` |
| Border Strong | `#33517C` | `--color-border-strong` |
| Destructive | `#EF4444` | `--color-destructive` |
| Ring | `#00E5FF` | `--color-ring` |

**Color Notes:** Client brand palette — Navy `#1E3A5F` (secure, trust, stability) + Electric Blue `#00E5FF` (innovation, confidence, creativity). Dark-mode-primary: background is a deepened navy (`#081120`), navy itself serves as surface/muted/border tones, electric blue is reserved for the CTA, accents, and focus rings. `#00E5FF` on `#081120` ≈ 12:1 contrast; navy text on electric-blue buttons ≈ 11:1. Never use pure `#000000` (per style: OLED smear).

### Typography

- **Display Font (h1/h2 only):** TAN Nimbus — local file, single weight, loaded via `next/font/local` (`src/app/fonts/TAN-NIMBUS.woff2`), exposed as `--font-display`
- **Body/UI Font:** Inter (via `next/font/google`, `--font-inter`)
- **Mood:** bold retro display headlines over clean technical body copy
- **Rules:** TAN Nimbus is decorative — headlines and short statements only, sized smaller than a sans equivalent (it runs wide), looser line-height (~1.25–1.3). Never use it for body text, card titles (h3), nav, buttons, or anything under ~1.25rem. Card titles and everything else stay Inter.
- **Licensing:** TAN Nimbus is a commercial font (TAN Type) — confirm the license covers web embedding before launch.

### Spacing Variables

*Density: 3/10 — Spacious*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `24px` / `1.5rem` | Standard padding |
| `--space-lg` | `32px` / `2rem` | Section padding |
| `--space-xl` | `48px` / `3rem` | Large gaps |
| `--space-2xl` | `64px` / `4rem` | Section margins |
| `--space-3xl` | `96px` / `6rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button (CTA — "Talk to us") */
.btn-primary {
  background: #00E5FF;
  color: #081120;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #F4F8FC;
  border: 1px solid #33517C;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: #00E5FF;
  color: #00E5FF;
}
```

### Cards

```css
.card {
  background: #12233C;
  border: 1px solid #1E3A5F;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  border-color: #33517C;
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  background: #12233C;
  color: #F4F8FC;
  padding: 12px 16px;
  border: 1px solid #33517C;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #00E5FF;
  outline: none;
  box-shadow: 0 0 0 3px #00E5FF20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: #12233C;
  border: 1px solid #1E3A5F;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Modern Dark (Cinema Mobile)

**Keywords:** dark mode, cinematic, ambient light, glassmorphism, deep black, indigo, glow, blur, atmospheric, reanimated, haptic, premium, layered, frosted glass, linear gradient

**Best For:** Developer tools, pro productivity apps, fintech/trading dashboards, media/streaming platforms, AI tool interfaces, high-end gaming companion apps

**Key Effects:** Expo.out Bezier(0.16,1,0.3,1) easing; spring modals (damping:20 stiffness:90); haptic-linked press (Impact Light/Medium); animated ambient light blobs (Reanimated translateX/Y slow oscillation); BlurView glassmorphism headers/nav (intensity 20); scale press 0.97 → 1.0; avoid pure #000000 (OLED smear)

### Page Pattern

**Pattern Name:** Real-Time / Operations Landing

- **Conversion Strategy:** Task-based narrative ending in the primary action (per `docs/information-architecture.md` — the IA doc is authoritative for structure).
- **CTA Placement:** Persistently visible in sticky nav + hero + final Contact section. Label: **"Talk to us"**.
- **Section Order:** 1. Hero, 2. The problem, 3. What we build (services), 4. Proof (case-study cards), 5. How it works (3 steps), 6. Who we are (+ partners strip), 7. Contact (CTA moment). Footer: plain email always visible.

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Heavy chrome
- ❌ Slow response feedback

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Dark mode: text contrast 4.5:1 minimum (check gold-on-dark and muted `#A8A29E` text)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
