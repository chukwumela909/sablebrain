"use client";

import { useEffect, useRef } from "react";

/**
 * Concept 1 — "tangle → parallel lines". A knot of filaments that combs itself
 * out into ordered streams and back again. Coded baseline to judge generated
 * footage against.
 */
export default function FilamentField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const COUNT = 44;
    const strands = Array.from({ length: COUNT }, (_, i) => ({
      lane: (i + 0.5) / COUNT,
      amp: 0.05 + Math.random() * 0.2,
      freq: 1.1 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
    }));

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // 0 = fully tangled, 1 = combed straight. Cosine so the loop is seamless.
    const CYCLE = 16000;

    const draw = (t: number) => {
      const wave = (1 - Math.cos(((t % CYCLE) / CYCLE) * Math.PI * 2)) / 2;
      const order = wave * wave * (3 - 2 * wave);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;

      for (const s of strands) {
        const amp = s.amp * (1 - order) * height;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 6) {
          const u = x / width;
          const wobble = Math.sin(
            u * s.freq * Math.PI * 2 + s.phase + t * 0.00018 * s.speed,
          );
          const drift = Math.sin(u * Math.PI * 1.4 + s.phase * 1.7) * 0.45;
          const y = s.lane * height + (wobble + drift) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(0, 229, 255, ${(0.09 + 0.2 * order).toFixed(3)})`;
        ctx.stroke();
      }
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) draw(CYCLE * 0.62);
    });
    observer.observe(canvas);

    if (reduced) {
      // Hold a mid-comb frame rather than animating.
      draw(CYCLE * 0.62);
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
