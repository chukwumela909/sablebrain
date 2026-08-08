"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./vanishing.module.css";

/**
 * Hero mechanic for the "Vanishing List" concept.
 *
 * A week of real chores strikes through one row at a time and fades to a
 * ghost, leaving a single bright line: the work that actually needs a person.
 * Struck rows stay in place rather than collapsing — no layout shift, and the
 * residue reads as "here is what we removed".
 */

const CHORES: { task: string; cadence: string }[] = [
  { task: "Re-key invoice #4412 into Xero", cadence: "daily" },
  { task: "Chase PO status with the supplier", cadence: "3× a week" },
  { task: "Copy the new lead from inbox into the CRM", cadence: "hourly" },
  { task: "Export the report, paste it into the deck", cadence: "weekly" },
  { task: "Reconcile the spreadsheet. Again.", cadence: "daily" },
  { task: "Forward the signed contract to finance", cadence: "daily" },
  { task: "Update the delivery date in three systems", cadence: "daily" },
  { task: "Retype client details from the PDF form", cadence: "daily" },
  { task: "Check whether anyone has replied yet", cadence: "hourly" },
  { task: "Chase the timesheet nobody filed", cadence: "weekly" },
  { task: "Merge two exports that should be one", cadence: "weekly" },
  { task: "Answer “where is my order?” for the 40th time", cadence: "hourly" },
  { task: "Paste the same update into Slack and email", cadence: "daily" },
];

const SURVIVOR = { task: "Call the client back.", cadence: "your team" };
const TOTAL = CHORES.length + 1;

const START_DELAY = 700;
const STEP = 130;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function VanishingList() {
  const [struck, setStruck] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const run = useCallback(() => {
    clearTimers();

    if (prefersReducedMotion()) {
      setStruck(CHORES.length);
      return;
    }

    setStruck(0);
    for (let i = 1; i <= CHORES.length; i += 1) {
      timers.current.push(
        window.setTimeout(() => setStruck(i), START_DELAY + i * STEP),
      );
    }
  }, []);

  useEffect(() => {
    // Deferred one tick: calling run() synchronously here trips
    // react-hooks/set-state-in-effect, and the START_DELAY hides the tick.
    const id = window.setTimeout(run, 0);
    return () => {
      window.clearTimeout(id);
      clearTimers();
    };
  }, [run]);

  const done = struck === CHORES.length;
  const remaining = TOTAL - struck;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>Your team&apos;s week</span>
        <span className={styles.panelCount} aria-hidden="true">
          <span className={styles.panelCountNum}>{remaining}</span>
          <span>{remaining === 1 ? "task left" : "tasks"}</span>
        </span>
      </div>

      <ul className={styles.list} aria-label="Repetitive tasks a team does each week">
        {CHORES.map((chore, i) => (
          <li
            key={chore.task}
            className={`${styles.row} ${i < struck ? styles.struck : ""}`}
          >
            <span className={styles.marker} aria-hidden="true" />
            <span className={styles.rowTask}>{chore.task}</span>
            <span className={styles.rowCadence}>{chore.cadence}</span>
          </li>
        ))}

        <li
          className={`${styles.row} ${styles.survivor} ${done ? styles.alive : ""}`}
        >
          <svg
            className={styles.check}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          <span className={styles.rowTask}>{SURVIVOR.task}</span>
          <span className={styles.rowCadence}>{SURVIVOR.cadence}</span>
        </li>
      </ul>

      <button type="button" className={styles.replay} onClick={run}>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
        Replay
      </button>
    </div>
  );
}
