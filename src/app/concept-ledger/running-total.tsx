"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ledger.module.css";

/**
 * The ledger's running balance.
 *
 * Any element on the page carrying `data-credit="<hours>"` posts to the
 * balance the first time it scrolls into view; the figure tweens up to the
 * new total. Reduced motion snaps instead of tweening.
 */

const format = new Intl.NumberFormat("en-US");

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function RunningTotal() {
  // Rendered on the server too, so both passes must start at 0.
  const [shown, setShown] = useState(0);
  const [target, setTarget] = useState(0);
  const shownRef = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const credits = document.querySelectorAll<HTMLElement>("[data-credit]");

    const post = (el: HTMLElement) => {
      const value = Number(el.dataset.credit);
      if (Number.isFinite(value)) setTarget((total) => total + value);
    };

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      credits.forEach(post);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            post(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );

    credits.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;

    if (prefersReducedMotion()) {
      // Snap via rAF: a sync setState here trips react-hooks/set-state-in-effect.
      frame.current = requestAnimationFrame(() => {
        shownRef.current = target;
        setShown(target);
      });
      return () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      };
    }

    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // expo-out, per the design system
      const value = Math.round(from + (target - from) * eased);
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target]);

  return (
    <aside className={styles.rail} aria-hidden="true">
      <span className={styles.railLabel}>Hours returned</span>
      <span className={styles.railFigure}>{format.format(shown)}</span>
      <span className={styles.railUnit}>hours a year, across engagements</span>
    </aside>
  );
}
