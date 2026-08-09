import type * as T from "three";
import type { Rig } from "./bot-stage";

export type MotionSettings = {
  /** Vertical breathing, in model units. */
  breathe: number;
  /** Slow yaw sway, in radians. */
  sway: number;
  /** Summed-sine wander layered on top of the sway, in radians. */
  drift: number;
  /** How far the bot turns toward the cursor, in radians. */
  pointer: number;
  /** How far the head turns toward the cursor, on top of the body. */
  headTrack: number;
  /** Arms trailing the body's turn, plus a gentle idle swing. */
  armSway: number;
  /** Depth of the antenna bulb's heartbeat, 0 = off. */
  antenna: number;
  /** Base ring rotation speed, 0 = off. */
  ringSpin: number;
  /** Fire gestures on a random schedule. */
  autoGestures: boolean;
};

/**
 * What the live hero runs. Deliberately quieter than the lab's "Lively"
 * preset — the head does most of the work and the body stays calm, so the
 * bot reads as attentive next to the headline rather than restless.
 */
export const HERO_MOTION: MotionSettings = {
  breathe: 0.022,
  sway: 0.35,
  drift: 0.12,
  pointer: 0.22,
  headTrack: 0.45,
  armSway: 0.35,
  antenna: 0.25,
  ringSpin: 0.35,
  autoGestures: true,
};

/**
 * The conversing pair. Deliberately asymmetric — two identical bots read as a
 * mirrored rendering artifact rather than two characters.
 *
 * `sway` is much lower than HERO_MOTION's 0.35: the ambient yaw swing there is
 * wider than the stage's toe-in, so at hero defaults each bot would regularly
 * swing past its partner and end up facing away. Cursor tracking is nearly off
 * for the same reason — both bots craning at the mouse in unison stops them
 * looking at each other, which is the whole effect.
 */
export const PAIR_MOTION: [MotionSettings, MotionSettings] = [
  {
    breathe: 0.02,
    sway: 0.16,
    drift: 0.09,
    pointer: 0.08,
    headTrack: 0.3,
    armSway: 0.3,
    antenna: 0.22,
    ringSpin: 0.35,
    autoGestures: true,
  },
  {
    breathe: 0.024,
    sway: 0.13,
    drift: 0.11,
    pointer: 0.08,
    headTrack: 0.26,
    armSway: 0.38,
    antenna: 0.18,
    ringSpin: 0.28,
    autoGestures: true,
  },
];

export type GestureGroup = "Eyes" | "Body" | "Arms" | "Signal" | "System";

/**
 * Every gesture here works on the unrigged model — whole-part transforms and
 * material properties only. `weight` 0 means manual-only (never auto-fired).
 */
export const GESTURES = {
  blink: { ms: 150, weight: 6, group: "Eyes", label: "Blink" },
  doubleBlink: { ms: 430, weight: 3, group: "Eyes", label: "Double blink" },
  wink: { ms: 320, weight: 1, group: "Eyes", label: "Wink" },
  squint: { ms: 760, weight: 2, group: "Eyes", label: "Squint" },
  glance: { ms: 1000, weight: 4, group: "Eyes", label: "Glance" },
  scan: { ms: 1800, weight: 1, group: "Eyes", label: "Scan" },

  nod: { ms: 950, weight: 2, group: "Body", label: "Nod" },
  shake: { ms: 900, weight: 1, group: "Body", label: "Shake head" },
  tilt: { ms: 1200, weight: 2, group: "Body", label: "Head tilt" },
  leanIn: { ms: 1200, weight: 1, group: "Body", label: "Lean in" },
  hop: { ms: 640, weight: 1, group: "Body", label: "Startle hop" },
  spin: { ms: 1500, weight: 0, group: "Body", label: "Spin" },

  wave: { ms: 1700, weight: 1, group: "Arms", label: "Wave" },
  shrug: { ms: 1100, weight: 2, group: "Arms", label: "Shrug" },
  point: { ms: 1600, weight: 1, group: "Arms", label: "Point at copy" },

  think: { ms: 1100, weight: 3, group: "Signal", label: "Thinking" },
  heartbeat: { ms: 900, weight: 2, group: "Signal", label: "Heartbeat" },
  ping: { ms: 560, weight: 2, group: "Signal", label: "Antenna ping" },
  alert: { ms: 1600, weight: 1, group: "Signal", label: "Alert" },
  // Manual only — on a marketing page a stutter reads as a rendering bug.
  glitch: { ms: 460, weight: 0, group: "Signal", label: "Glitch" },

  bootUp: { ms: 1900, weight: 0, group: "System", label: "Boot up" },
  powerDown: { ms: 1700, weight: 0, group: "System", label: "Power down" },
} as const satisfies Record<
  string,
  { ms: number; weight: number; group: GestureGroup; label: string }
