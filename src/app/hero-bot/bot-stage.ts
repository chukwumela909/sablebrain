import type * as T from "three";
import { buildBot, type ThreeModule } from "./bot-model";

/** One bot plus everything the motion system needs to drive it. */
export type Rig = {
  THREE: ThreeModule;
  /** Stable identity — keys the speech-bubble overlay and the gesture floor. */
  id: string;
  /**
   * Placement: position and base yaw, set once at construction.
   * bot-motion must NEVER write here — it rewrites `pivot` absolutely every
   * frame (including `pivot.position.x = 0`), so an offset stored on the pivot
   * is erased on the first tick and every bot collapses to the same spot.
   */
  slot: T.Group;
  /** Motion owns this transform completely. */
  pivot: T.Group;
  bot: T.Group;
  /** Empty above the antenna — project this to place a speech bubble. */
  anchor: T.Object3D;
  part: (name: string) => T.Mesh;
  dispose: () => void;
};

export type StageOptions = {
  /** Number of bots. Default 1 — the single-bot path is unchanged. */
  count?: number;
  /** Distance between bot centres, model units. The bot is 0.71 wide. */
  spacing?: number;
  /** Yaw each outer bot turns toward the centre, radians. */
  toeIn?: number;
  /** Empty space reserved above the heads, as a fraction of the bots' height. */
  headroom?: number;
  /** Slack on every side for what gestures do to the silhouette. */
  pad?: number;
  /** Cap on devicePixelRatio — a wide canvas at DPR 2 is a large buffer. */
  maxPixelRatio?: number;
};

export type Stage = {
  THREE: ThreeModule;
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  renderer: T.WebGLRenderer;
  rigs: Rig[];
  /** Canvas CSS size, cached so projection never forces a layout read. */
  size: { w: number; h: number };
  /** Aliases onto rigs[0] so single-bot consumers don't churn. */
  bot: T.Group;
  pivot: T.Group;
  part: (name: string) => T.Mesh;
  render: () => void;
  resize: () => void;
  /** Recompute camera distance for the current aspect. Called by resize(). */
  frame: () => void;
  dispose: () => void;
};

/**
 * Renderer + cool studio lighting + a camera framed to every bot on stage.
 * Shared by the hero and /bot-lab so what you tune in the lab is what the
 * hero renders.
 */
export function createStage(
  THREE: ThreeModule,
  host: HTMLElement,
  opts: StageOptions = {},
): Stage {
  const {
    count = 1,
    spacing = 1.15,
    toeIn = 0.3,
    headroom = 0,
    pad = 0.1,
    maxPixelRatio = 2,
  } = opts;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    // Without this the drawing buffer is cleared after compositing, so any
    // single rendered frame vanishes — which is exactly what the paused loop
    // (hidden tab) and the prefers-reduced-motion path both rely on.
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);

  // Cool studio — the design project's warm hemisphere/fill would tint the ice
  // shell yellow against a navy page. The cyan rim is the brand accent.
  scene.add(new THREE.HemisphereLight(0x8fd4ff, 0x08111f, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00e5ff, 1.7);
  rim.position.set(-3.2, 1.4, -2.6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xa8c6ff, 0.35);
  fill.position.set(-4, 2.4, 3);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const rigs: Rig[] = [];
  for (let i = 0; i < count; i++) {
    const bot = buildBot(THREE);
    const pivot = new THREE.Group();
    pivot.add(bot);
    const slot = new THREE.Group();
    slot.name = `slot_${i}`;
    slot.add(pivot);
    root.add(slot);

    // -1, +1 for a pair; 0 for a lone bot, which keeps the old framing.
    const sideways = count === 1 ? 0 : i - (count - 1) / 2;
    slot.position.x = sideways * spacing;
    // The bot faces +Z, so +yaw turns it toward +X: the left bot needs a
    // positive turn to look at the right one.
    slot.rotation.y = -Math.sign(sideways) * toeIn;
    // A little depth stagger stops the pair reading as one mirrored bot.
    slot.position.z = sideways * -0.1;

    // head_rig sits at the NECK (y 0.775), so a bubble anchored there lands at
    // chin height. +0.52 clears the antenna bulb. Parented to the head so the
    // bubble leans when the head turns — that lean is what reads as speech.
    const anchor = new THREE.Object3D();
    anchor.name = "bubble_anchor";
    anchor.position.set(0, 0.52, 0);
    (bot.getObjectByName("head_rig") as T.Object3D).add(anchor);

    rigs.push({
      THREE,
      id: `bot-${i}`,
      slot,
      pivot,
      bot,
      anchor,
      part: (name: string) => bot.getObjectByName(name) as T.Mesh,
      dispose: () => {
        bot.traverse((o) => {
          const mesh = o as T.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          for (const m of mats) m.dispose();
        });
        // Materials bot-motion cloned away from are unreachable by traversal.
        const base = bot.userData.baseMaterials as T.Material[] | undefined;
        if (base) for (const m of base) m.dispose();
      },
    });
  }

  const size = { w: 1, h: 1 };
  const box = new THREE.Box3();
  const extent = new THREE.Vector3();

  const frame = () => {
    scene.updateMatrixWorld(true);

    box.makeEmpty();
    for (const rig of rigs) box.expandByObject(rig.slot);
    box.getSize(extent);

    // Pad for what the motion system can do to the silhouette: leanIn scales
    // 1.05, hop lifts 0.09, alert stretches the antenna rod 1.45x. Framing the
    // rest pose tight clips the antenna every time a gesture fires.
    const top = box.max.y + pad;
    const bottom = box.min.y - pad;
    const height = top - bottom;

    // Headroom grows the framed box upward only — that pushes the bots toward
    // the bottom of the canvas and leaves clear sky for bubbles.
    const framedTop = top + headroom * height;
    const halfH = (framedTop - bottom) / 2;
    const centreY = (framedTop + bottom) / 2;
    const halfW = extent.x / 2 + pad;
    const halfD = extent.z / 2 + pad;

    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const tanH = tanV * camera.aspect;
    // Which term binds flips with the canvas aspect, which is why this can't
    // be computed once at construction the way it used to be.
    const dist = Math.max(halfH / tanV, halfW / tanH) + halfD;

    camera.position.set(0, centreY + height * 0.1, dist);
    camera.lookAt(0, centreY, 0);
    camera.updateProjectionMatrix();
  };

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    size.w = w;
    size.h = h;
    camera.aspect = w / h;
    frame();
  };
  resize();

  const dispose = () => {
    for (const rig of rigs) rig.dispose();
    // StrictMode double-invokes the effect in dev and browsers cap live WebGL
    // contexts, so release this one explicitly rather than waiting for GC.
    renderer.forceContextLoss();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    THREE,
    scene,
    camera,
    renderer,
    rigs,
    size,
    bot: rigs[0].bot,
    pivot: rigs[0].pivot,
    part: rigs[0].part,
    render,
    resize,
    frame,
    dispose,
  };
}
