import type * as ThreeTypes from "three";

export type ThreeModule = typeof import("three");

/**
 * Low-poly agent, ported from the Claude Design project "Low-poly Claude bot
 * agent" (bot.js). Geometry, part names, and materials are unchanged — the
 * palette is already Sable Brain's. THREE is passed in so the caller controls
 * when the library chunk loads.
 */
export function buildBot(THREE: ThreeModule): ThreeTypes.Group {
  const M = {
    shell: new THREE.MeshStandardMaterial({
      name: "shell_ice",
      color: 0xdfe8f2,
      roughness: 0.55,
      metalness: 0.15,
      flatShading: true,
    }),
    navy: new THREE.MeshStandardMaterial({
      name: "navy_plate",
      color: 0x1e3a5f,
      roughness: 0.5,
      metalness: 0.25,
      flatShading: true,
    }),
    deep: new THREE.MeshStandardMaterial({
      name: "visor_deep",
      color: 0x081120,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true,
    }),
    glow: new THREE.MeshStandardMaterial({
      name: "cyan_glow",
      color: 0x00e5ff,
      emissive: 0x00c8e0,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: true,
    }),
    steel: new THREE.MeshStandardMaterial({
      name: "steel_joint",
      color: 0x93a9c4,
      roughness: 0.45,
      metalness: 0.35,
      flatShading: true,
    }),
  };

  const bot = new THREE.Group();
  bot.name = "bot_agent";

  const add = (
    name: string,
    geo: ThreeTypes.BufferGeometry,
    mat: ThreeTypes.Material,
    pos?: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    bot.add(m);
    return m;
  };

  // base
  add("base_plinth", new THREE.CylinderGeometry(0.2, 0.28, 0.1, 10), M.navy, [0, 0.05, 0]);
  add("base_ring", new THREE.CylinderGeometry(0.205, 0.205, 0.025, 10), M.glow, [0, 0.112, 0]);
  add("hip_taper", new THREE.CylinderGeometry(0.17, 0.2, 0.14, 10), M.steel, [0, 0.19, 0]);

  // torso
  add("torso", new THREE.BoxGeometry(0.4, 0.4, 0.3), M.shell, [0, 0.46, 0]);
  add("torso_collar", new THREE.BoxGeometry(0.34, 0.06, 0.26), M.navy, [0, 0.68, 0]);
  add("chest_panel", new THREE.BoxGeometry(0.2, 0.16, 0.03), M.deep, [0, 0.49, 0.151]);
  add(
    "chest_core",
    new THREE.CylinderGeometry(0.045, 0.045, 0.03, 8),
    M.glow,
    [0, 0.49, 0.163],
    [Math.PI / 2, 0, 0],
  );
  add("belt", new THREE.BoxGeometry(0.41, 0.04, 0.31), M.navy, [0, 0.28, 0]);

  // neck + head
  add("neck", new THREE.CylinderGeometry(0.06, 0.07, 0.07, 8), M.steel, [0, 0.735, 0]);
  add("head", new THREE.BoxGeometry(0.38, 0.3, 0.3), M.shell, [0, 0.92, 0]);
  add("head_crown", new THREE.BoxGeometry(0.3, 0.05, 0.24), M.navy, [0, 1.083, 0]);
  add("visor", new THREE.BoxGeometry(0.3, 0.15, 0.04), M.deep, [0, 0.94, 0.147]);
  add(
    "eye_left",
    new THREE.CylinderGeometry(0.042, 0.042, 0.03, 10),
    M.glow,
    [-0.075, 0.945, 0.163],
    [Math.PI / 2, 0, 0],
  );
  add(
    "eye_right",
    new THREE.CylinderGeometry(0.042, 0.042, 0.03, 10),
    M.glow,
    [0.075, 0.945, 0.163],
    [Math.PI / 2, 0, 0],
  );
  add(
    "ear_left",
    new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8),
    M.navy,
    [-0.2, 0.92, 0],
    [0, 0, Math.PI / 2],
  );
  add(
    "ear_right",
    new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8),
    M.navy,
    [0.2, 0.92, 0],
    [0, 0, Math.PI / 2],
  );
  add("antenna_rod", new THREE.CylinderGeometry(0.012, 0.012, 0.13, 6), M.steel, [0, 1.17, 0]);
  add("antenna_bulb", new THREE.SphereGeometry(0.04, 10, 6), M.glow, [0, 1.25, 0]);

  // arms
  for (const s of [-1, 1]) {
    const side = s < 0 ? "left" : "right";
    add(`shoulder_${side}`, new THREE.SphereGeometry(0.085, 10, 6), M.steel, [s * 0.235, 0.6, 0]);
    add(
      `arm_${side}`,
      new THREE.CylinderGeometry(0.055, 0.048, 0.3, 8),
      M.shell,
      [s * 0.275, 0.435, 0],
      [0, 0, s * -0.12],
    );
    add(`elbow_${side}`, new THREE.SphereGeometry(0.052, 8, 6), M.steel, [s * 0.3, 0.29, 0]);
    add(`hand_${side}`, new THREE.BoxGeometry(0.09, 0.11, 0.08), M.navy, [s * 0.31, 0.21, 0]);
  }

  // ---- Rig ----------------------------------------------------------------
  // The design project's model is flat: every part is a sibling at an absolute
  // position, so "the head" isn't an object you can turn. Reparenting is done
  // here rather than by rewriting the coordinates above, so the numbers stay
  // checkable against the source and the joint stays one editable value.

  /** Top of the neck cylinder, where the head actually meets the body. */
  const HEAD_JOINT = new THREE.Vector3(0, 0.775, 0);

  const HEAD_PARTS = [
    "head",
    "head_crown",
    "visor",
    "eye_left",
    "eye_right",
    "ear_left",
    "ear_right",
    "antenna_rod",
    "antenna_bulb",
  ];

  const headRig = new THREE.Group();
  headRig.name = "head_rig";
  headRig.position.copy(HEAD_JOINT);
  bot.add(headRig);

  for (const name of HEAD_PARTS) {
    const mesh = bot.getObjectByName(name);
    if (!mesh) continue;
    // Offset by the joint so the world position is unchanged by the reparent.
    mesh.position.sub(HEAD_JOINT);
    headRig.add(mesh);
  }

  // Shoulder and elbow joints, same approach. The shoulder ball stays on the
  // torso — it's the socket the arm swings in.
  for (const [side, sign] of [
    ["left", -1],
    ["right", 1],
  ] as const) {
    const shoulderAt = new THREE.Vector3(sign * 0.235, 0.6, 0);
    const elbowAt = new THREE.Vector3(sign * 0.3, 0.29, 0);

    const shoulderRig = new THREE.Group();
    shoulderRig.name = `shoulder_rig_${side}`;
    shoulderRig.position.copy(shoulderAt);
    bot.add(shoulderRig);

    const elbowRig = new THREE.Group();
    elbowRig.name = `elbow_rig_${side}`;
    elbowRig.position.copy(elbowAt).sub(shoulderAt);
    shoulderRig.add(elbowRig);

    // Upper arm and elbow ball swing from the shoulder…
    for (const name of [`arm_${side}`, `elbow_${side}`]) {
      const mesh = bot.getObjectByName(name);
      if (!mesh) continue;
      mesh.position.sub(shoulderAt);
      shoulderRig.add(mesh);
    }

    // …and the hand hangs off the elbow.
    const hand = bot.getObjectByName(`hand_${side}`);
    if (hand) {
      hand.position.sub(elbowAt);
      elbowRig.add(hand);
    }
  }

  return bot;
}
