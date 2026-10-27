"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import HeroBot from "../hero-bot/hero-bot";
import styles from "./hero-lab.module.css";

/**
 * Tuning bench for the homepage hero backdrop (hero-backdrop.tsx). Every
 * slider maps to one value in hero-backdrop.module.css; the CSS panel at the
 * bottom prints the rules for whatever is dialled in. Delete this route once
 * the backdrop is settled.
 */

type Palette = "blue" | "green";
type Viewport = "desktop" | "phone";

type Settings = {
  palette: Palette;
  blur: boolean;
  hills: boolean;
  glow: boolean;
  scrim: boolean;
  breathe: boolean;
  scale: number;
  shift: number;
  posx: number;
  posy: number;
  bright: number;
  glowop: number;
  glowtop: number;
  gloww: number;
  diag: number;
  vert: number;
  veil: number;
};

type NumKey =
  | "scale"
  | "shift"
  | "posx"
  | "posy"
  | "bright"
  | "glowop"
  | "glowtop"
  | "gloww"
  | "diag"
  | "vert"
  | "veil";

type LayerKey = "blur" | "hills" | "glow" | "scrim" | "breathe";

const IMG: Record<Palette, { blur: string; hills: string; glow: string }> = {
  blue: {
    blur: "/hero/hills-blur.webp",
    hills: "/hero/hills.webp",
    glow: "/hero/glow.webp",
  },
  green: {
    blur: "/hero/hills-blur-green.webp",
    hills: "/hero/hills-green.webp",
    glow: "/hero/glow-green.webp",
  },
};

// What hero-backdrop.module.css ships today, per viewport.
const SHIPPED: Record<Viewport, Settings> = {
  desktop: {
    palette: "blue",
    blur: true,
    hills: true,
    glow: true,
    scrim: true,
    breathe: true,
    scale: 1.14,
    shift: 7,
    posx: 50,
    posy: 55,
    bright: 1,
    glowop: 0.5,
    glowtop: 18,
    gloww: 180,
    diag: 1,
    vert: 1,
    veil: 0,
  },
  phone: {
    palette: "blue",
    blur: true,
    hills: true,
    glow: true,
    scrim: true,
    breathe: true,
    scale: 1,
    shift: 0,
    posx: 78,
    posy: 55,
    bright: 1,
    glowop: 0.35,
    glowtop: 18,
    gloww: 180,
    diag: 0,
    vert: 1,
    veil: 0.45,
  },
};

const PRESETS: { id: string; name: string; make: (vp: Viewport) => Settings }[] = [
  { id: "current", name: "Current iteration", make: (vp) => ({ ...SHIPPED[vp] }) },
  {
    id: "first",
    name: "First pass",
    make: (vp) => ({ ...SHIPPED[vp], scale: 1, shift: 0, posx: 62, diag: 0.85, veil: 0 }),
  },
  {
    id: "under",
    name: "Trail under headline",
    make: (vp) => ({
      ...SHIPPED[vp],
      scale: 1.1,
      shift: -8,
      posx: 40,
      diag: 0.5,
      bright: 1.1,
      veil: vp === "phone" ? 0.25 : 0,
    }),
  },
  {
    id: "quiet",
    name: "Hills only, quiet",
    make: (vp) => ({ ...SHIPPED[vp], glow: false, blur: false, bright: 0.85, diag: 0.7 }),
  },
  {
    id: "glowy",
    name: "Glow forward",
    make: (vp) => ({ ...SHIPPED[vp], glowop: 0.85, gloww: 220, glowtop: 8, bright: 0.9 }),
  },
  {
    id: "green",
    name: "PayPath green, same crop",
    make: (vp) => ({ ...SHIPPED[vp], palette: "green" }),
  },
];

const SLIDERS: { key: NumKey; label: string; min: number; max: number; step: number; group: string }[] = [
  { key: "scale", label: "Scale", min: 1, max: 1.5, step: 0.01, group: "Hills crop" },
  { key: "shift", label: "Slide right", min: -15, max: 25, step: 1, group: "Hills crop" },
  { key: "posx", label: "Crop focus X", min: 0, max: 100, step: 1, group: "Hills crop" },
  { key: "posy", label: "Crop focus Y", min: 0, max: 100, step: 1, group: "Hills crop" },
  { key: "bright", label: "Brightness", min: 0.6, max: 1.4, step: 0.01, group: "Hills crop" },
  { key: "glowop", label: "Opacity", min: 0, max: 1, step: 0.01, group: "Glow" },
  { key: "glowtop", label: "Vertical position", min: -30, max: 70, step: 1, group: "Glow" },
  { key: "gloww", label: "Width", min: 100, max: 260, step: 2, group: "Glow" },
  { key: "diag", label: "Copy-column shade", min: 0, max: 1.3, step: 0.01, group: "Scrim" },
  { key: "vert", label: "Top shade (under nav)", min: 0, max: 1.3, step: 0.01, group: "Scrim" },
  { key: "veil", label: "Even veil", min: 0, max: 0.7, step: 0.01, group: "Scrim" },
];

