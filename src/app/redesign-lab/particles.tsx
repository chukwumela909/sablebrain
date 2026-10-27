"use client";

// "Particles": the services drawn in thousands of small cyan squares (the
// brand's marker) on a canvas filling each tile. Every particle's position
// is a pure function of time, so scenes loop without state and can be
// paused or frozen on any frame.

import { useEffect, useRef } from "react";
import { E, hitPulse, mix, prog, seeded } from "./motion";
import ill from "./illustrations.module.css";

type SceneProps = { paused?: boolean };
// Scenes draw in an 800 × 480 space centred on the tile, scaled to fit;
// anything outside it still draws, out to the tile's edges.
type View = { ctx: CanvasRenderingContext2D; s: number; ox: number; oy: number; dpr: number; font: string };
type Scene<D> = { seed: number; still: number; label: string; setup: (rand: () => number) => D; draw: (v: View, t: number, data: D) => void };

const CYAN = "#00e5ff";
const CREAM = "#f4f8fc";
const MUTE = "#93a9c4";

function dot(v: View, x: number, y: number, size: number, alpha: number) {
  if (alpha <= 0.01) return;
  v.ctx.globalAlpha = Math.min(1, alpha);
  const r = Math.max(0.9 * v.dpr, size * v.s);
  v.ctx.fillRect(v.ox + x * v.s - r / 2, v.oy + y * v.s - r / 2, r, r);
}

function text(v: View, label: string, x: number, y: number, opts: { align?: CanvasTextAlign; color?: string; alpha?: number } = {}) {
  const { ctx } = v;
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.fillStyle = opts.color ?? MUTE;
  ctx.font = `${Math.max(9 * v.dpr, 12 * v.s)}px ${v.font}`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, v.ox + x * v.s, v.oy + y * v.s);
}

