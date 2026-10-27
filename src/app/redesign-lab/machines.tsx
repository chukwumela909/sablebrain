"use client";

// "Machines": the four services as stations on one isometric plant, drawn in
// cyan hairlines on the night background. A single line runs through all of
// them and the cyan square is the unit of work travelling it: it leaves the
// inbox, is checked at the gate (exceptions turn cream and go to review),
// syncs out to the tools at the hub, is read into records at the scanner,
// and is taken in by the agent core, which updates the systems. The camera
// frames one station at a time; on desktop it travels the line as the page
// scrolls. Everything is a function of one clock (cinetic easing throughout).

import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { E, clamp01, hitPulse, mix, prog } from "./motion";
import ill from "./illustrations.module.css";

type V2 = [number, number];
type V3 = [number, number, number];

// Isometric projection: +x runs right and down, +y left and down, z up.
const C = Math.cos(Math.PI / 6);
const P = (x: number, y: number, z = 0): V2 => [(x - y) * C, (x + y) * 0.5 - z];
const pts = (vs: V3[]) =>
  vs
    .map(([x, y, z]) => {
      const [a, b] = P(x, y, z);
      return `${a.toFixed(1)},${b.toFixed(1)}`;
    })
    .join(" ");
const lit = (amount: number, rest = "#10233b") =>
  ({ fill: `color-mix(in oklab, var(--cyan) ${Math.round(Math.min(1, amount) * 100)}%, ${rest})` }) as CSSProperties;
const CREAM = { fill: "var(--cream)" };

function Line({ a, b, className, style }: { a: V3; b: V3; className?: string; style?: CSSProperties }) {
  const [x1, y1] = P(...a);
  const [x2, y2] = P(...b);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={className ?? ill.wire} style={style} />;
}

type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  tone?: "cyan" | "cream" | "paper";
  topStyle?: CSSProperties;
  opacity?: number;
  children?: ReactNode;
};

