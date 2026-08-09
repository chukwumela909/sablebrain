"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  PAIR_MOTION,
  createMotion,
  type GestureFloor,
  type Motion,
} from "./bot-motion";
import { createStage, type Rig } from "./bot-stage";
import { dwellFor, runConversation, type Turn } from "./conversation";
import styles from "./hero-bot.module.css";

// Keep in sync with the `.heroVisual` breakpoint in page.module.css — below
// this the hero is a single column and the scene isn't rendered at all, so
// three.js is never fetched.
const DESKTOP = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

type Bubble = {
  el: HTMLElement;
  anchor: Rig["anchor"];
  x: number;
  y: number;
  placed: boolean;
};

/**
 * Project each bot's head anchor to CSS pixels and move its bubble there.
 *
 * Runs after render(), so world matrices are already current. Note the maths
 * uses the canvas's CSS size only — devicePixelRatio sizes the drawing buffer,
 * not the CSS box, and folding it in here would offset every bubble by 2x on a
 * retina display.
 */
function syncBubbles(
  bubbles: Bubble[],
  project: (anchor: Rig["anchor"]) => { x: number; y: number; z: number },
  smooth: number,
) {
  for (const b of bubbles) {
    const p = project(b.anchor);
    if (!b.placed) {
      b.x = p.x;
      b.y = p.y;
      b.placed = true;
    } else {
      // Trailing slightly behind the head reads better than being welded to
      // it, and absorbs the jitter from blinks and hops.
      b.x += (p.x - b.x) * smooth;
      b.y += (p.y - b.y) * smooth;
    }
    // Custom properties, not `transform` — the stylesheet composes these with
    // a percentage offset of the bubble's own size, which JS can't express
    // without knowing the box. Still compositor-only; no layout.
    b.el.style.setProperty("--bx", `${b.x.toFixed(1)}px`);
    b.el.style.setProperty("--by", `${b.y.toFixed(1)}px`);
    b.el.style.visibility = p.z > 1 ? "hidden" : "visible";
  }
}

export default function HeroBot() {
  const hostRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const motionsRef = useRef<Motion[] | null>(null);
  const [playback, setPlayback] = useState<{ turns: Turn[]; index: number }>({
    turns: [],
    index: -1,
  });

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
      // headroom was 0.42, which handed 30% of the canvas to empty sky and left
      // the pair rendering ~276px wide. 0.20 still clears the antenna bulb for
      // a speech bubble but gives the bots back ~1.6x their pixel area; the
      // tighter pad works because gestures reach up, not out.
      const stage = createStage(THREE, host, {
        count: 2,
        spacing: 1.06,
        toeIn: 0.36,
        headroom: 0.2,
        pad: 0.05,
        maxPixelRatio: 1.5,
      });

      const floor: GestureFloor = { holder: null, until: 0 };
      const motions = stage.rigs.map((rig, i) =>
        createMotion(rig, PAIR_MOTION[i], { phase: i * 3700, floor }),
      );
      motionsRef.current = motions;

      const vec = new THREE.Vector3();
      const project = (anchor: Rig["anchor"]) => {
        vec.setFromMatrixPosition(anchor.matrixWorld);
        vec.project(stage.camera);
        return {
          x: (vec.x * 0.5 + 0.5) * stage.size.w,
          y: (1 - (vec.y * 0.5 + 0.5)) * stage.size.h,
          z: vec.z,
        };
      };

      const bubbles: Bubble[] = [];
      stage.rigs.forEach((rig, i) => {
        const el = bubbleRefs.current[i];
        if (el) bubbles.push({ el, anchor: rig.anchor, x: 0, y: 0, placed: false });
      });

      /** Every render path outside the loop goes through here, so bubbles can
       *  never be left sitting at 0,0 while the loop is paused. */
      const drawOnce = (t: number) => {
        for (const m of motions) m.update(t);
        stage.render();
        syncBubbles(bubbles, project, 1);
      };

      drawOnce(0);

      const resize = () => {
        stage.resize();
        if (reduced) drawOnce(0);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const onPointer = (e: PointerEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        for (const m of motions) m.setPointer(x, y);
      };

      let booted = false;
      const loop = (t: number) => {
        for (const m of motions) m.update(t);
        if (!booted) {
          booted = true;
          // Staggered so they don't wake in unison.
          motions[0].fire("bootUp");
          window.setTimeout(() => motions[1]?.fire("bootUp"), 420);
        }
        stage.render();
        syncBubbles(bubbles, project, 0.25);
      };

      if (reduced) {
        // Mirrored, not identical — the same yaw on both would turn them the
        // same way and destroy the facing-each-other read.
        stage.rigs[0].pivot.rotation.y = 0.1;
        stage.rigs[1].pivot.rotation.y = -0.1;
        drawOnce(0);
      } else {
        window.addEventListener("pointermove", onPointer, { passive: true });
        stage.renderer.setAnimationLoop(loop);
      }

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
        motionsRef.current = null;
        stage.dispose();
      };
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, [isDesktop]);

  // They start talking on their own — there's nothing to ask them.
  useEffect(() => {
    if (!isDesktop) return;
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const turns = await runConversation();
      if (!cancelled) setPlayback({ turns, index: 0 });
    }, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [isDesktop]);

  // Play the current turn, then schedule the next.
  useEffect(() => {
    const { turns, index } = playback;
    if (index < 0 || index >= turns.length) return;

    const turn = turns[index];
    const motions = motionsRef.current;
    if (motions) {
      motions[turn.speaker]?.fire(turn.gesture);
      if (turn.listener) motions[turn.speaker === 0 ? 1 : 0]?.fire(turn.listener);
    }

    // On the last line, hold it a beat and then start a fresh exchange — with
    // no input to trigger one, stopping here would freeze the hero mid-scene.
    if (index >= turns.length - 1) {
      let cancelled = false;
      const restart = window.setTimeout(async () => {
        const next = await runConversation();
        if (!cancelled) setPlayback({ turns: next, index: 0 });
      }, dwellFor(turn.text) + 2800);
      return () => {
        cancelled = true;
        window.clearTimeout(restart);
      };
    }

    const id = window.setTimeout(() => {
      setPlayback((prev) =>
        prev.turns === turns ? { turns, index: index + 1 } : prev,
      );
    }, dwellFor(turn.text));
    return () => window.clearTimeout(id);
  }, [playback]);

  const current =
    playback.index >= 0 && playback.index < playback.turns.length
      ? playback.turns[playback.index]
      : null;

  // Each bubble keeps the last line its own bot said. Clearing the text the
  // moment the speaker changes would leave an empty bordered box fading out
  // over the 220ms opacity transition.
  const lines: [string, string] = ["", ""];
  for (let i = 0; i <= playback.index && i < playback.turns.length; i++) {
    lines[playback.turns[i].speaker] = playback.turns[i].text;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.scene}>
        {/* The canvas is decoration; the bubbles below are content. */}
        <div ref={hostRef} className={styles.stage} aria-hidden="true" />

        <div className={styles.bubbles} aria-hidden="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              ref={(el) => {
                bubbleRefs.current[i] = el;
              }}
              className={`${styles.bubble} ${i === 0 ? styles.bubbleLeft : styles.bubbleRight}`}
              data-visible={current?.speaker === i ? "true" : "false"}
            >
              {lines[i]}
            </div>
          ))}
        </div>

        <p className={styles.srOnly} aria-live="polite">
          {current ? `Bot ${current.speaker + 1}: ${current.text}` : ""}
        </p>
      </div>
    </div>
  );
}
