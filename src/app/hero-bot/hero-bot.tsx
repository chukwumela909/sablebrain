"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { HERO_MOTION, createMotion } from "./bot-motion";
import { createStage } from "./bot-stage";
import styles from "./hero-bot.module.css";

// Below this the hero is a single column and the canvas would cost battery for
// a visual nobody sees at size — three.js is never fetched there.
const DESKTOP = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export default function HeroBot() {
  const hostRef = useRef<HTMLDivElement>(null);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !isDesktop) return;

    let disposed = false;
    let teardown = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = createStage(THREE, host);
      const motion = createMotion(stage, HERO_MOTION);

      // Draw one frame up front. If the page loads in a background tab the
      // loop is paused before it ever runs, and the canvas would stay empty.
      motion.update(0);
      stage.render();

      const resize = () => {
        stage.resize();
        if (reduced) stage.render();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const onPointer = (e: PointerEvent) => {
        motion.setPointer(
          (e.clientX / window.innerWidth) * 2 - 1,
          (e.clientY / window.innerHeight) * 2 - 1,
        );
      };

      // Boot up as an entrance. Fired after the first update so the gesture is
      // timed against the loop's clock — firing before it would date the start
      // at 0 and the whole gesture would already have elapsed.
      let booted = false;
      const loop = (t: number) => {
        motion.update(t);
        if (!booted) {
          booted = true;
          motion.fire("bootUp");
        }
        stage.render();
      };

      if (reduced) {
        // Hold a three-quarter view instead of animating.
        stage.pivot.rotation.y = 0.35;
        stage.render();
      } else {
        window.addEventListener("pointermove", onPointer, { passive: true });
        stage.renderer.setAnimationLoop(loop);
      }

      // Stop the loop whenever the hero is scrolled away or the tab is hidden.
      let onScreen = true;
      const sync = () => {
        const run = onScreen && !document.hidden && !reduced;
        stage.renderer.setAnimationLoop(run ? loop : null);
      };
      const io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      io.observe(host);
      document.addEventListener("visibilitychange", sync);

      teardown = () => {
        stage.renderer.setAnimationLoop(null);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("pointermove", onPointer);
        stage.dispose();
      };
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, [isDesktop]);

  return <div ref={hostRef} className={styles.stage} aria-hidden="true" />;
}
