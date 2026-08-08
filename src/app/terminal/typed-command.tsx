"use client";

import { useEffect, useState } from "react";
import styles from "./terminal.module.css";

/**
 * Types out a command string character by character.
 *
 * Renders the complete string on the server so the line is intact without JS
 * and for assistive tech; the animation clears and retypes it on the first
 * interval tick. Skipped entirely when motion is reduced.
 */
export default function TypedCommand({ text }: { text: string }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Starts at -1 so the first tick clears the line rather than doing it
    // synchronously here, which would cascade an extra render.
    let i = -1;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 38);

    return () => window.clearInterval(id);
  }, [text]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className={styles.srOnly}>{text}</span>
      <span className={styles.cursor} aria-hidden="true" />
    </>
  );
}