const SLIDER_GROUPS = SLIDERS.reduce<{ group: string; sliders: typeof SLIDERS }[]>(
  (acc, sl) => {
    const last = acc[acc.length - 1];
    if (last && last.group === sl.group) last.sliders.push(sl);
    else acc.push({ group: sl.group, sliders: [sl] });
    return acc;
  },
  [],
);

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: "blur", label: "Blur base" },
  { key: "hills", label: "Hills" },
  { key: "glow", label: "Glow" },
  { key: "scrim", label: "Scrim" },
  { key: "breathe", label: "Glow breathe" },
];

const PERCENT: NumKey[] = ["shift", "posx", "posy", "glowtop", "gloww"];

function fmt(key: NumKey, v: number) {
  if (key === "scale") return `${v.toFixed(2)}×`;
  if (PERCENT.includes(key)) return `${v}%`;
  return v.toFixed(2);
}

function same(a: Settings, b: Settings) {
  return (Object.keys(a) as (keyof Settings)[]).every((k) => a[k] === b[k]);
}

function summary(s: Settings) {
  const bits = [];
  if (s.palette === "green") bits.push("green");
  bits.push(
    `scale ${s.scale.toFixed(2)}`,
    `slide ${s.shift}%`,
    `shade ${s.diag.toFixed(2)}`,
    `glow ${s.glowop.toFixed(2)}`,
  );
  if (s.veil) bits.push(`veil ${s.veil.toFixed(2)}`);
  return bits.join(" · ");
}

function cssFor(s: Settings, vp: Viewport) {
  const rgb = s.palette === "green" ? "6, 47, 38" : "8, 17, 32";
  const a = (x: number) => Math.max(0, Math.min(1, x)).toFixed(2);
  const off = (["blur", "hills", "glow", "scrim"] as const).filter((k) => !s[k]);
  return `/* ${vp} · ${s.palette} */
.blur,
.hills {
  object-fit: cover;
  object-position: ${s.posx}% ${s.posy}%;
  transform: ${s.scale === 1 && s.shift === 0 ? "none" : `translateX(${s.shift}%) scale(${s.scale})`};
  transform-origin: 50% 55%;${s.bright !== 1 ? `\n  filter: brightness(${s.bright});` : ""}
}

.glow {
  top: ${s.glowtop}%;
  width: ${s.gloww}%;
  opacity: ${s.glowop};${s.breathe ? "" : "\n  animation: none;"}
}

.scrim {
  background:
    linear-gradient(
      to bottom,
      rgba(${rgb}, ${a(0.75 * s.vert)}) 0%,
      rgba(${rgb}, ${a(0.1 * s.vert)}) 26%,
      rgba(${rgb}, 0) 60%,
      rgba(${rgb}, 0.6) 88%,
      var(--color-background) 100%
    ),
    linear-gradient(
      100deg,
      rgba(${rgb}, ${a(0.82 * s.diag)}) 0%,
      rgba(${rgb}, ${a(0.6 * s.diag)}) 38%,
      rgba(${rgb}, ${a(0.18 * s.diag)}) 62%,
      rgba(${rgb}, 0) 85%
    )${s.veil ? `,\n    rgba(${rgb}, ${a(s.veil)})` : ""};
}${off.length ? `\n\n/* layers off: ${off.join(", ")} — remove those elements from hero-backdrop.tsx */` : ""}`;
}

function PlaceholderBot() {
  return (
    <svg viewBox="0 0 120 170" aria-hidden="true">
      <line x1="60" y1="14" x2="60" y2="30" stroke="#9fb3cc" strokeWidth="4" />
      <circle cx="60" cy="10" r="6" fill="#00e5ff" />
      <rect x="22" y="30" width="76" height="56" rx="14" fill="#d7dfe9" />
      <rect x="34" y="44" width="52" height="26" rx="8" fill="#101a2a" />
      <circle cx="48" cy="57" r="5" fill="#00e5ff" />
      <circle cx="72" cy="57" r="5" fill="#00e5ff" />
      <rect x="28" y="94" width="64" height="56" rx="12" fill="#c9d3e0" />
      <rect x="48" y="108" width="24" height="22" rx="4" fill="#101a2a" />
      <rect x="54" y="114" width="12" height="10" rx="2" fill="#00e5ff" />
      <rect x="10" y="98" width="14" height="36" rx="7" fill="#aebbcc" />
      <rect x="96" y="98" width="14" height="36" rx="7" fill="#aebbcc" />
      <rect x="36" y="152" width="18" height="14" rx="5" fill="#8fa0b5" />
      <rect x="66" y="152" width="18" height="14" rx="5" fill="#8fa0b5" />
    </svg>
  );
}