>;

export type GestureName = keyof typeof GESTURES;

export const GESTURE_NAMES = Object.keys(GESTURES) as GestureName[];

export const GESTURE_GROUPS: GestureGroup[] = [
  "Eyes",
  "Body",
  "Arms",
  "Signal",
  "System",
];

const EMISSIVE_BASE = 0.6;

/** Never repeats visibly — three sines whose periods don't line up. */
function drift(t: number, scale: number) {
  return (
    Math.sin(t * 0.00031 * scale) * 0.6 +
    Math.sin(t * 0.00073 * scale + 1.7) * 0.3 +
    Math.sin(t * 0.00117 * scale + 4.1) * 0.1
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeInOut = (p: number) => p * p * (3 - 2 * p);
/** 0 → 1 → 0. */
const hump = (p: number) => Math.sin(clamp01(p) * Math.PI);
/** Ramp up, hold, release — for gestures that need to sit at full for a beat. */
const holdEnvelope = (p: number, attack = 0.18, release = 0.28) =>
  p < attack
    ? easeInOut(p / attack)
    : p > 1 - release
      ? easeInOut((1 - p) / release)
      : 1;

/**
 * Shared turn-taking lock. Two independent idle schedulers will otherwise
 * periodically fire the same big gesture on both bots at the same instant.
 */
export type GestureFloor = { holder: string | null; until: number };

export type MotionOptions = {
  /**
   * Milliseconds added to the ambient clock. Every ambient value is a pure
   * function of `t`, so without an offset two bots breathe and sway in
   * bit-identical lockstep — which reads as a rendering glitch, not as two
   * characters. Gesture timing deliberately stays on the raw clock.
   */
  phase?: number;
  /** Shared floor so big gestures take turns. Blinks stay unlocked. */
  floor?: GestureFloor;
};

/** Gestures that look wrong when both bots do them at once. */
const NEEDS_FLOOR = new Set<GestureGroup>(["Body", "Arms"]);

export function createMotion(
  rig: Rig,
  initial: MotionSettings,
  opts: MotionOptions = {},
) {
  const { THREE } = rig;
  const { phase = 0, floor } = opts;
  let settings = { ...initial };

  const head = rig.bot.getObjectByName("head_rig") as T.Object3D;
  const joint = (name: string) => rig.bot.getObjectByName(name) as T.Object3D;
  const shoulder = { left: joint("shoulder_rig_left"), right: joint("shoulder_rig_right") };
  const elbow = { left: joint("elbow_rig_left"), right: joint("elbow_rig_right") };
  const limbs = [shoulder.left, shoulder.right, elbow.left, elbow.right];
  const eyes = [rig.part("eye_left"), rig.part("eye_right")];
  const core = rig.part("chest_core");
  const bulb = rig.part("antenna_bulb");
  const rod = rig.part("antenna_rod");
  const ring = rig.part("base_ring");

  // Every glowing part shares one material in bot-model, so a blink would also
  // dim the chest core and base ring. Clone before animating anything emissive.
  const own = (mesh: T.Mesh) => {
    const mat = (mesh.material as T.MeshStandardMaterial).clone();
    mesh.material = mat;
    return mat;
  };
  const eyeMats = eyes.map(own);
  const coreMat = own(core);
  const bulbMat = own(bulb);
  const ringMat = own(ring);
  const glowMats = [...eyeMats, coreMat, bulbMat, ringMat];

  // Emissive alone can't recolour these parts — the material's cyan `color`
  // dominates — so the alert has to shift both.
  const GLOW_COLOR = new THREE.Color(0x00e5ff);
  const GLOW_EMISSIVE = new THREE.Color(0x00c8e0);
  const AMBER = new THREE.Color(0xffa03c);

  // Rest state to restore each frame, so gestures never accumulate drift.
  const rest = {
    eyes: eyes.map((e) => e.position.clone()),
    bulb: bulb.position.clone(),
  };

  const aim = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  let active: { name: GestureName; start: number; dir: number } | null = null;
  let nextAt = 0;
  let lastT = 0;
  let armLag = 0;

  const pickGesture = (): GestureName => {
    const pool = GESTURE_NAMES.filter((g) => GESTURES[g].weight > 0);
    const total = pool.reduce((n, g) => n + GESTURES[g].weight, 0);
    let roll = Math.random() * total;
    for (const g of pool) {
      roll -= GESTURES[g].weight;
      if (roll <= 0) return g;
    }
    return "blink";
  };

  /** Close both eyes by `amount` (0–1). The eye cylinders are rotated 90° on X,
   *  so their local Z is the on-screen vertical — the axis an eyelid closes along. */
  const closeEyes = (amount: number, which: 0 | 1 | 2 = 2) => {
    eyes.forEach((eye, i) => {
      if (which !== 2 && which !== i) return;
      eye.scale.z = 1 - clamp01(amount) * 0.92;
    });
  };

  /** Shift both pupils sideways — a glance the flat model can actually do. */
  const lookX = (offset: number) => {
    eyes.forEach((eye, i) => {
      eye.position.x = rest.eyes[i].x + offset * 0.022;
    });
  };

  const setGlow = (mats: T.MeshStandardMaterial[], intensity: number) => {
    for (const m of mats) m.emissiveIntensity = intensity;
  };

  const applyGesture = (name: GestureName, p: number, t: number) => {
    const dir = active?.dir ?? 1;

    switch (name) {
      case "blink":
        closeEyes(hump(p));
        break;

      case "doubleBlink":
        closeEyes(
          p < 0.36 ? hump(p / 0.36) : p > 0.58 ? hump((p - 0.58) / 0.42) : 0,
        );
        break;

      case "wink":
        closeEyes(holdEnvelope(p, 0.25, 0.35), dir > 0 ? 0 : 1);
        break;

      case "squint":
        closeEyes(holdEnvelope(p, 0.22, 0.3) * 0.62);
        break;

      case "glance": {
        // Eyes lead, head follows — then a blink on the way back.
        const k = holdEnvelope(p, 0.16, 0.34);
        lookX(dir * k);
        head.rotation.y += dir * k * 0.3;
        if (p > 0.78) closeEyes(hump((p - 0.78) / 0.22) * 0.9);
        break;
      }

      case "scan": {
        const sweep = Math.sin(p * Math.PI * 2) * dir;
        lookX(sweep);
        head.rotation.y += sweep * 0.38;
        setGlow(eyeMats, EMISSIVE_BASE + Math.abs(sweep) * 0.5);
        break;
      }

      case "nod": {
        // The head does the work; the body gives back a little for weight.
        const dip = Math.sin(p * Math.PI * 4) * 0.26 * (1 - p);
        head.rotation.x += dip;
        rig.pivot.rotation.x -= dip * 0.22;
        break;
      }

      case "shake": {
        const turn = Math.sin(p * Math.PI * 6) * 0.34 * (1 - p);
        head.rotation.y += turn;
        rig.pivot.rotation.y -= turn * 0.18;
        break;
      }

      case "tilt": {
        const k = holdEnvelope(p, 0.28, 0.4);
        head.rotation.z += dir * k * 0.24;
        head.rotation.y += dir * k * 0.1;
        break;
      }

      case "leanIn": {
        const k = holdEnvelope(p, 0.3, 0.4);
        rig.pivot.rotation.x += k * 0.15;
        // Head stays level as the body leans — that's what reads as interest
        // rather than toppling.
        head.rotation.x -= k * 0.1;
        rig.bot.scale.setScalar(1 + k * 0.05);
        break;
      }

      case "hop": {
        const lift = hump(Math.min(p / 0.55, 1));
        const land = p > 0.55 ? hump((p - 0.55) / 0.45) : 0;
        rig.pivot.position.y += lift * 0.09;
        rig.bot.scale.y = 1 - land * 0.09 + lift * 0.03;
        rig.bot.scale.x = 1 + land * 0.05;
        rig.bot.scale.z = 1 + land * 0.05;
        break;
      }

      case "spin":
        // Eased full turn — ends exactly where it started.
        rig.pivot.rotation.y += easeInOut(p) * Math.PI * 2;
        break;

      case "wave": {
        // Right arm up and out (+Z raises the +x arm), forearm oscillating.
        const k = holdEnvelope(p, 0.22, 0.3);
        shoulder.right.rotation.z += k * 2.05;
        shoulder.right.rotation.x -= k * 0.3;
        elbow.right.rotation.z += Math.sin(p * Math.PI * 8) * 0.5 * k;
        head.rotation.z += k * 0.06;
        break;
      }

      case "shrug": {
        const k = holdEnvelope(p, 0.3, 0.35);
        shoulder.left.rotation.z -= k * 0.3;
        shoulder.right.rotation.z += k * 0.3;
        elbow.left.rotation.z -= k * 0.24;
        elbow.right.rotation.z += k * 0.24;
        // Head sinks between the shoulders.
        head.rotation.x += k * 0.07;
        rig.pivot.position.y -= k * 0.014;
        break;
      }

      case "point": {
        // Left arm toward the hero copy, and the bot looks where it points.
        const k = holdEnvelope(p, 0.25, 0.3);
        shoulder.left.rotation.z -= k * 1.35;
        shoulder.left.rotation.x -= k * 0.3;
        elbow.left.rotation.z -= k * 0.2;
        head.rotation.y -= k * 0.2;
        break;
      }

      case "think": {
        const decay = 1 - easeInOut(p);
        coreMat.emissiveIntensity =
          EMISSIVE_BASE + Math.abs(Math.sin(p * 34)) * 1.5 * decay;
        break;
      }

      case "heartbeat": {
        const beat =
          p < 0.28 ? hump(p / 0.28) : p > 0.4 && p < 0.78 ? hump((p - 0.4) / 0.38) * 0.7 : 0;
        coreMat.emissiveIntensity = EMISSIVE_BASE + beat * 1.8;
        core.scale.setScalar(1 + beat * 0.35);
        break;
      }

      case "ping": {
        // Spread across the whole duration — a shorter attack left most of the
        // gesture as dead time that still blocked the queue.
        const flash = hump(p) * (1 - easeInOut(p) * 0.45);
        bulbMat.emissiveIntensity = EMISSIVE_BASE + flash * 2.4;
        bulb.scale.setScalar(1 + flash * 0.5);
        break;
      }

      case "alert": {
        // Cyan → amber: the "this one needs a human" signal.
        const k = holdEnvelope(p, 0.14, 0.3);
        for (const m of glowMats) {
          m.color.copy(GLOW_COLOR).lerp(AMBER, k);
          m.emissive.copy(GLOW_EMISSIVE).lerp(AMBER, k);
        }
        setGlow(glowMats, EMISSIVE_BASE + k * 0.9);
        rod.scale.y = 1 + k * 0.45;
        bulb.position.y = rest.bulb.y + k * 0.03;
        rig.pivot.position.y += k * 0.012;
        break;
      }

      case "glitch": {
        const j = 1 - p;
        rig.pivot.position.x += Math.sin(t * 0.9) * 0.012 * j;
        rig.pivot.position.y += Math.sin(t * 1.4) * 0.008 * j;
        rig.pivot.rotation.z += Math.sin(t * 1.1) * 0.05 * j;
        setGlow(glowMats, EMISSIVE_BASE + (Math.sin(t * 0.6) > 0 ? 0.9 : -0.45) * j);
        break;
      }

      case "bootUp": {
        // Staggered wake-up: ring, core, eyes, antenna — then it stands up.
        const k = easeInOut(p);
        const stage_ = (from: number, to: number) =>
          easeInOut(clamp01((p - from) / (to - from)));
        ringMat.emissiveIntensity = EMISSIVE_BASE * stage_(0, 0.3);
        coreMat.emissiveIntensity = EMISSIVE_BASE * stage_(0.2, 0.5);
        setGlow(eyeMats, EMISSIVE_BASE * stage_(0.42, 0.7));
        bulbMat.emissiveIntensity = EMISSIVE_BASE * stage_(0.6, 0.9);
        closeEyes(1 - stage_(0.42, 0.7));
        rig.pivot.position.y += (k - 1) * 0.08;
        rig.bot.scale.y = 0.9 + k * 0.1;
        break;
      }

      case "powerDown": {
        const k = easeInOut(p);
        const off = (from: number, to: number) =>
          1 - easeInOut(clamp01((p - from) / (to - from)));
        bulbMat.emissiveIntensity = EMISSIVE_BASE * off(0, 0.25);
        setGlow(eyeMats, EMISSIVE_BASE * off(0.15, 0.5));
        coreMat.emissiveIntensity = EMISSIVE_BASE * off(0.35, 0.7);
        ringMat.emissiveIntensity = EMISSIVE_BASE * off(0.55, 0.9);
        closeEyes(easeInOut(clamp01((p - 0.15) / 0.35)));
        rig.pivot.position.y -= k * 0.06;
        rig.bot.scale.y = 1 - k * 0.08;
        break;
      }
    }
  };

  return {
    set(next: Partial<MotionSettings>) {
      settings = { ...settings, ...next };
    },

    get(): MotionSettings {
      return { ...settings };
    },

    setPointer(x: number, y: number) {
      aim.x = x;
      aim.y = y;
    },

    /** Start a gesture now — timed against the loop's clock, not wall time. */
    fire(name: GestureName) {
      active = { name, start: lastT, dir: Math.random() < 0.5 ? -1 : 1 };
    },

    get current() {
      return active?.name ?? null;
    },

    /** One frame. `t` is milliseconds from the animation loop. */
    update(t: number) {
      lastT = t;

      // Restore everything a gesture can touch, so gestures compose with the
      // ambient layer instead of accumulating.
      eyes.forEach((eye, i) => {
        eye.scale.z = 1;
        eye.position.copy(rest.eyes[i]);
      });
      for (const m of glowMats) {
        m.emissiveIntensity = EMISSIVE_BASE;
        m.color.copy(GLOW_COLOR);
        m.emissive.copy(GLOW_EMISSIVE);
      }
      head.rotation.set(0, 0, 0);
      for (const limb of limbs) limb.rotation.set(0, 0, 0);
      core.scale.setScalar(1);
      bulb.scale.setScalar(1);
      bulb.position.copy(rest.bulb);
      rod.scale.y = 1;
      rig.bot.scale.set(1, 1, 1);
      rig.pivot.position.x = 0;

      eased.x += (aim.x - eased.x) * 0.045;
      eased.y += (aim.y - eased.y) * 0.045;

      // Ambient motion runs on the phased clock so two bots don't move in
      // lockstep; gestures below stay on the raw clock so fire() timing is
      // unaffected.
      const a = t + phase;

      rig.pivot.rotation.y =
        Math.sin(a * 0.00016) * settings.sway +
        drift(a, 1) * settings.drift +
        eased.x * settings.pointer;
      rig.pivot.rotation.x =
        eased.y * settings.pointer * 0.29 + drift(a, 1.6) * settings.drift * 0.2;
      // Weight shift rides with drift, so HERO_MOTION stays exactly what the
      // hero rendered before this system existed.
      rig.pivot.rotation.z = Math.sin(a * 0.00043) * settings.drift * 0.35;
      rig.pivot.position.y = Math.sin(a * 0.0011) * settings.breathe;

      // The head leads the body toward the cursor — the lag is what sells it.
      head.rotation.y = eased.x * settings.headTrack;
      head.rotation.x = eased.y * settings.headTrack * 0.5;

      // Arms trail the body's turn — secondary motion you feel more than see.
      armLag += (rig.pivot.rotation.y - armLag) * 0.06;
      const trail = (rig.pivot.rotation.y - armLag) * settings.armSway;
      const idleSwing = Math.sin(a * 0.0011) * 0.03 * settings.armSway;
      shoulder.left.rotation.x = -trail * 1.6;
      shoulder.right.rotation.x = -trail * 1.6;
      shoulder.left.rotation.z = -idleSwing;
      shoulder.right.rotation.z = idleSwing;

      if (settings.antenna > 0) {
        bulbMat.emissiveIntensity =
          EMISSIVE_BASE + Math.sin(a * 0.002) * settings.antenna;
      }
      if (settings.ringSpin > 0) {
        ring.rotation.y = a * 0.0004 * settings.ringSpin;
      }

      if (active) {
        const p = (t - active.start) / GESTURES[active.name].ms;
        if (p >= 1) {
          if (floor?.holder === rig.id) floor.holder = null;
          active = null;
        } else applyGesture(active.name, p, t);
      } else if (settings.autoGestures) {
        // Randomised so a pair doesn't fire its first gesture on the same frame.
        if (nextAt === 0) nextAt = t + 800 + Math.random() * 1600;
        else if (t >= nextAt) {
          const name = pickGesture();
          const wantsFloor = NEEDS_FLOOR.has(GESTURES[name].group);
          const busy =
            floor && floor.holder !== null && floor.holder !== rig.id && t < floor.until;
          if (wantsFloor && busy) {
            nextAt = t + 600; // the other bot is mid-gesture — try again shortly
          } else {
            if (wantsFloor && floor) {
              floor.holder = rig.id;
              floor.until = t + GESTURES[name].ms;
            }
            active = { name, start: t, dir: Math.random() < 0.5 ? -1 : 1 };
            nextAt = t + 2500 + Math.random() * 4500;
          }
        }
      } else {
        nextAt = 0;
      }
    },
  };
}

export type Motion = ReturnType<typeof createMotion>;