function ParticleCanvas<D>({ scene, paused }: { scene: Scene<D>; paused?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef(scene.still);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const data = scene.setup(seeded(scene.seed));
    const font = getComputedStyle(canvas).getPropertyValue("--mono").trim() || "monospace";
    const view: View = { ctx, s: 1, ox: 0, oy: 0, dpr: 1, font };
    const render = (t: number) => {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scene.draw(view, t, data);
    };
    const size = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      view.dpr = dpr;
      view.s = Math.min(rect.width / 800, rect.height / 480) * dpr;
      view.ox = canvas.width / 2;
      view.oy = canvas.height / 2;
      render(last.current);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    // Paused or reduced motion: hold the current (or chosen) frame.
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => ro.disconnect();
    let raf = 0;
    let start = 0;
    let from = 0;
    const frame = (now: number) => {
      last.current = from + (now - start) / 1000;
      render(last.current);
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
    io.observe(canvas);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [scene, paused]);

  return <canvas ref={ref} className={ill.canvas} role="img" aria-label={scene.label} />;
}

// ───────── 01 · Busywork → routed ─────────
// A jittery, dim scatter on the left (the busywork) is drawn through a gate
// into a tight bright bundle, then fans out into three orderly lanes. A few
// cream particles are peeled off upward to review.
type FlowData = { o: Float32Array; lane: Uint8Array; flag: Uint8Array; sx: Float32Array; sy: Float32Array; ph: Float32Array; f1: Float32Array; f2: Float32Array };
const LANES = [-96, 0, 96];

const flowScene: Scene<FlowData> = {
  seed: 11,
  still: 7,
  label: "Scattered busywork drawn through a gate into three orderly lanes",
  setup(rand) {
    const n = 1100;
    const d: FlowData = {
      o: new Float32Array(n),
      lane: new Uint8Array(n),
      flag: new Uint8Array(n),
      sx: new Float32Array(n),
      sy: new Float32Array(n),
      ph: new Float32Array(n),
      f1: new Float32Array(n),
      f2: new Float32Array(n),
    };
    for (let i = 0; i < n; i++) {
      d.o[i] = rand();
      d.lane[i] = i % 3;
      d.flag[i] = rand() < 0.035 ? 1 : 0;
      d.sx[i] = -400 + rand() * 300;
      d.sy[i] = (rand() - 0.5) * 420;
      d.ph[i] = rand() * Math.PI * 2;
      d.f1[i] = 1.5 + rand() * 3;
      d.f2[i] = 1.5 + rand() * 3;
    }
    return d;
  },
  draw(v, t, d) {
    const n = d.o.length;
    const flagged: [number, number, number][] = [];
    v.ctx.fillStyle = CYAN;
    for (let y = -48; y <= 48; y += 6) {
      dot(v, -80, y, 1.2, 0.3);
      dot(v, 60, y, 1.2, 0.3);
    }
    for (let i = 0; i < n; i++) {
      const u = (d.o[i] + t * 0.055) % 1;
      const laneY = LANES[d.lane[i]];
      let x: number;
      let y: number;
      let a: number;
      if (u < 0.45) {
        const k = u / 0.45;
        const e = E.smooth(k);
        const amp = 14 * (1 - k) ** 1.5;
        x = mix(d.sx[i], -80, e) + Math.sin(t * d.f1[i] + d.ph[i]) * amp;
        y = mix(d.sy[i], d.sy[i] * 0.1, e) + Math.cos(t * d.f2[i] + d.ph[i] * 1.7) * amp;
        a = 0.32 + 0.5 * k;
      } else if (u < 0.58) {
        const k = (u - 0.45) / 0.13;
        x = mix(-80, 60, k);
        y = mix(d.sy[i] * 0.1, laneY * 0.06, k);
        a = 0.95;
      } else {
        const k = (u - 0.58) / 0.42;
        x = mix(60, 400, k);
        if (d.flag[i]) {
          flagged.push([mix(60, 300, k), mix(laneY * 0.06, -176, E.inOut(prog(k, 0, 0.55))), 0.95 * (1 - prog(k, 0.88, 1))]);
          continue;
        }
        y = mix(laneY * 0.06, laneY, E.out(prog(k, 0, 0.5)));
        a = 0.85 * (1 - prog(k, 0.92, 1));
      }
      dot(v, x, y, u < 0.45 ? 1.7 : 1.5, a);
    }
    v.ctx.fillStyle = CREAM;
    for (const [x, y, a] of flagged) dot(v, x, y, 1.8, a);
    text(v, "BUSYWORK", -390, -214);
    text(v, `ROUTED ${(1284 + Math.floor(t * 3)).toLocaleString("en-US")}`, 395, -130, { align: "right" });
    text(v, "REVIEW", 300, -200, { color: CREAM, align: "center" });
  },
};

// ───────── 02 · Network ─────────
// A turning hub ring with four dotted tool frames around it. Streams flow
// out to each tool and back along curved paths; each tool pulses on its sync.
type NetData = { ring: Float32Array; disc: Float32Array; frame: Float32Array; stream: Float32Array; dust: Float32Array };
const NET_TOOLS: [number, number, string][] = [
  [-290, -140, "HUBSPOT"],
  [290, -140, "INBOX"],
  [-290, 140, "SHEETS"],
  [290, 140, "DASHBOARD"],
];

const netScene: Scene<NetData> = {
  seed: 23,
  still: 3,
  label: "Four tools linked to one hub by streams of data",
  setup(rand) {
    const ring = new Float32Array(96).map((_, i) => (i / 96) * Math.PI * 2);
    const disc = new Float32Array(140 * 2);
    for (let i = 0; i < 140; i++) {
      const r = Math.sqrt(rand()) * 32;
      const a = rand() * Math.PI * 2;
      disc[i * 2] = Math.cos(a) * r;
      disc[i * 2 + 1] = Math.sin(a) * r;
    }
    // Points round a 70 × 70 frame.
    const frame = new Float32Array(56 * 2);
    for (let i = 0; i < 56; i++) {
      const p = (i / 56) * 4;
      const side = Math.floor(p);
      const f = p - side;
      const [x, y] = [
        [-35 + f * 70, -35],
        [35, -35 + f * 70],
        [35 - f * 70, 35],
        [-35, 35 - f * 70],
      ][side];
      frame[i * 2] = x;
      frame[i * 2 + 1] = y;
    }
    const stream = new Float32Array(4 * 2 * 64 * 2);
    for (let i = 0; i < stream.length; i += 2) {
      stream[i] = rand();
      stream[i + 1] = (rand() - 0.5) * 6;
    }
    const dust = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      dust[i * 3] = rand() * 800 - 400;
      dust[i * 3 + 1] = rand() * 480 - 240;
      dust[i * 3 + 2] = 2 + rand() * 6;
    }
    return { ring, disc, frame, stream, dust };
  },
  draw(v, t, d) {
    v.ctx.fillStyle = CYAN;
    for (let i = 0; i < 150; i++) {
      const x = ((d.dust[i * 3] + t * d.dust[i * 3 + 2] + 400) % 800) - 400;
      dot(v, x, d.dust[i * 3 + 1], 1.1, 0.1);
    }
    const pulses = NET_TOOLS.map((_, i) => {
      const e = (t + i * 0.65) % 2.6;
      return hitPulse(e * 60, 2, 12);
    });
    const hubPulse = Math.max(...NET_TOOLS.map((_, i) => hitPulse((((t + i * 0.65 + 1.3) % 2.6) * 60), 2, 10)));
    const R = 56 * (1 + 0.04 * hubPulse);
    for (const a0 of d.ring) {
      const a = a0 + t * 0.4;
      dot(v, Math.cos(a) * R, Math.sin(a) * R, 1.6, 0.8);
    }
    for (let i = 0; i < 140; i++) {
      const a = t * 0.25;
      const x = d.disc[i * 2];
      const y = d.disc[i * 2 + 1];
      dot(v, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), 1.3, 0.45 + hubPulse * 0.4);
    }
    NET_TOOLS.forEach(([tx, ty], i) => {
      const len = Math.hypot(tx, ty);
      const ux = tx / len;
      const uy = ty / len;
      const from: [number, number] = [ux * 64, uy * 64];
      const to: [number, number] = [tx - ux * 58, ty - uy * 58];
      for (let dir = 0; dir < 2; dir++) {
        const bend = dir ? 46 : -46;
        const cx = (from[0] + to[0]) / 2 - uy * bend;
        const cy = (from[1] + to[1]) / 2 + ux * bend;
        for (let j = 0; j < 64; j++) {
          const idx = ((i * 2 + dir) * 64 + j) * 2;
          const u = (d.stream[idx] + t * 0.2 + i * 0.13) % 1;
          const p = dir ? 1 - u : u;
          const q = 1 - p;
          const x = q * q * from[0] + 2 * q * p * cx + p * p * to[0] - uy * d.stream[idx + 1];
          const y = q * q * from[1] + 2 * q * p * cy + p * p * to[1] + ux * d.stream[idx + 1];
          dot(v, x, y, 1.4, 0.1 + 0.8 * Math.sin(Math.PI * u));
        }
      }
      const scale = 1 + 0.06 * pulses[i];
      for (let k = 0; k < 56; k++) dot(v, tx + d.frame[k * 2] * scale, ty + d.frame[k * 2 + 1] * scale, 1.5, 0.35 + 0.6 * pulses[i]);
      for (let k = 0; k < 9; k++) dot(v, tx - 16 + (k % 3) * 16, ty - 16 + Math.floor(k / 3) * 16, 2, 0.25 + 0.6 * pulses[i]);
    });
    NET_TOOLS.forEach(([tx, ty, name], i) => text(v, name, tx, ty + 56, { align: "center", alpha: 0.6 + 0.4 * pulses[i] }));
    text(v, "4 TOOLS · 0 MIGRATIONS", -390, -222);
  },
};

