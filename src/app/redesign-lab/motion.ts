// Motion vocabulary shared by every redesign-lab illustration: the cinetic
// skill's easing tokens, small interpolation helpers, and the clocks that
// drive the illustrations while they are on screen.
import { useEffect, useRef, useState } from "react";

// Motion tokens from the cinetic skill: cubic-bezier easings solved for x.
export const bezier = (x1: number, y1: number, x2: number, y2: number) => (p: number) => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let u = p;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 - p;
    const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - x / dx));
  }
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
};
export const E = {
  out: bezier(0.16, 1, 0.3, 1),
  glide: bezier(0.47, 0.2, 0.15, 1),
  contact: bezier(0.55, 0, 0.9, 0.55),
  smooth: bezier(0.65, 0, 0.35, 1),
  ui: bezier(0.4, 0, 0.2, 1),
  inOut: bezier(0.87, 0, 0.13, 1),
};
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const prog = (t: number, from: number, to: number, ease: (p: number) => number = (p) => p) =>
  ease(clamp01((t - from) / (to - from)));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
// Punch envelope: a fast attack, then exponential decay (k in 60 fps frames).
export const hitPulse = (k: number, attack = 2, tau = 5) => (k < 0 ? 0 : k < attack ? k / attack : Math.exp(-(k - attack) / tau));

// Clock for a mockup's run when nothing drives it: t sweeps 0 → 1 (the run)
// and on to 1.15 (a soft reset) every `ms` while on screen; `cycle` counts
// loops. It rests finished (t = 1) until first seen, and under reduced motion.
export function useRunClock(ms: number, paused = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState({ t: 1, cycle: 0 });
  const lastCycle = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    let base = 0;
    const frame = (now: number) => {
      const elapsed = now - start;
      const cycle = base + Math.floor(elapsed / ms);
      lastCycle.current = cycle;
      setClock({ t: ((elapsed % ms) / ms) * 1.15, cycle });
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        if (!entry.isIntersecting) return;
        // Each visit starts a fresh run, numbered after the last one shown.
        base = lastCycle.current + 1;
        start = performance.now();
        raf = requestAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ms, paused]);

  return [ref, clock.t, clock.cycle] as const;
}

// Clock for the continuous scenes (Machines): seconds that run while the
// element is on screen and not paused, carrying on where they stopped. Under
// reduced motion it holds on `still`, a chosen frame.
export function useSeconds(paused = false, still = 2.4) {
  const ref = useRef<HTMLDivElement>(null);
  const [sec, setSec] = useState(still);
  const last = useRef(still);

  useEffect(() => {
    const el = ref.current;
    if (!el || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    let from = 0;
    const frame = (now: number) => {
      last.current = from + (now - start) / 1000;
      setSec(last.current);
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        if (!entry.isIntersecting) return;
        from = last.current;
        start = performance.now();
        raf = requestAnimationFrame(frame);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [paused]);

  return [ref, sec] as const;
}

// Deterministic pseudo-random numbers, so scenes lay out the same every load.
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
