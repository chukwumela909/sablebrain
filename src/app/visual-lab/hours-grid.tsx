"use client";

import { useEffect, useRef } from "react";

/**
 * Concept 5 — "hours handed back". A dense grid of blocks that evaporates down
 * to open space and refills, reading as a week without being a calendar.
 */
export default function HoursGrid({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const CELL = 14;
    const GAP = 8;
    const STEP = CELL + GAP;
    // Share of blocks that survive the sweep — the work that still needs a human.
    const KEEP = 0.22;

    let width = 0;
    let height = 0;
    let cells: { x: number; y: number; threshold: number; lit: boolean }[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / STEP) + 1;
      const rows = Math.ceil(height / STEP) + 1;
      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            x: c * STEP,
            y: r * STEP,
            // Bias the sweep left-to-right so it reads as a wave, not noise.
            threshold: (c / cols) * 0.55 + Math.random() * 0.45,
            lit: Math.random() < 0.06,
          });
        }
      }
    };

    const CYCLE = 12000;

    const draw = (t: number) => {
      const wave = (1 - Math.cos(((t % CYCLE) / CYCLE) * Math.PI * 2)) / 2;
      const cleared = wave * (1 - KEEP);

      ctx.clearRect(0, 0, width, height);
      for (const cell of cells) {
        // Each block fades across a short window either side of its threshold.
        const d = (cell.threshold - cleared) / 0.12;
        const presence = Math.min(1, Math.max(0, d));
        if (presence <= 0.01) continue;
        ctx.fillStyle = cell.lit
          ? `rgba(0, 229, 255, ${(0.5 * presence).toFixed(3)})`
          : `rgba(51, 81, 124, ${(0.55 * presence).toFixed(3)})`;
        ctx.fillRect(cell.x, cell.y, CELL, CELL);
      }
    };

    build();
    const observer = new ResizeObserver(() => {
      build();
      if (reduced) draw(CYCLE * 0.5);
    });
    observer.observe(canvas);

    if (reduced) {
      draw(CYCLE * 0.5);
      return () => observer.disconnect();
    }

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
