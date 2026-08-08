import type * as T from "three";
import { buildBot, type ThreeModule } from "./bot-model";

export type Stage = {
  THREE: ThreeModule;
  bot: T.Group;
  /** Wrapper the ambient motion drives, so the bot's own transform stays clean. */
  pivot: T.Group;
  renderer: T.WebGLRenderer;
  part: (name: string) => T.Mesh;
  render: () => void;
  resize: () => void;
  dispose: () => void;
};

/**
 * Renderer + cool studio lighting + a camera framed to the bot. Shared by the
 * hero and /bot-lab so what you tune in the lab is what the hero renders.
 */
export function createStage(THREE: ThreeModule, host: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    // Without this the drawing buffer is cleared after compositing, so any
    // single rendered frame vanishes — which is exactly what the paused loop
    // (hidden tab) and the prefers-reduced-motion path both rely on.
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
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

  const bot = buildBot(THREE);
  const pivot = new THREE.Group();
  pivot.add(bot);
  scene.add(pivot);

  const box = new THREE.Box3().setFromObject(bot);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  bot.position.y -= sphere.center.y;
  const dist = (sphere.radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.05;
  camera.position.set(0, sphere.radius * 0.18, dist);
  camera.lookAt(0, 0, 0);

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  const part = (name: string) => bot.getObjectByName(name) as T.Mesh;

  const dispose = () => {
    bot.traverse((o) => {
      const mesh = o as T.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m.dispose();
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { THREE, bot, pivot, renderer, part, render, resize, dispose };
}
