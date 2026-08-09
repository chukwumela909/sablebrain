"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import HeroBot from "../hero-bot/hero-bot";
import page from "../page.module.css";
import FilamentField from "../filament-field";
import HoursGrid from "./hours-grid";
import styles from "./visual-lab.module.css";

type Source =
  | { kind: "none" }
  | { kind: "filaments" }
  | { kind: "hours" }
  | { kind: "video"; url: string; label: string }
  | { kind: "image"; url: string; label: string };

type Placement = "full" | "right" | "band";
type Treatment = "none" | "duotone" | "tint";
type Blend = "normal" | "screen" | "lighten" | "soft-light" | "overlay";

const PLACEMENTS: { id: Placement; label: string }[] = [
  { id: "full", label: "Full bleed" },
  { id: "right", label: "Right panel" },
  { id: "band", label: "Band" },
];

const TREATMENTS: { id: Treatment; label: string }[] = [
  { id: "none", label: "As-is" },
  { id: "duotone", label: "Duotone" },
  { id: "tint", label: "Cyan tint" },
];

const BLENDS: Blend[] = ["normal", "screen", "lighten", "soft-light", "overlay"];

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export default function VisualLab() {
  const [source, setSource] = useState<Source>({ kind: "filaments" });
  const [placement, setPlacement] = useState<Placement>("full");
  const [treatment, setTreatment] = useState<Treatment>("none");
  const [blend, setBlend] = useState<Blend>("normal");
  const [opacity, setOpacity] = useState(100);
  const [scrim, setScrim] = useState(70);
  const [panelOpen, setPanelOpen] = useState(true);
  const [urlDraft, setUrlDraft] = useState("");
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  // "h" hides the panel so a candidate can be judged with nothing on top of it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "h" || e.key === "H") setPanelOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function loadFile(file: File | undefined) {
    if (!file) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setSource({
      kind: file.type.startsWith("video") ? "video" : "image",
      url,
      label: file.name,
    });
  }

  function loadUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setSource({
      kind: VIDEO_EXT.test(url) ? "video" : "image",
      url,
      label: url.split("/").pop() ?? url,
    });
  }

  const isMedia = source.kind === "video" || source.kind === "image";
  const desaturate = isMedia && treatment !== "none";

  const mediaClass = [
    styles.media,
    styles[placement],
    desaturate ? styles.desaturate : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={styles.stage}>
        <div
          className={mediaClass}
          style={{ opacity: opacity / 100, mixBlendMode: blend }}
        >
          {source.kind === "none" && (
            <div className={styles.empty}>No source loaded</div>
          )}
          {source.kind === "filaments" && <FilamentField />}
          {source.kind === "hours" && <HoursGrid />}
          {source.kind === "video" && (
            <video
              key={source.url}
              src={source.url}
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          {source.kind === "image" && (
            // Arbitrary blob/remote sources — next/image can't optimise these.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={source.url} src={source.url} alt="" />
          )}
          {treatment !== "none" && (
            <span
              className={`${styles.wash} ${
                treatment === "duotone" ? styles.duotone : styles.tint
              }`}
            />
          )}
        </div>

        <div className={styles.scrim} style={{ opacity: scrim / 100 }} />

        <div className={styles.content}>
          <header className={page.nav}>
            <a className={page.brand} href="#top" aria-label="Sable Brain home">
              <Image
                src="/sablebrain-wordmark.png"
                alt="Sable Brain"
                width={147}
                height={27}
                priority
              />
            </a>
            <nav className={page.navLinks} aria-label="Primary navigation">
              <a href="#work">Work</a>
              <a href="#services">Services</a>
              <a href="#about">About</a>
            </nav>
            <a href="#contact" className={page.navCta}>
              Talk to us
            </a>
          </header>

          <main className={page.page} id="top">
            <section className={page.hero}>
              <div className={page.heroCopy}>
                <p className={page.eyebrow}>AI operations agency</p>
                <h1>
                  AI workflows that automate <em>the boring work.</em>
                </h1>
                <p className={page.lede}>
                  Sable Brain builds AI systems that take repetitive tasks off
                  your team&apos;s plate — inside the tools you already use — so
                  your people can do the work that actually needs them.
                </p>
                <div className={page.heroActions}>
                  <a href="#contact" className={page.btnPrimary}>
                    Talk to us
                  </a>
                  <a href="#work" className={page.btnSecondary}>
                    See our work
                  </a>
                </div>
              </div>
              <div className={page.heroVisual}>
                <HeroBot />
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* The next real section, so the bottom edge of the media can be judged. */}
      <section className={page.problem}>
        <div className={page.sectionInner}>
          <p className={page.eyebrow}>The problem</p>
          <h2 className={page.problemStatement}>
            Every week, your best people spend hours copying data, chasing
            updates, and re-typing what a system already knows.
            <span> That isn&apos;t work. That&apos;s friction.</span>
          </h2>
        </div>
      </section>

      {panelOpen ? (
        <aside className={styles.panel} aria-label="Visual lab controls">
          <div className={styles.panelHead}>
            <h2>Visual lab</h2>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setPanelOpen(false)}
            >
              Hide
            </button>
          </div>

          <div className={styles.group}>
            <label htmlFor="lab-source">Source</label>
            <div className={styles.segmented} id="lab-source">
              <button
                type="button"
                className={`${styles.segment} ${source.kind === "none" ? styles.segmentOn : ""}`}
                onClick={() => setSource({ kind: "none" })}
              >
                None
              </button>
              <button
                type="button"
                className={`${styles.segment} ${source.kind === "filaments" ? styles.segmentOn : ""}`}
                onClick={() => setSource({ kind: "filaments" })}
              >
                Tangle → flow
              </button>
              <button
                type="button"
                className={`${styles.segment} ${source.kind === "hours" ? styles.segmentOn : ""}`}
                onClick={() => setSource({ kind: "hours" })}
              >
                Hours back
              </button>
            </div>
            <input
              type="file"
              className={styles.file}
              accept="video/*,image/*"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
            <div className={styles.row}>
              <input
                type="url"
                className={styles.url}
                placeholder="…or paste a clip / image URL"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadUrl();
                }}
              />
              <button type="button" className={styles.ghost} onClick={loadUrl}>
                Load
              </button>
            </div>
            {isMedia && <p className={styles.hint}>Loaded: {source.label}</p>}
          </div>

          <div className={styles.group}>
            <label htmlFor="lab-placement">Placement</label>
            <div className={styles.segmented} id="lab-placement">
              {PLACEMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.segment} ${placement === p.id ? styles.segmentOn : ""}`}
                  onClick={() => setPlacement(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <label htmlFor="lab-treatment">Treatment</label>
            <div className={styles.segmented} id="lab-treatment">
              {TREATMENTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.segment} ${treatment === t.id ? styles.segmentOn : ""}`}
                  onClick={() => setTreatment(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className={styles.hint}>
              Duotone desaturates the footage and re-colours it navy → cyan, so
              off-palette stock still reads as brand.
            </p>
          </div>

          <div className={styles.group}>
            <label htmlFor="lab-blend">Blend</label>
            <div className={styles.segmented} id="lab-blend">
              {BLENDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`${styles.segment} ${blend === b ? styles.segmentOn : ""}`}
                  onClick={() => setBlend(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.sliderLabel}>
              Opacity <b>{opacity}%</b>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              aria-label="Media opacity"
            />
            <span className={styles.sliderLabel}>
              Scrim <b>{scrim}%</b>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              value={scrim}
              onChange={(e) => setScrim(Number(e.target.value))}
              aria-label="Scrim strength"
            />
          </div>

          <div className={styles.recipe}>
            <span className={styles.sliderLabel}>Recipe</span>
            <pre>{`opacity: ${(opacity / 100).toFixed(2)};
mix-blend-mode: ${blend};${
              desaturate ? "\nfilter: grayscale(1) contrast(1.15);" : ""
            }${
              treatment === "duotone"
                ? "\n/* wash */ background: linear-gradient(135deg,#081120,#1e3a5f 45%,#00e5ff);\n/* wash */ mix-blend-mode: color;"
                : treatment === "tint"
                  ? "\n/* wash */ background: #00e5ff;\n/* wash */ mix-blend-mode: color;"
                  : ""
            }
/* scrim */ opacity: ${(scrim / 100).toFixed(2)};`}</pre>
            <p className={styles.hint}>Press H to hide this panel.</p>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          className={`${styles.ghost} ${styles.reveal}`}
          onClick={() => setPanelOpen(true)}
        >
          Controls
        </button>
      )}
    </>
  );
}