// A box from (x, y, z) spanning w × d × h; draws the two faces that face the
// viewer and the top, then anything placed on top of it.
function Box({ x, y, z = 0, w, d, h, tone, topStyle, opacity, children }: BoxProps) {
  const top: V3[] = [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  const left: V3[] = [
    [x, y + d, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  const right: V3[] = [
    [x + w, y, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x + w, y, z + h],
  ];
  return (
    <g className={tone ? ill[tone] : undefined} opacity={opacity}>
      {h > 0 && <polygon points={pts(left)} className={ill.sideL} />}
      {h > 0 && <polygon points={pts(right)} className={ill.sideR} />}
      <polygon points={pts(top)} className={ill.top} style={topStyle} />
      {children}
    </g>
  );
}

type LabelProps = { at: V3; children: ReactNode; tone?: CSSProperties; anchor?: "start" | "middle" | "end"; dx?: number; dy?: number };

function Label({ at, children, tone, anchor = "middle", dx = 0, dy = 0 }: LabelProps) {
  const [x, y] = P(...at);
  return (
    <text x={x + dx} y={y + dy} className={ill.label} textAnchor={anchor} style={tone}>
      {children}
    </text>
  );
}

// Text painted on the floor, running along +x from (x, y).
function FloorText({ x, y, children, style }: { x: number; y: number; children: ReactNode; style?: CSSProperties }) {
  const [ox, oy] = P(x, y);
  return (
    <text transform={`matrix(${C} 0.5 ${-C} 0.5 ${ox} ${oy})`} y={13} className={ill.floorText} style={style}>
      {children}
    </text>
  );
}

// The dotted floor grid under the whole plant. It never changes, so it's
// drawn once.
const FloorGrid = memo(function FloorGrid() {
  const lines: ReactNode[] = [];
  for (let y = -280; y <= 840; y += 40) lines.push(<Line key={`x${y}`} a={[-400, y, 0]} b={[1480, y, 0]} className={ill.grid} />);
  for (let x = -400; x <= 1480; x += 40) lines.push(<Line key={`y${x}`} a={[x, -280, 0]} b={[x, 840, 0]} className={ill.grid} />);
  return <g>{lines}</g>;
});

// ───────── The line ─────────
// One belt from the inbox to the core, turning at the hub and the reader.
// Items leave the inbox every PERIOD seconds and move at V; every fourth is
// an exception, pulled at the gate. Item k's position is a pure function of
// the clock, so the whole plant is too.
const V = 110; // belt speed, units per second
const PERIOD = 1.5; // seconds between items leaving the inbox
const PREROLL = 90; // the line is already full when first seen
const STILL = 3.1; // the frame held under reduced motion
const LINE: V2[] = [
  [-200, 0],
  [560, 0],
  [560, 560],
  [1030, 560],
];
const LEGS = LINE.slice(1).map(([x, y], i) => Math.hypot(x - LINE[i][0], y - LINE[i][1]));
const HUB: V2 = [560, 0];
const TURN: V2 = [560, 560];
const CORE: V2 = [1120, 560];
const GATE_X = -40;
const CHUTE_X = -6;
const SCAN_Y = 330;
const S_GATE = GATE_X - LINE[0][0];
const S_HUB = LEGS[0];
const S_SCAN = LEGS[0] + SCAN_Y;
const S_END = LEGS[0] + LEGS[1] + LEGS[2];
const T_HOLD = 0.35;
const T_SIDE = 0.3;
const T_CHUTE = 1.2;
const T_LIFT = 0.6;

function along(d: number): V2 {
  let rest = d;
  for (let i = 0; i < LEGS.length; i++) {
    if (rest <= LEGS[i] || i === LEGS.length - 1) {
      const p = Math.min(rest / LEGS[i], 1);
      return [mix(LINE[i][0], LINE[i + 1][0], p), mix(LINE[i][1], LINE[i + 1][1], p)];
    }
    rest -= LEGS[i];
  }
  return LINE[LINE.length - 1];
}

type Item = { k: number; x: number; y: number; z: number; alpha: number; flag: number; size: number; depth: number };

function itemAt(k: number, T: number): Item | null {
  const age = T - k * PERIOD;
  if (age < 0) return null;
  const fadeIn = prog(age, 0, 0.3);
  const d = age * V;
  const at = (x: number, y: number, z = 8, flag = 0, alpha = fadeIn, size = 1, depth = x + y): Item => ({ k, x, y, z, alpha, flag, size, depth });
  if (k % 4 === 3 && d >= S_GATE) {
    // An exception: held at the gate while it turns cream, then pushed on
    // and down the chute to review.
    const held = age - S_GATE / V;
    if (held < T_HOLD) return at(GATE_X, 0, 8, prog(held, 0, 0.2, E.out));
    if (held < T_HOLD + T_SIDE) return at(mix(GATE_X, CHUTE_X, E.smooth(prog(held, T_HOLD, T_HOLD + T_SIDE))), 0, 8, 1);
    const p = (held - T_HOLD - T_SIDE) / T_CHUTE;
    if (p >= 1) return null;
    const y = mix(0, 160, E.smooth(p));
    return at(CHUTE_X, y, y < 18 ? 8 : 6, 1, 1 - prog(p, 0.85, 1));
  }
  if (d < S_END) {
    const [x, y] = along(d);
    return at(x, y);
  }
  // Off the end of the belt: lifted into the core, shrinking as it's taken in.
  const p = (age - S_END / V) / T_LIFT;
  if (p >= 1) return null;
  const e = E.inOut(p);
  return at(mix(LINE[3][0], CORE[0], e), CORE[1], mix(8, 82, e) + Math.sin(Math.PI * p) * 30, 0, 1, 1 - E.contact(p), CORE[0] + CORE[1] + 1);
}

function ItemBox({ it }: { it: Item }) {
  const w = 22 * it.size;
  const d = 26 * it.size;
  return <Box x={it.x - w / 2} y={it.y - d / 2} z={it.z} w={w} d={d} h={3} tone={it.flag > 0.5 ? "cream" : "cyan"} opacity={it.alpha} />;
}

// Good items (not exceptions) are counted g = 0, 1, 2…; the stations deal
// them round their tools, rows and records.
const kOf = (g: number) => g + Math.floor(g / 3);
const goodThrough = (m: number) => (m < 0 ? 0 : m + 1 - Math.floor((m + 1) / 4));
const flaggedThrough = (m: number) => (m < 0 ? 0 : Math.floor((m + 1) / 4));
// The latest good item whose moment `at` seconds after leaving the inbox has
// come by T (−1 if none has).
const lastGood = (T: number, at: number) => goodThrough(Math.floor((T - at) / PERIOD)) - 1;
// The latest good item up to g that is dealt to `slot` of `of`.
const dealt = (g: number, slot: number, of: number) => g - ((((g - slot) % of) + of) % of);
// Seconds since good item g's moment `at` (Infinity when there is no such item).
const since = (T: number, g: number, at: number) => (g < 0 ? Infinity : T - (kOf(g) * PERIOD + at));

// Each station adds to three layers: flat things on the floor, standing
// things (painted back to front by depth, x + y) and labels on top.
type Layers = { floor: ReactNode[]; stand: [number, ReactNode][]; over: ReactNode[] };

function Belts({ T }: { T: number }) {
  const off = (T * V) % 20;
  const across = (from: number, to: number, line: (v: number) => [V3, V3], key: string) => {
    const out: ReactNode[] = [];
    for (let v = from + off, j = 0; v < to; v += 20, j++) {
      const [a, b] = line(v);
      out.push(<Line key={`${key}${j}`} a={a} b={b} className={ill.stripe} />);
    }
    return out;
  };
  const [tx, ty] = P(TURN[0], TURN[1], 8);
  return (
    <>
      <Box x={-200} y={-18} w={716} d={36} h={8}>
        {across(-200, 516, (x) => [[x, -18, 8], [x, 18, 8]], "a")}
      </Box>
      <Box x={542} y={44} w={36} d={494} h={8}>
        {across(44, 538, (y) => [[542, y, 8], [578, y, 8]], "b")}
      </Box>
      <Box x={538} y={538} w={44} d={44} h={8}>
        <ellipse cx={tx} cy={ty} rx={Math.SQRT2 * 15 * C} ry={Math.SQRT2 * 15 * 0.5} className={ill.wireSoft} fill="none" />
      </Box>
      <Box x={582} y={542} w={474} d={36} h={8}>
        {across(582, 1056, (x) => [[x, 542, 8], [x, 578, 8]], "c")}
      </Box>
    </>
  );
}

// ───────── 01 · Workflows: the gate ─────────
// Items cross the CRM check gate; its scanner flashes as each one passes.
// Every fourth is flagged there, turns cream and goes down the chute to the
// review tray. The rest carry on down the line.
function routing(T: number, items: Item[], L: Layers) {
  const onBelt = items.filter((i) => i.y === 0 && i.z === 8);
  const scan = Math.max(0, ...onBelt.map((i) => 1 - Math.abs(i.x - GATE_X) / 16));
  const flagAtGate = onBelt.some((i) => i.flag > 0 && i.x === GATE_X);
  const routed = 1240 + goodThrough(Math.floor((T - (S_GATE + 12) / V) / PERIOD));
  const review = flaggedThrough(Math.floor((T - S_GATE / V - T_HOLD - T_SIDE - T_CHUTE) / PERIOD));

  L.floor.push(
    <Box key="r-chute" x={-24} y={18} w={36} d={124} h={6} />,
    <Box key="r-tray" x={-44} y={142} w={76} d={50} h={4}>
      {[0, 1, 2].map((j) => (
        <Box key={j} x={-21 + j * 4} y={152 + j * 3} z={4 + j * 2} w={22} d={26} h={2} tone="cream" opacity={0.55} />
      ))}
    </Box>,
  );
  L.stand.push(
    [-235, <Box key="r-inbox" x={-266} y={-46} w={62} d={92} h={44} />],
    [-69, <Box key="r-gb" x={-46} y={-34} w={12} d={10} h={58} />],
    [-11, <Box key="r-gf" x={-46} y={24} w={12} d={10} h={58} />],
    [
      -10.9,
      <g key="r-gate">
        <polygon
          points={pts([
            [GATE_X, -24, 8],
            [GATE_X, 24, 8],
            [GATE_X, 24, 58],
            [GATE_X, -24, 58],
          ])}
          className={flagAtGate ? ill.scanCream : ill.scan}
          style={{ opacity: 0.08 + scan * 0.55 }}
        />
        <Box x={-46} y={-34} z={58} w={12} d={68} h={10} topStyle={lit(scan * 0.8)} />
      </g>,
    ],
  );
  L.over.push(
    <Label key="r-l0" at={[-235, 0, 66]}>
      INBOX
    </Label>,
    <Label key="r-l1" at={[GATE_X, 0, 96]}>
      CRM CHECK
    </Label>,
    <Label key="r-l2" at={[GATE_X, 0, 96]} dy={15} tone={CREAM}>
      ROUTED {routed.toLocaleString("en-US")}
    </Label>,
    <Label key="r-l3" at={[CHUTE_X, 167, 0]} dy={58}>
      REVIEW
    </Label>,
    <Label key="r-l4" at={[CHUTE_X, 167, 0]} dy={73} tone={CREAM}>
      {review} FLAGGED
    </Label>,
  );
}

// ───────── 02 · Integrations: the hub ─────────
// Each item that reaches the hub syncs out to one tool in turn: a packet
// runs down its cable, the tool lights and updates (the dashboard's bars
// change), and the packet comes back to the hub.
const TOOLS = [
  { name: "HUBSPOT", at: [0, -170], kind: "crm" },
  { name: "SHEETS", at: [170, 0], kind: "sheet" },
  { name: "DASHBOARD", at: [125, 125], kind: "dash" },
  { name: "EMAIL", at: [-125, -125], kind: "inbox" },
] as const;
const BARS = [
  [10, 22, 14],
  [18, 10, 24],
  [24, 16, 8],
  [12, 24, 18],
];

function ToolTop({ kind, x0, y0, z, T, grow, n }: { kind: string; x0: number; y0: number; z: number; T: number; grow: number; n: number }) {
  if (kind === "crm")
    return (
      <>
        {[0, 1, 2].map((j) => (
          <Line key={j} a={[x0 + 26, y0 + 18 + j * 17, z]} b={[x0 + 58, y0 + 18 + j * 17, z]} className={ill.wireSoft} />
        ))}
        {[0, 1, 2].map((j) => (
          <Box key={`a${j}`} x={x0 + 12} y={y0 + 14 + j * 17} z={z} w={8} d={8} h={2} tone="cyan" opacity={0.6} />
        ))}
      </>
    );
  if (kind === "inbox")
    return (
      <>
        <polygon
          points={pts([
            [x0 + 12, y0 + 14, z],
            [x0 + 58, y0 + 14, z],
            [x0 + 58, y0 + 56, z],
            [x0 + 12, y0 + 56, z],
          ])}
          className={ill.wireSoft}
          fill="none"
        />
        <polyline
          points={pts([
            [x0 + 12, y0 + 14, z],
            [x0 + 35, y0 + 38, z],
            [x0 + 58, y0 + 14, z],
          ])}
          className={ill.wireSoft}
          fill="none"
        />
      </>
    );
  if (kind === "sheet")
    return (
      <>
        {[14, 28, 42, 56].map((v) => (
          <Line key={`r${v}`} a={[x0 + 12, y0 + v, z]} b={[x0 + 58, y0 + v, z]} className={ill.wireSoft} />
        ))}
        {[12, 27, 42, 58].map((v) => (
          <Line key={`c${v}`} a={[x0 + v, y0 + 14, z]} b={[x0 + v, y0 + 56, z]} className={ill.wireSoft} />
        ))}
      </>
    );
  // Dashboard bars ease from the last sync's heights to this one's.
  const mod = (v: number) => ((v % 4) + 4) % 4;
  return (
    <>
      {[0, 1, 2].map((j) => {
        const h = mix(BARS[mod(n - 1)][j], BARS[mod(n)][j], grow) + Math.sin(T * 1.3 + j) * 0.6;
        return <Box key={j} x={x0 + 14 + j * 16} y={y0 + 29} z={z} w={10} d={12} h={h} tone="cyan" opacity={0.75} />;
      })}
    </>
  );
}

function sync(T: number, L: Layers) {
  const at = S_HUB / V;
  const latest = lastGood(T, at);
  const took = hitPulse(since(T, latest, at) * 60, 2, 10);
  let back = 0;

  TOOLS.forEach((tool, i) => {
    const g = dealt(latest, i, TOOLS.length);
    const ph = since(T, g, at);
    const [ax, ay] = tool.at;
    const reach = Math.max(Math.abs(ax), Math.abs(ay));
    const cx = HUB[0] + ax;
    const cy = HUB[1] + ay;
    const from: V2 = [HUB[0] + (ax * 44) / reach, HUB[1] + (ay * 44) / reach];
    const to: V2 = [HUB[0] + (ax * (reach - 35)) / reach, HUB[1] + (ay * (reach - 35)) / reach];
    let packet: V2 | null = null;
    if (ph < 0.7) {
      const p = E.inOut(ph / 0.7);
      packet = [mix(from[0], to[0], p), mix(from[1], to[1], p)];
    } else if (ph >= 0.9 && ph < 1.6) {
      const p = E.inOut((ph - 0.9) / 0.7);
      packet = [mix(to[0], from[0], p), mix(to[1], from[1], p)];
    }
    const glow = ph >= 0.7 ? 1 - prog(ph, 0.75, 1.6, E.smooth) : 0;
    if (ph >= 1.6) back = Math.max(back, 1 - prog(ph, 1.65, 2.2, E.smooth));

    const len = Math.hypot(ax, ay);
    const ox = (-ay / len) * 4;
    const oy = (ax / len) * 4;
    L.floor.push(
      <g key={`s-c${i}`}>
        <Line a={[from[0] + ox, from[1] + oy, 1]} b={[to[0] + ox, to[1] + oy, 1]} className={ill.cable} />
        <Line a={[from[0] - ox, from[1] - oy, 1]} b={[to[0] - ox, to[1] - oy, 1]} className={ill.cable} />
      </g>,
    );
    if (packet) L.stand.push([packet[0] + packet[1], <Box key={`s-p${i}`} x={packet[0] - 5} y={packet[1] - 5} z={1} w={10} d={10} h={5} tone="cyan" />]);
    const x0 = cx - 35;
    const y0 = cy - 35;
    L.stand.push([
      cx + cy,
      <Box key={`s-t${i}`} x={x0} y={y0} w={70} d={70} h={26} topStyle={glow > 0 ? lit(glow * 0.55) : undefined}>
        <ToolTop kind={tool.kind} x0={x0} y0={y0} z={26} T={T} grow={prog(ph, 0.7, 1.2, E.out)} n={Math.floor(g / 4)} />
      </Box>,
    ]);
    L.over.push(
      // The tool in front of the hub is named below its box, clear of the hub.
      <Label key={`s-l${i}`} at={tool.kind === "dash" ? [cx + 35, cy + 35, 0] : [cx, cy, 62]} dy={tool.kind === "dash" ? 24 : 0} tone={glow > 0 ? { fill: `color-mix(in oklab, var(--cyan) ${Math.round(glow * 100)}%, var(--mute-dark))` } : undefined}>
        {tool.name}
      </Label>,
    );
  });

  // Drawn after anything inside its footprint, so items pass through it.
  L.stand.push([
    HUB[0] + HUB[1] + 45,
    <g key="s-hub">
      <Box x={HUB[0] - 44} y={HUB[1] - 44} w={88} d={88} h={36} topStyle={lit(Math.max(took, back) * 0.35)} />
      <Box x={HUB[0] - 9} y={HUB[1] - 9} z={36} w={18} d={18} h={8} tone="cyan" topStyle={lit(0.6 + back * 0.4, "#0b6f80")} />
    </g>,
  ]);
}

// ───────── 03 · Documents: the reader ─────────
// A plane of light reads each item as it passes under the gantry; its data
// lifts off as a chip and flies into the next row of the records table,
// shape settling before it lands. The row's value changes as it seats.
const TABLE = { x: 330, y: 452, w: 140, d: 216 };
const SLOT = { x0: 348, x1: 452 };
const tableRow = (i: number) => 482 + i * 52;
const VALUES = ["NORTHWIND · $4,280", "HALCYON · $1,920", "ACME CO · $760", "BRIGHTLINE · $12,400", "CORVID · $3,115", "MERIDIAN · $2,050", "OAKFIELD · $640"];

function extract(T: number, items: Item[], L: Layers) {
  const at = S_SCAN / V;
  const latest = lastGood(T, at);
  const onLeg = items.filter((i) => i.x === TURN[0] && i.z === 8);
  const scan = Math.max(0, ...onLeg.map((i) => 1 - Math.abs(i.y - SCAN_Y) / 16));

  L.floor.push(<Box key="e-table" x={TABLE.x} y={TABLE.y} w={TABLE.w} d={TABLE.d} h={8} />);
  for (let i = 0; i < 4; i++) {
    const g = dealt(latest, i, 4);
    const ph = since(T, g, at);
    const y = tableRow(i);
    const seated = ph >= 1;
    const shown = seated ? g : g - 4;
    L.floor.push(
      <polygon
        key={`e-s${i}`}
        points={pts([
          [SLOT.x0, y - 10, 8],
          [SLOT.x1, y - 10, 8],
          [SLOT.x1, y + 10, 8],
          [SLOT.x0, y + 10, 8],
        ])}
        className={ill.slot}
      />,
    );
    if (shown >= 0) {
      const glow = seated ? 1 - prog(ph, 1, 1.8, E.smooth) : 0;
      L.floor.push(
        <Box key={`e-r${i}`} x={SLOT.x0} y={y - 7} z={8} w={SLOT.x1 - SLOT.x0} d={14} h={3} tone="cyan" opacity={0.5 + glow * 0.5} topStyle={lit(0.35 + glow * 0.65, "#123f52")} />,
      );
      L.over.push(
        <Label key={`e-v${i}`} at={[SLOT.x1, y, 11]} anchor="start" dx={12} dy={4} tone={{ fill: "var(--cream)", opacity: seated ? prog(ph, 1, 1.25) : 1 }}>
          {VALUES[shown % VALUES.length]}
        </Label>,
      );
    }
    if (!seated && ph >= 0) {
      // The chip rides up off the item, then flies to its row.
      let cx = TURN[0];
      let cy = SCAN_Y + Math.min(ph, 0.3) * V;
      let z = mix(11, 34, prog(ph, 0, 0.3, E.out));
      let w = 22;
      const fly = prog(ph, 0.3, 1, E.inOut);
      if (fly > 0) {
        cx = mix(cx, (SLOT.x0 + SLOT.x1) / 2, fly);
        cy = mix(cy, y, fly);
        z = mix(34, 8, fly) + Math.sin(Math.PI * fly) * 26;
        w = mix(22, SLOT.x1 - SLOT.x0, prog(ph, 0.3, 0.9, E.inOut));
      }
      L.over.push(<Box key={`e-c${i}`} x={cx - w / 2} y={cy - 7} z={z} w={w} d={14} h={3} tone="cyan" topStyle={lit(1, "#123f52")} />);
    }
  }
  L.stand.push(
    [533 + SCAN_Y, <Box key="e-pb" x={528} y={SCAN_Y - 6} w={10} d={12} h={58} />],
    [587 + SCAN_Y, <Box key="e-pf" x={582} y={SCAN_Y - 6} w={10} d={12} h={58} />],
    [
      587.1 + SCAN_Y,
      <g key="e-gate">
        <polygon
          points={pts([
            [542, SCAN_Y, 8],
            [578, SCAN_Y, 8],
            [578, SCAN_Y, 58],
            [542, SCAN_Y, 58],
          ])}
          className={ill.scan}
          style={{ opacity: 0.08 + scan * 0.55 }}
        />
        <Box x={528} y={SCAN_Y - 6} z={58} w={64} d={12} h={10} topStyle={lit(scan * 0.8)} />
      </g>,
    ],
  );
  L.over.push(
    <Label key="e-l0" at={[TURN[0], SCAN_Y, 96]}>
      READER
    </Label>,
    <Label key="e-l1" at={[TABLE.x + TABLE.w / 2, TABLE.y, 30]}>
      RECORDS
    </Label>,
  );
}

// ───────── 04 · Agents: the core ─────────
// A wire-frame core turns on its pedestal. Each item is taken in (a ring
// runs out across the floor, the core spins on), then a beam reaches one of
// the systems it keeps current; that record lights, takes a fresh check,
// and the count rolls on.
const RECORDS = ["LEDGER", "CRM", "REPLY"];
const REC_X = CORE[0] + 150;
const recY = (i: number) => CORE[1] - 120 + i * 76;

function cubeEdges(half: number, theta: number, [cx, cy, cz]: V3) {
  const v: V3[] = [];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const x = sx * half;
        const y = sy * half;
        v.push([cx + x * Math.cos(theta) - y * Math.sin(theta), cy + x * Math.sin(theta) + y * Math.cos(theta), cz + sz * half]);
      }
  const edges: [V3, V3][] = [];
  for (let a = 0; a < 8; a++)
    for (let b = a + 1; b < 8; b++) {
      const diff = (a ^ b).toString(2).replace(/0/g, "").length;
      if (diff === 1) edges.push([v[a], v[b]]);
    }
  return edges;
}

function act(T: number, L: Layers) {
  const at = S_END / V + T_LIFT;
  const latest = lastGood(T, at);
  const ph = since(T, latest, at);
  const absorb = hitPulse(ph * 60, 2, 10);
  const theta = T * 0.45 + Math.max(latest, 0) * 0.9 + 0.9 * E.inOut(prog(ph, 0, 0.9));
  const centre: V3 = [CORE[0], CORE[1], 82];
  const [ox, oy] = P(CORE[0], CORE[1]);
  const ring = prog(ph, 0.05, 1.5, E.out);
  const updated = 300 + latest + (ph >= 0.4 ? 1 : 0);

  if (ring > 0 && ring < 1) {
    const r = mix(70, 240, ring);
    L.floor.push(<ellipse key="a-ring" cx={ox} cy={oy} rx={Math.SQRT2 * r * C} ry={Math.SQRT2 * r * 0.5} className={ill.ring} style={{ opacity: (1 - ring) * 0.6 }} />);
  }
  L.stand.push([
    CORE[0] + CORE[1],
    <g key="a-core">
      <Box x={CORE[0] - 64} y={CORE[1] - 64} w={128} d={128} h={16} topStyle={lit(absorb * 0.4)} />
      {cubeEdges(18, -theta * 1.5, centre).map(([a, b], k) => (
        <Line key={`i${k}`} a={a} b={b} className={ill.wireDash} />
      ))}
      {cubeEdges(40, theta, centre).map(([a, b], k) => (
        <Line key={`o${k}`} a={a} b={b} className={ill.wireBright} style={{ opacity: 0.7 + absorb * 0.3 }} />
      ))}
    </g>,
  ]);

  RECORDS.forEach((name, i) => {
    const g = dealt(latest, i, RECORDS.length);
    const phi = since(T, g, at);
    const y = recY(i);
    const done = phi >= 0.4;
    const glow = done ? 1 - prog(phi, 0.45, 1.3, E.smooth) : 0;
    L.stand.push([
      REC_X + 58 + y + 24,
      <Box key={`a-r${i}`} x={REC_X} y={y} w={116} d={48} h={8} topStyle={glow > 0 ? lit(glow * 0.6) : undefined}>
        <Line a={[REC_X + 14, y + 16, 8]} b={[REC_X + 70, y + 16, 8]} className={ill.wireSoft} />
        <Line a={[REC_X + 14, y + 31, 8]} b={[REC_X + 86, y + 31, 8]} className={glow > 0.05 ? ill.wireBright : ill.wireSoft} />
      </Box>,
    ]);
    // The tick is redrawn on each update and held until the next.
    if (g >= 0 && (done || g >= RECORDS.length)) {
      const [cx, cy] = P(REC_X + 100, y + 24, 8);
      L.over.push(
        <path
          key={`a-k${i}`}
          d={`M${cx - 6} ${cy} l4 4 l8 -9`}
          className={ill.check}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={done ? 1 - prog(phi, 0.4, 0.65, E.out) : 0}
        />,
      );
    }
    const reach = prog(phi, 0.08, 0.4, E.out);
    const fade = 1 - prog(phi, 0.6, 1);
    if (reach > 0 && fade > 0) {
      const end: V3 = [mix(CORE[0], REC_X + 58, reach), mix(CORE[1], y + 24, reach), mix(82, 8, reach)];
      L.over.push(<Line key={`a-b${i}`} a={centre} b={end} className={ill.beam} style={{ opacity: fade }} />);
    }
    L.over.push(
      <Label key={`a-l${i}`} at={[REC_X, y + 24, 8]} anchor="end" dx={-12} dy={4}>
        {name}
      </Label>,
    );
  });
  L.over.push(
    <Label key="a-l3" at={[CORE[0], CORE[1], 176]}>
      AGENT
    </Label>,
    <Label key="a-l4" at={[REC_X + 58, recY(0) - 30, 52]} tone={CREAM}>
      UPDATED {updated}
    </Label>,
  );
}

// ───────── The plant ─────────
// Where the camera rests for each station (and how close: the hub, with its
// four tools, needs a wider shot), and the station's floor marking.
const STATIONS: { focus: V2; zoom: number; mark: V2; name: string }[] = [
  { focus: [-80, 50], zoom: 1, mark: [-200, 28], name: "01 · WORKFLOWS" },
  { focus: [570, -20], zoom: 0.88, mark: [338, 28], name: "02 · INTEGRATIONS" },
  { focus: [445, 485], zoom: 1, mark: [336, 680], name: "03 · DOCUMENTS" },
  { focus: [1170, 520], zoom: 1, mark: [872, 588], name: "04 · AGENTS" },
];

// The scroll position (in stations, 0…4) to a camera position (0…3): it
// holds on each station through the middle of its stretch and glides to the
// next across the boundary.
const shotToCam = (s: number) => {
  const k = Math.min(Math.max(s - 0.5, 0), STATIONS.length - 1);
  const n = Math.min(Math.floor(k), STATIONS.length - 2);
  return n + E.smooth(clamp01((k - n - 0.3) / 0.4));
};

// The plant's clock: seconds that run while it is on screen, and a camera
// that eases toward its shot (the scroll position when `shot` is given,
// else the fixed station `focus`). Under reduced motion it holds one frame.
function usePlantClock(shot: RefObject<number> | undefined, focus: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ sec: STILL, cam: focus });
  const last = useRef(view);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let prev = 0;
    const frame = (now: number) => {
      const goal = shot ? shotToCam(shot.current) : focus;
      const dt = prev ? Math.min((now - prev) / 1000, 0.1) : 0;
      const { sec, cam } = last.current;
      // Snaps to the shot on the first frame of a visit, then follows it.
      last.current = { sec: sec + dt, cam: prev ? cam + (goal - cam) * (1 - Math.exp(-dt / 0.15)) : goal };
      prev = now;
      setView(last.current);
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        prev = 0;
        if (entry.isIntersecting) raf = requestAnimationFrame(frame);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [shot, focus]);

  return [ref, view.sec, view.cam] as const;
}