/**
 * A scaled-down replica of the homepage hero. Numbers mirror page.module.css
 * and hero-backdrop.module.css. `live` frames get the real three.js bots;
 * pinned frames get flat stand-ins so compare mode doesn't run two scenes.
 */
function HeroMock({ s, vp, live }: { s: Settings; vp: Viewport; live: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  const w = vp === "phone" ? 375 : 1440;
  const h = vp === "phone" ? 760 : 720;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setK(Math.min(1, el.clientWidth / w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  const vars = {
    "--scale": s.scale,
    "--shift": `${s.shift}%`,
    "--posx": `${s.posx}%`,
    "--posy": `${s.posy}%`,
    "--bright": s.bright,
    "--glow-op": s.glowop,
    "--glow-top": `${s.glowtop}%`,
    "--glow-w": `${s.gloww}%`,
    "--d": s.diag,
    "--v": s.vert,
    "--veil": s.veil,
    transform: `scale(${k})`,
  } as CSSProperties;

  const src = IMG[s.palette];

  return (
    <div ref={stageRef} className={styles.stage} style={{ height: Math.round(h * k) }}>
      <div
        className={styles.hero}
        data-palette={s.palette}
        data-vp={vp}
        data-breathe={s.breathe ? "on" : "off"}
        style={vars}
      >
        <div className={styles.backdrop} aria-hidden="true">
          {s.blur && <Image src={src.blur} alt="" fill sizes="1440px" className={styles.blur} />}
          {s.hills && <Image src={src.hills} alt="" fill sizes="1440px" className={styles.hills} />}
          {s.glow && (
            <Image src={src.glow} alt="" width={1600} height={582} sizes="2600px" className={styles.glowImg} />
          )}
          {s.scrim && <div className={styles.scrim} />}
        </div>
        <div className={styles.mockNav}>
          <Image src="/sablebrain-wordmark.png" alt="Sable Brain" width={147} height={27} />
          <div className={styles.mockLinks}>
            <span>Work</span>
            <span>Services</span>
            <span>About</span>
          </div>
          <span className={styles.mockCta}>Talk to us</span>
        </div>
        <div className={styles.mockBody}>
          <div className={styles.mockCopy}>
            <p className={styles.mockEyebrow}>AI operations agency</p>
            <h2 className={styles.mockH1}>
              AI workflows that automate <em>the boring work.</em>
            </h2>
            <p className={styles.mockLede}>
              Your team loses hours every week to copy, paste, check, forward. We build AI
              systems that handle that work inside the tools you already use, so your people
              can get back to the work only they can do.
            </p>
            <div className={styles.mockActions}>
              <span className={styles.mockBtnP}>Talk to us</span>
              <span className={styles.mockBtnS}>See our work</span>
            </div>
            <p className={styles.mockDialogue}>
              <b>&ldquo;Someone still does invoice approvals by hand.&rdquo;</b>
              <b>&ldquo;We map it, build it, and it runs itself.&rdquo;</b>
              <b>&ldquo;And the six hours?&rdquo; &mdash; &ldquo;Handed back.&rdquo;</b>
            </p>
          </div>
          <div className={styles.mockVisual}>
            {live ? (
              <HeroBot />
            ) : (
              <div className={styles.placeholderBots}>
                <PlaceholderBot />
                <PlaceholderBot />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroLab() {
  const [vp, setVp] = useState<Viewport>("desktop");
  const [compare, setCompare] = useState(false);
  const [A, setA] = useState<Settings>(SHIPPED.desktop);
  const [B, setB] = useState<Settings>(SHIPPED.desktop);
  const [toast, setToast] = useState("");
  const cssRef = useRef<HTMLPreElement>(null);

  const setNum = (key: NumKey, v: number) => setB((b) => ({ ...b, [key]: v }));
  const toggle = (key: LayerKey) => setB((b) => ({ ...b, [key]: !b[key] }));
  const switchVp = (next: Viewport) => {
    if (next === vp) return;
    setVp(next);
    setB((b) => ({ ...SHIPPED[next], palette: b.palette }));
    setA((a) => ({ ...SHIPPED[next], palette: a.palette }));
  };

  const css = cssFor(B, vp);
  const copy = () => {
    const fallback = () => {
      const pre = cssRef.current;
      if (!pre) return;
      const r = document.createRange();
      r.selectNodeContents(pre);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      setToast("Selected. Press ⌘C to copy.");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(css).then(() => setToast("Copied."), fallback);
    } else fallback();
  };

  const diffs = (Object.keys(B) as (keyof Settings)[]).filter((k) => A[k] !== B[k]);
  const show = (k: keyof Settings, v: Settings[keyof Settings]) =>
    typeof v === "boolean" ? (v ? "on" : "off") : typeof v === "number" ? fmt(k as NumKey, v) : v;

  return (
    <main className={styles.page}>
      <header className={styles.bench}>
        <div>
          <h1 className={styles.title}>Hero backdrop lab</h1>
          <p className={styles.sub}>
            Homepage hero · hills, blur and glow layers behind the copy. Live frame runs the real
            bots; a pinned frame uses stand-ins.
          </p>
        </div>
        <div className={styles.spacer} />
        <div className={styles.seg} role="group" aria-label="Viewport">
          <button aria-pressed={vp === "desktop"} onClick={() => switchVp("desktop")}>
            Desktop 1440
          </button>
          <button aria-pressed={vp === "phone"} onClick={() => switchVp("phone")}>
            Phone 375
          </button>
        </div>
        <div className={styles.seg} role="group" aria-label="Compare">
          <button aria-pressed={!compare} onClick={() => setCompare(false)}>
            Single
          </button>
          <button aria-pressed={compare} onClick={() => setCompare(true)}>
            Compare A / B
          </button>
        </div>
      </header>

      <div className={styles.presets}>
        <span className={styles.presetsLabel}>Presets</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={styles.chip}
            aria-pressed={same(p.make(vp), B)}
            onClick={() => setB(p.make(vp))}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.frames}>
          {compare && (
            <div>
              <p className={styles.tag}>
                <span>
                  <b>A</b> · pinned
                </span>
                <span>{summary(A)}</span>
              </p>
              <HeroMock s={A} vp={vp} live={false} />
            </div>
          )}
          <div>
            <p className={styles.tag}>
              <span>
                <b>{compare ? "B · live" : "Live"}</b>
              </span>
              <span>{summary(B)}</span>
            </p>
            <HeroMock s={B} vp={vp} live />
          </div>
        </div>

        <aside className={styles.rail} aria-label="Controls">
          <h3 className={styles.railHead}>Palette</h3>
          <div className={styles.seg} role="group" aria-label="Palette">
            <button
              aria-pressed={B.palette === "blue"}
              onClick={() => setB((b) => ({ ...b, palette: "blue" }))}
            >
              Sable Brain blue
            </button>
            <button
              aria-pressed={B.palette === "green"}
              onClick={() => setB((b) => ({ ...b, palette: "green" }))}
            >
              PayPath green
            </button>
          </div>

          <h3 className={styles.railHead}>Layers</h3>
          <div className={styles.toggles}>
            {LAYERS.map((l) => (
              <button key={l.key} aria-pressed={B[l.key]} onClick={() => toggle(l.key)}>
                {l.label}
              </button>
            ))}
          </div>

          {SLIDER_GROUPS.map((g) => (
            <div key={g.group}>
              <h3 className={styles.railHead}>{g.group}</h3>
              {g.sliders.map((sl) => (
                <div key={sl.key} className={styles.row}>
                  <label htmlFor={`hl-${sl.key}`}>{sl.label}</label>
                  <output>{fmt(sl.key, B[sl.key])}</output>
                  <input
                    id={`hl-${sl.key}`}
                    type="range"
                    min={sl.min}
                    max={sl.max}
                    step={sl.step}
                    value={B[sl.key]}
                    onChange={(e) => setNum(sl.key, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
          ))}

          <h3 className={styles.railHead}>Compare</h3>
          <div className={styles.actions}>
            <button
              className={styles.btn}
              onClick={() => {
                setA(B);
                setCompare(true);
              }}
            >
              Pin live as A
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => {
                setA(B);
                setB(A);
                setCompare(true);
              }}
            >
              Swap A and B
            </button>
            <button className={styles.btnGhost} onClick={() => setB(SHIPPED[vp])}>
              Back to current
            </button>
          </div>
          <ul className={styles.diff}>
            {!compare ? (
              <li className={styles.note}>
                Pin the live settings as A, then change things to see the difference stacked.
              </li>
            ) : diffs.length === 0 ? (
              <li className={styles.note}>A and B are identical.</li>
            ) : (
              diffs.map((k) => (
                <li key={k}>
                  <b>{k}</b> {show(k, A[k])} → {show(k, B[k])}
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <details className={styles.cssPanel}>
        <summary>CSS for the live settings</summary>
        <p className={styles.note}>
          Paste over the matching rules in <code>src/app/hero-backdrop.module.css</code>. Desktop
          values go in the base rules; phone values go in the{" "}
          <code>@media (max-width: 1023px)</code> block.
        </p>
        <pre ref={cssRef}>{css}</pre>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={copy}>
            Copy CSS
          </button>
          <span className={styles.note}>{toast}</span>
        </div>
      </details>
    </main>
  );
}