// ───────── 03 · Dissolve and reassemble ─────────
// An invoice made of dots. A scan line runs down it; each field's dots lift
// off and fly into their row on a dotted records table, where the value
// appears. Then everything flies home and the read begins again.
type DocData = { text: Float32Array; fields: Float32Array[]; border: Float32Array };
const DOC_CYCLE = 8;
const FIELD_ROWS = [2, 5, 8, 11];
const DOC_VALUES = ["Northwind Supply", "INV-0423", "$4,280.00", "Nov 14, 2026"];
const DOC_KEYS = ["VENDOR", "INVOICE NO.", "AMOUNT", "DUE"];
const docRowY = (r: number) => -156 + r * 24;
const docCellY = (i: number) => -96 + i * 64;

const docScene: Scene<DocData> = {
  seed: 37,
  still: 5.2,
  label: "An invoice made of dots dissolving into a records table",
  setup(rand) {
    const textDots: number[] = [];
    for (let r = 0; r < 14; r++) {
      if (FIELD_ROWS.includes(r)) continue;
      const len = 110 + rand() * 120;
      for (let x = 0; x < len; x += 5) textDots.push(-330 + x, docRowY(r));
    }
    // Each field: 72 dots, two rows on the page → a 24 × 3 block in its cell.
    const fields = FIELD_ROWS.map((r, i) => {
      const f = new Float32Array(72 * 4);
      for (let n = 0; n < 72; n++) {
        const j = n % 36;
        const b = Math.floor(n / 36);
        f[n * 4] = -330 + j * 5.5;
        f[n * 4 + 1] = docRowY(r) - 2 + b * 4;
        f[n * 4 + 2] = 170 + (n % 24) * 6.4;
        f[n * 4 + 3] = docCellY(i) - 4 + Math.floor(n / 24) * 5;
      }
      return f;
    });
    const border: number[] = [];
    for (let x = -345; x <= -75; x += 6) border.push(x, -178, x, 178);
    for (let y = -178; y <= 178; y += 6) border.push(-345, y, -75, y);
    for (let x = 60; x <= 330; x += 6) border.push(x, -130, x, 130);
    for (let x = 60; x <= 330; x += 12) for (const y of [-64, 0, 64]) border.push(x, y);
    for (let y = -130; y <= 130; y += 6) border.push(60, y, 330, y);
    return { text: new Float32Array(textDots), fields, border: new Float32Array(border) };
  },
  draw(v, t, d) {
    const c = ((t % DOC_CYCLE) + DOC_CYCLE) % DOC_CYCLE;
    v.ctx.fillStyle = CYAN;
    for (let i = 0; i < d.border.length; i += 2) dot(v, d.border[i], d.border[i + 1], 1.2, 0.3);
    for (let i = 0; i < d.text.length; i += 2) dot(v, d.text[i], d.text[i + 1], 1.5, 0.5);

    const ys = mix(-178, 178, prog(c, 0.5, 3.3));
    const scan = prog(c, 0.4, 0.6) * (1 - prog(c, 3.3, 3.6));
    for (let x = -345; x <= -75; x += 3) {
      dot(v, x, ys, 1.4, 0.95 * scan);
      dot(v, x, ys - 5, 1.1, 0.3 * scan);
    }

    d.fields.forEach((f, i) => {
      const tl = 0.5 + ((docRowY(FIELD_ROWS[i]) + 178) / 356) * 2.8;
      for (let n = 0; n < 72; n++) {
        const j = n % 36;
        const go = E.inOut(prog(c, tl + j * 0.012, tl + 1 + j * 0.012));
        const back = E.inOut(prog(c, 6 + j * 0.008, 7 + j * 0.008));
        const q = go * (1 - back);
        const x = mix(f[n * 4], f[n * 4 + 2], q);
        const y = mix(f[n * 4 + 1], f[n * 4 + 3], q) - Math.sin(Math.PI * q) * 50;
        const moving = q > 0.02 && q < 0.98;
        dot(v, x, y, 1.6, moving ? 1 : q >= 0.98 ? 0.9 : 0.65);
      }
      const seated = prog(c, tl + 1.45, tl + 1.7) * (1 - prog(c, 5.8, 6.1));
      text(v, DOC_KEYS[i], 72, docCellY(i), { alpha: 0.75 });
      text(v, DOC_VALUES[i], 170, docCellY(i) - 18, { color: CREAM, alpha: seated });
    });
    text(v, "invoice_0423.pdf", -345, -196);
    text(v, "RECORDS", 60, -148);
  },
};