type PlantProps = { shot?: RefObject<number>; focus?: number };

export function Plant({ shot, focus = 0 }: PlantProps) {
  const [ref, sec, cam] = usePlantClock(shot, focus);
  const T = sec + PREROLL;

  // The camera: between two stations it pulls back a little mid-glide.
  const n = Math.min(Math.floor(cam), STATIONS.length - 2);
  const fr = cam - n;
  const [ax, ay] = P(...STATIONS[n].focus);
  const [bx, by] = P(...STATIONS[n + 1].focus);
  const fx = mix(ax, bx, fr);
  const fy = mix(ay, by, fr);
  const zoom = mix(STATIONS[n].zoom, STATIONS[n + 1].zoom, fr) * (1 - 0.1 * Math.sin(Math.PI * fr));

  const items: Item[] = [];
  for (let k = Math.max(0, Math.floor((T - S_END / V - T_LIFT) / PERIOD)); k <= Math.floor(T / PERIOD); k++) {
    const it = itemAt(k, T);
    if (it) items.push(it);
  }
  const L: Layers = { floor: [], stand: [], over: [] };
  const near = (i: number) => Math.abs(cam - i) < 1.35;
  if (near(0)) routing(T, items, L);
  if (near(1)) sync(T, L);
  if (near(2)) extract(T, items, L);
  if (near(3)) act(T, L);
  for (const it of items) L.stand.push([it.depth, <ItemBox key={`i${it.k}`} it={it} />]);
  L.stand.sort((a, b) => a[0] - b[0]);

  return (
    <div ref={ref} className={`${ill.scene} ${ill.plant}`}>
      <svg viewBox="-320 -200 640 400" className={ill.svg} role="img" aria-label="One production line: work is routed, synced to your tools, read into records and acted on by an agent">
        <g transform={`translate(${(-fx * zoom).toFixed(2)} ${(-fy * zoom).toFixed(2)}) scale(${zoom.toFixed(4)})`}>
          <FloorGrid />
          {STATIONS.map((s, i) => (
            <FloorText key={s.name} x={s.mark[0]} y={s.mark[1]} style={{ opacity: 0.22 + 0.6 * clamp01(1 - Math.abs(cam - i)) }}>
              {s.name}
            </FloorText>
          ))}
          <Belts T={T} />
          {L.floor}
          {L.stand.map(([, node]) => node)}
          {L.over}
        </g>
      </svg>
    </div>
  );
}
