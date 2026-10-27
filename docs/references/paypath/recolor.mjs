// Remap an image's luminance onto the Sable Brain navy→cyan ramp.
// usage (from the repo root): node docs/references/paypath/recolor.mjs <in> <out> [gamma]
// gamma < 1 lifts the mid-tones; 0.8 was used for hero-hills-blue.png.
import sharp from 'sharp';

const [, , input, output, gammaArg] = process.argv;
const gamma = Number(gammaArg ?? 1);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// luma 0..1 → colour. Dark end sits just below --color-background,
// bright end passes through --color-primary (#00e5ff).
const stops = [
  [0.0, hex('#040912')],
  [0.22, hex('#081120')],
  [0.45, hex('#12233c')],
  [0.62, hex('#1e3a5f')],
  [0.78, hex('#0e6f8f')],
  [0.9, hex('#00c4e0')],
  [0.97, hex('#00e5ff')],
  [1.0, hex('#bdf7ff')],
];

const lut = new Array(256).fill(null).map((_, v) => {
  const t = Math.pow(v / 255, gamma);
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [t0, c0] = stops[i];
  const [t1, c1] = stops[i + 1];
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  return c0.map((c, j) => Math.round(c + (c1[j] - c) * k));
});

const img = sharp(input);
const { width, height } = await img.metadata();
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
// Stretch luminance so the source's brightest pixels (p99.9) land on the
// top of the ramp instead of sitting in the navy mid-tones.
const hist = new Array(256).fill(0);
const lumas = new Uint8Array(data.length / 4);
for (let p = 0, i = 0; p < data.length; p += 4, i++) {
  const l = Math.round(0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]);
  lumas[i] = l; hist[l]++;
}
let acc = 0, hi = 255;
for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= lumas.length * 0.999) { hi = v; break; } }
let lo = 0; acc = 0;
for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= lumas.length * 0.001) { lo = v; break; } }
console.log(`luma range: lo=${lo} hi(p99.9)=${hi}`);

const out = Buffer.alloc(data.length);
for (let p = 0, i = 0; p < data.length; p += 4, i++) {
  const l = Math.min(255, Math.max(0, Math.round(((lumas[i] - lo) / (hi - lo)) * 255)));
  const [nr, ng, nb] = lut[l];
  out[p] = nr; out[p + 1] = ng; out[p + 2] = nb; out[p + 3] = data[p + 3];
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .toFile(output);
console.log(`${input} → ${output} (${width}x${height})`);