// ───────── 04 · Sphere ─────────
// A turning sphere of dots (the agent). A cream request streams in and is
// absorbed, the sphere breathes, then streams run out to three record rows,
// which fill left to right and take a check; the count rolls on.
type SphereData = { pts: Float32Array; req: Float32Array; emit: Float32Array };
const SPH_CYCLE = 6;
const SPH_ROWS = [-96, 0, 96];
const SPH_NAMES = ["Acme · owner", "Acme · stage", "Acme · notes"];
const rowAt = (i: number) => 1.7 + i * 0.55;

const sphereScene: Scene<SphereData> = {
  seed: 41,
  still: 3.4,
  label: "An agent sphere takes a request and updates three records",
  setup(rand) {
    const n = 560;
    const pts = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = golden * i;
      pts[i * 3] = Math.cos(a) * r;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = Math.sin(a) * r;
    }
    const req = new Float32Array(44).map(() => (rand() - 0.5) * 6);
    const emit = new Float32Array(3 * 34).map(() => (rand() - 0.5) * 8);
    return { pts, req, emit };
  },
  draw(v, t, d) {
    const cycle = Math.floor(t / SPH_CYCLE);
    const c = t - cycle * SPH_CYCLE;
    const absorb = c >= 1.15 ? hitPulse((c - 1.15) * 60, 2, 10) : 0;
    const theta = t * 0.35 + cycle * 1.2 + E.inOut(prog(c, 1.1, 2.6)) * 1.2;
    const tilt = 0.32;
    const R = 120 * (1 + 0.05 * absorb);
    const cx = -170;
    v.ctx.fillStyle = CYAN;
    for (let i = 0; i < d.pts.length; i += 3) {
      const x = d.pts[i];
      const y = d.pts[i + 1];
      const z = d.pts[i + 2];
      const x1 = x * Math.cos(theta) + z * Math.sin(theta);
      const z1 = -x * Math.sin(theta) + z * Math.cos(theta);
      const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
      const depth = (z2 + 1) / 2;
      dot(v, cx + x1 * R, y2 * R, 1.1 + depth * 0.7, 0.12 + depth * 0.62 + absorb * 0.25);
    }

    const reset = prog(c, 5.2, 5.8);
    const done = SPH_ROWS.filter((_, i) => c >= rowAt(i) + 0.7 && c < 5.2).length;
    SPH_ROWS.forEach((ry, i) => {
      const tu = rowAt(i);
      for (let j = 0; j < 34; j++) {
        const p = E.inOut(prog(c, tu - 0.55 + j * 0.01, tu + 0.05 + j * 0.01));
        if (p <= 0 || p >= 1) continue;
        const x = mix(cx + R * 0.92, 54, p);
        const y = mix(ry * 0.35, ry, p) + d.emit[i * 34 + j] * Math.sin(Math.PI * p);
        dot(v, x, y, 1.5, Math.sin(Math.PI * p));
      }
      const fill = prog(c, tu, tu + 0.7) * (1 - reset);
      for (let k = 0; k < 42; k++)
        for (let b = 0; b < 2; b++) dot(v, 60 + k * 6, ry - 4 + b * 8, 1.6, k / 42 < fill ? 0.95 : 0.2);
      const tick = prog(c, tu + 0.7, tu + 0.9) * (1 - reset);
      for (let k = 0; k <= 8; k++) {
        const p = k / 8;
        const x = p < 0.35 ? mix(326, 334, p / 0.35) : mix(334, 350, (p - 0.35) / 0.65);
        const y = p < 0.35 ? mix(ry, ry + 7, p / 0.35) : mix(ry + 7, ry - 9, (p - 0.35) / 0.65);
        dot(v, x, y, 1.8, tick);
      }
      text(v, SPH_NAMES[i], 60, ry - 20, { alpha: 0.7 });
    });

    v.ctx.fillStyle = CREAM;
    for (let j = 0; j < 44; j++) {
      const p = E.inOut(prog(c, 0.2 + j * 0.012, 1.0 + j * 0.012));
      const a = prog(c, 0.2 + j * 0.012, 0.35 + j * 0.012) * (1 - prog(p, 0.85, 1));
      dot(v, mix(-420, cx, p) + d.req[j], mix(-190, 0, p) + d.req[j] * 0.6, 1.7, a);
    }
    text(v, "“Update the Acme record”", -420, -212, { color: CREAM, alpha: prog(c, 0.1, 0.3) * (1 - prog(c, 0.9, 1.2)) });
    text(v, `UPDATED ${35 + cycle * 3 + done}`, 60, -150, { color: CREAM });
  },
};

export const FlowParticles = ({ paused }: SceneProps) => <ParticleCanvas scene={flowScene} paused={paused} />;
export const NetworkParticles = ({ paused }: SceneProps) => <ParticleCanvas scene={netScene} paused={paused} />;
export const DocumentParticles = ({ paused }: SceneProps) => <ParticleCanvas scene={docScene} paused={paused} />;
export const SphereParticles = ({ paused }: SceneProps) => <ParticleCanvas scene={sphereScene} paused={paused} />;

export const PARTICLES = [FlowParticles, NetworkParticles, DocumentParticles, SphereParticles];
