import Image from "next/image";
import localFont from "next/font/local";
import {
  Space_Grotesk,
  Instrument_Serif,
  Bricolage_Grotesque,
  Martian_Mono,
  Chakra_Petch,
  Michroma,
  Oxanium,
  Orbitron,
  Archivo,
  Onest,
  Figtree,
} from "next/font/google";
import styles from "./type-lab.module.css";

/**
 * Temporary comparison page for choosing the display typeface.
 * Delete this route once the decision is made.
 */

const tanNimbus = localFont({ src: "../fonts/TAN-NIMBUS.woff2" });

// Coolvetica: desktop EULA only — no web-embedding grant yet. See the note in
// layout.tsx; a Typodermic web license is still outstanding.
const coolveticaRg = localFont({ src: "../fonts/CoolveticaRg.otf" });
const coolveticaHv = localFont({ src: "../fonts/CoolveticaHvComp.otf" });

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"] });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["800"] });

const martianMono = Martian_Mono({ subsets: ["latin"], weight: ["700"] });
const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["700"] });
const michroma = Michroma({ subsets: ["latin"], weight: "400" });
const oxanium = Oxanium({ subsets: ["latin"], weight: ["700"] });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["700"] });

const archivo = Archivo({ subsets: ["latin"], weight: ["700"] });
const onest = Onest({ subsets: ["latin"], weight: ["700"] });
const figtree = Figtree({ subsets: ["latin"], weight: ["800"] });

type Option = {
  id: string;
  name: string;
  className: string;
  weights: string;
  verdict: string;
  tradeoff: string;
  /** Display faces that run very wide need a smaller ceiling to stay usable. */
  compact?: boolean;
  /** Approximates Coolvetica's characteristically tight default tracking. */
  tight?: boolean;
};

type Group = {
  title: string;
  note: string;
  options: Option[];
  /** Renders the real wordmark above each headline for a direct match check. */
  showWordmark?: boolean;
};

const groups: Group[] = [
  {
    title: "Baseline",
    note: "What the site ships with today.",
    options: [
      {
        id: "tan-nimbus",
        name: "TAN Nimbus",
        className: tanNimbus.className,
        weights: "400 only",
        verdict: "Current — retro editorial display",
        tradeoff:
          "Memorable, but reads boutique/nostalgic rather than secure or innovative, and fights the geometric wordmark above it. Note it takes three lines where every alternative below takes two.",
        compact: true,
      },
    ],
  },
  {
    title: "Round one — editorial & grotesque",
    note: "Distinctive without leaving a professional register.",
    options: [
      {
        id: "space-grotesk",
        name: "Space Grotesk",
        className: spaceGrotesk.className,
        weights: "300–700",
        verdict: "Technical grotesque with real quirks",
        tradeoff:
          "Closest sibling to the wordmark, so the header reads as one brand. Safe and credible, but it is the default in AI/dev tooling right now.",
      },
      {
        id: "instrument-serif",
        name: "Instrument Serif",
        className: instrumentSerif.className,
        weights: "400 + italic",
        verdict: "Sharp modern editorial serif",
        tradeoff:
          "Keeps serif sophistication but reads contemporary, not retro. Very space-efficient. Single weight, so hierarchy comes from size alone.",
      },
      {
        id: "bricolage",
        name: "Bricolage Grotesque",
        className: bricolage.className,
        weights: "200–800 variable",
        verdict: "Contemporary display grotesque",
        tradeoff:
          "Most personality of round one, and the variable range solves hierarchy outright. Reads more design-studio than the other two.",
      },
    ],
  },
  {
    title: "Round two — machine & techno",
    note: "The robotic register, ordered from most credible to most literal. The last two are here so you can see where the line is.",
    options: [
      {
        id: "martian-mono",
        name: "Martian Mono",
        className: martianMono.className,
        weights: "100–800 variable",
        verdict: "Wide monospace — system output",
        tradeoff:
          "The strongest machine signal that still reads as serious infrastructure rather than costume. Monospace says code, logs, terminals — literally the thing you build. Wide, so it needs a smaller ceiling.",
        compact: true,
      },
      {
        id: "chakra-petch",
        name: "Chakra Petch",
        className: chakraPetch.className,
        weights: "300–700",
        verdict: "Squared techno with cut corners",
        tradeoff:
          "Industrial and precise — the chamfered corners read engineered rather than sci-fi. Holds up at body sizes too, which most techno faces do not.",
      },
      {
        id: "oxanium",
        name: "Oxanium",
        className: oxanium.className,
        weights: "200–800 variable",
        verdict: "Modern squarish techno",
        tradeoff:
          "Softer and friendlier than Chakra Petch while keeping the squared skeleton. Full variable range. Slightly more gaming-adjacent.",
      },
      {
        id: "michroma",
        name: "Michroma",
        className: michroma.className,
        weights: "400 only",
        verdict: "Wide retro-futurist geometric",
        tradeoff:
          "Striking and genuinely distinctive, but extremely wide — watch how far the hero sprawls. Single weight. Works as an accent, not a workhorse.",
        compact: true,
      },
      {
        id: "orbitron",
        name: "Orbitron",
        className: orbitron.className,
        weights: "400–900 variable",
        verdict: "Full sci-fi — the cautionary one",
        tradeoff:
          "This is what most people mean by robotic, and it is why I would steer away. It reads video game and spaceship, not enterprise automation. Included so the line is visible, not as a recommendation.",
      },
    ],
  },
  {
    title: "Round three — matched to the wordmark",
    note: "Free stand-ins on the logo's Helvetica-derived skeleton, recorded before the real files arrived. Kept for comparison against round four below.",
    showWordmark: true,
    options: [
      {
        id: "archivo",
        name: "Archivo",
        className: archivo.className,
        weights: "100–900 variable",
        verdict: "Closest structural match to the logo",
        tradeoff:
          "Same grotesque skeleton as the wordmark, tracked tight to approximate Coolvetica. The header finally reads as one continuous piece of branding. Slightly more neutral than Coolvetica, which has more quirk in the t and f.",
        tight: true,
      },
      {
        id: "onest",
        name: "Onest",
        className: onest.className,
        weights: "100–900 variable",
        verdict: "Softer contemporary grotesque",
        tradeoff:
          "Marginally rounder terminals, which gets closer to Coolvetica's warmth than Archivo does. Reads friendly without losing credibility.",
        tight: true,
      },
      {
        id: "figtree",
        name: "Figtree",
        className: figtree.className,
        weights: "300–900 variable",
        verdict: "Geometric-grotesque hybrid",
        tradeoff:
          "The most geometric of the three and the furthest from the logo, but the heavy weight has real presence. Worth seeing as the outer bound of this direction.",
        tight: true,
      },
    ],
  },
  {
    title: "Round four — the real Coolvetica",
    note: "The actual files from your download. The bundled free EULA covers desktop use only and does not grant web embedding, so a web license from Typodermic is still outstanding.",
    showWordmark: true,
    options: [
      {
        id: "coolvetica-rg",
        name: "Coolvetica Rg",
        className: coolveticaRg.className,
        weights: "400 only",
        verdict: "The logo cut itself",
        tradeoff:
          "Same face as the wordmark, so continuity is total — and its native tracking and curled terminals carry more warmth than any stand-in. Single weight: hierarchy must come from size, or from the Hv Comp cut below.",
      },
      {
        id: "coolvetica-hv",
        name: "Coolvetica Hv Comp",
        className: coolveticaHv.className,
        weights: "heavy compressed",
        verdict: "The package's heavy companion",
        tradeoff:
          "A genuine second voice from the same family — denser and punchier, which solves the single-weight hierarchy problem. The compression wants generous sizes; keep it out of small labels.",
      },
    ],
  },
];

