"use client";

import { useEffect, useRef, useState } from "react";
import {
  GESTURE_GROUPS,
  GESTURE_NAMES,
  GESTURES,
  HERO_MOTION,
  createMotion,
  type GestureName,
  type Motion,
  type MotionSettings,
} from "../hero-bot/bot-motion";
import { createStage } from "../hero-bot/bot-stage";
import styles from "./bot-lab.module.css";

// Somewhere to start from that actually shows every layer moving.
const LIVELY: MotionSettings = {
  breathe: 0.022,
  sway: 0.5,
  drift: 0.25,
  pointer: 0.42,
  headTrack: 0.35,
  armSway: 0.4,
  antenna: 0.35,
  ringSpin: 0.6,
  autoGestures: true,
};

const SLIDERS: {
  key: keyof Omit<MotionSettings, "autoGestures">;
  label: string;
  max: number;
  step: number;
}[] = [
  { key: "breathe", label: "Breathe", max: 0.06, step: 0.002 },
  { key: "sway", label: "Sway", max: 1.2, step: 0.02 },
  { key: "drift", label: "Drift", max: 0.6, step: 0.01 },
  { key: "pointer", label: "Cursor pull (body)", max: 1, step: 0.02 },
  { key: "headTrack", label: "Cursor pull (head)", max: 1, step: 0.02 },
  { key: "armSway", label: "Arm trail", max: 1, step: 0.02 },
  { key: "antenna", label: "Antenna pulse", max: 1, step: 0.02 },
  { key: "ringSpin", label: "Base ring spin", max: 4, step: 0.1 },
];

const BY_GROUP = GESTURE_GROUPS.map((group) => ({
  group,
  names: GESTURE_NAMES.filter((n) => GESTURES[n].group === group),
}));

export default function BotLab() {
  const hostRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Motion | null>(null);
  const runRef = useRef<((on: boolean) => void) | null>(null);
  const [settings, setSettings] = useState<MotionSettings>(LIVELY);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let teardown = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const stage = createStage(THREE, host);
      const motion = createMotion(stage.rigs[0], LIVELY);
      motionRef.current = motion;
      motion.update(0);
      stage.render();

      // Dev hook — this page is an internal tool. Lets you step a gesture
      // frame by frame from the console:
      //   const { stage, motion } = window.__botLab
      //   motion.update(0); motion.fire("alert"); motion.update(800); stage.render()
      (window as unknown as { __botLab?: unknown }).__botLab = { stage, motion };

      const ro = new ResizeObserver(() => {
        stage.resize();
        stage.render();
      });
      ro.observe(host);

      const onPointer = (e: PointerEvent) => {
        motion.setPointer(
          (e.clientX / window.innerWidth) * 2 - 1,
          (e.clientY / window.innerHeight) * 2 - 1,
        );
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const loop = (t: number) => {
        motion.update(t);
        stage.render();
      };
      runRef.current = (on) => stage.renderer.setAnimationLoop(on ? loop : null);
      stage.renderer.setAnimationLoop(loop);
      setReady(true);

      teardown = () => {
        stage.renderer.setAnimationLoop(null);
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        stage.dispose();
        motionRef.current = null;
        runRef.current = null;
        delete (window as unknown as { __botLab?: unknown }).__botLab;
      };
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, []);

  useEffect(() => {
    motionRef.current?.set(settings);
  }, [settings]);

  function fire(name: GestureName) {
    motionRef.current?.fire(name);
  }

  // Pausing is a render-loop concern, so it lives outside the settings object.
  useEffect(() => {
    if (ready) runRef.current?.(playing);
  }, [playing, ready]);

  const recipe = `const HERO_MOTION: MotionSettings = {
  breathe: ${settings.breathe.toFixed(3)},
  sway: ${settings.sway.toFixed(2)},
  drift: ${settings.drift.toFixed(2)},
  pointer: ${settings.pointer.toFixed(2)},
  headTrack: ${settings.headTrack.toFixed(2)},
  armSway: ${settings.armSway.toFixed(2)},
  antenna: ${settings.antenna.toFixed(2)},
  ringSpin: ${settings.ringSpin.toFixed(2)},
  autoGestures: ${settings.autoGestures},
};`;

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport}>
        <p className={styles.badge}>
          <b>Bot lab</b>
          <span>{ready ? "live" : "loading three.js…"}</span>
        </p>
        <div ref={hostRef} className={styles.stage} aria-hidden="true" />
      </div>

      <aside className={styles.panel}>
        <h1>Idle motion</h1>
        <p className={styles.hint}>
          Head, shoulders, and elbows are rigged as joints. Everything below the
          belt is still one solid piece.
        </p>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Ambient</span>
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <span className={styles.sliderLabel}>
                {s.label} <b>{settings[s.key].toFixed(s.step < 0.01 ? 3 : 2)}</b>
              </span>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={s.max}
                step={s.step}
                value={settings[s.key]}
                aria-label={s.label}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    [s.key]: Number(e.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>

        {BY_GROUP.map(({ group, names }) => (
          <div key={group} className={styles.group}>
            <span className={styles.groupLabel}>{group}</span>
            <div className={styles.buttons}>
              {names.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={styles.btn}
                  onClick={() => fire(g)}
                  title={
                    GESTURES[g].weight === 0
                      ? "Manual only — never auto-fired"
                      : `Auto weight ${GESTURES[g].weight}`
                  }
                >
                  {GESTURES[g].label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.group}>
          <span className={styles.groupLabel}>Auto-idle</span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnWide} ${
                settings.autoGestures ? styles.btnOn : ""
              }`}
              aria-pressed={settings.autoGestures}
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  autoGestures: !prev.autoGestures,
                }))
              }
            >
              Auto-idle {settings.autoGestures ? "on" : "off"}
            </button>
          </div>
          <p className={styles.hint}>
            Picks a gesture by weight every 2.5–7s — blinks and glances common,
            hops and alerts rare. Spin, boot up, and power down are manual only;
            hover any button to see its weight.
          </p>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Presets</span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => setSettings(HERO_MOTION)}
            >
              Hero (live)
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => setSettings(LIVELY)}
            >
              Lively
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnWide} ${playing ? "" : styles.btnOn}`}
              onClick={() => setPlaying((was) => !was)}
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Recipe</span>
          <pre className={styles.recipe}>{recipe}</pre>
          <p className={styles.hint}>
            Paste into <code>bot-motion.ts</code> to make the hero run these
            settings.
          </p>
        </div>
      </aside>
    </div>
  );
}
