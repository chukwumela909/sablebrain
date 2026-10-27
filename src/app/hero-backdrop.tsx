import Image from "next/image";
import styles from "./hero-backdrop.module.css";

// Three stacked layers, full-bleed behind the hero (see
// docs/design-references.md → PayPath hero background for where they come
// from and how recolor.mjs put them in our palette):
//   1. hills-blur — same shape, heavily blurred. Always on, so there's colour
//      under the copy before the big file lands.
//   2. hills      — the ridges and the cyan trail. Fades in over the blur.
//   3. glow       — a soft cyan blob, wider than the viewport, screened over the
//      trail so it reads as light rather than paint.
// The scrim on top keeps the copy's left column and the nav readable and lets
// the bottom edge dissolve into the page background.
export default function HeroBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <Image
        src="/hero/hills-blur.webp"
        alt=""
        fill
        sizes="100vw"
        className={styles.blur}
      />
      <Image
        src="/hero/hills.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.hills}
      />
      <Image
        src="/hero/glow.webp"
        alt=""
        width={1600}
        height={582}
        sizes="180vw"
        className={styles.glow}
      />
      <div className={styles.scrim} />
    </div>
  );
}