function Specimen({
  option,
  showWordmark,
}: {
  option: Option;
  showWordmark?: boolean;
}) {
  return (
    <section className={styles.specimen}>
      <div className={styles.specimenHead}>
        <div>
          <h3 className={styles.specimenName}>{option.name}</h3>
          <p className={styles.specimenVerdict}>{option.verdict}</p>
        </div>
        <span className={styles.weightBadge}>{option.weights}</span>
      </div>

      <div className={styles.stage}>
        {showWordmark && (
          <Image
            src="/sablebrain-wordmark.png"
            alt="Sable Brain wordmark"
            width={180}
            height={33}
            className={styles.wordmark}
          />
        )}
        <p className={styles.eyebrow}>AI operations agency</p>
        <p
          className={`${option.className} ${styles.hero} ${
            option.compact ? styles.heroCompact : ""
          } ${option.tight ? styles.tight : ""}`}
        >
          AI workflows that automate <em>the boring work.</em>
        </p>
        <p className={styles.lede}>
          Sable Brain builds AI systems that take repetitive tasks off your
          team&apos;s plate — inside the tools you already use.
        </p>
        <p
          className={`${option.className} ${styles.sectionHead} ${
            option.compact ? styles.sectionHeadCompact : ""
          } ${option.tight ? styles.tight : ""}`}
        >
          Practical AI, where the work already happens.
        </p>
      </div>

      <p className={styles.tradeoff}>{option.tradeoff}</p>
    </section>
  );
}

export default function TypeLab() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.kicker}>Display typeface comparison</p>
        <h1 className={styles.pageTitle}>
          Same copy, same palette, fourteen display faces
        </h1>
        <p className={styles.pageNote}>
          Body copy stays Inter in every option — only the headline face
          changes. Specimens share one size ceiling so width differences show
          honestly; the widest faces get a reduced ceiling, noted per option.
        </p>
      </header>

      {groups.map((group) => (
        <div key={group.title}>
          <div className={styles.groupHead}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <p className={styles.groupNote}>{group.note}</p>
          </div>
          {group.options.map((option) => (
            <Specimen
              key={option.id}
              option={option}
              showWordmark={group.showWordmark}
            />
          ))}
        </div>
      ))}
    </main>
  );
}
