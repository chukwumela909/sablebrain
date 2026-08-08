import type { Metadata } from "next";
import Image from "next/image";
import styles from "./ledger.module.css";
import ScrollReveal from "../scroll-reveal";
import RunningTotal from "./running-total";

/**
 * Concept prototype: "The Ledger".
 *
 * Same IA and positioning as `/` (docs/information-architecture.md), rendered
 * as an account of work removed: hairline rules, tabular figures, debits on
 * the left of the argument and credits on the right. The anti-hype direction.
 * Not linked from the live site.
 */

export const metadata: Metadata = {
  title: "Sable Brain — concept: ledger",
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = "hello@sablebrain.com";

// Illustrative — what a repetitive-work audit typically surfaces.
const debits = [
  { entry: "Re-keying data between systems", detail: "CRM, billing, spreadsheets", hours: 410 },
  { entry: "Chasing status by hand", detail: "Suppliers, clients, internal teams", hours: 260 },
  { entry: "Rebuilding the same report", detail: "Export, paste, reformat, send", hours: 190 },
  { entry: "Answering questions already answered", detail: "Inbox, chat, phone", hours: 180 },
];

const debitTotal = debits.reduce((sum, d) => sum + d.hours, 0);

const services = [
  {
    title: "Workflow automation",
    body: "The repetitive chains of copy, paste, check, and forward — turned into systems that run themselves and flag only what needs a human.",
    account: "Operations",
  },
  {
    title: "AI integrations",
    body: "AI wired into the tools you already use: your CRM, inbox, spreadsheets, and internal dashboards. No platform migration required.",
    account: "Systems",
  },
  {
    title: "Document & data processing",
    body: "Invoices, contracts, forms, and reports — extracted, structured, and filed without anyone retyping a single field.",
    account: "Back office",
  },
  {
    title: "AI assistants & agents",
    body: "Assistants that triage requests, draft responses, and keep records current, trained on how your business actually works.",
    account: "Front line",
  },
];

// Placeholder engagements — replace with real case studies as they land.
// Entries are designed to graduate into /work/[slug] pages (see docs/information-architecture.md).
const credits = [
  {
    client: "E-commerce retailer",
    account: "Customer operations",
    entry: "Order-status inquiries answered without the support queue",
    result: "Support inbox volume cut by more than half",
    hours: 540,
  },
  {
    client: "Professional services firm",
    account: "Document processing",
    entry: "Client intake documents processed the moment they arrive",
    result: "Days of manual data entry reduced to minutes",
    hours: 390,
  },
  {
    client: "Logistics company",
    account: "Workflow automation",
    entry: "Dispatch updates that write themselves across three systems",
    result: "One source of truth, zero duplicate typing",
    hours: 280,
  },
];

const creditTotal = credits.reduce((sum, c) => sum + c.hours, 0);

const steps = [
  {
    title: "Map the boring work",
    body: "A short working session where we trace the repetitive tasks eating your team's week and pick the highest-impact one.",
    note: "Week 1",
  },
  {
    title: "Build the workflow",
    body: "We design and build the automation inside your existing tools, and test it against real work until it holds up.",
    note: "Weeks 2–4",
  },
  {
    title: "Run and improve",
    body: "It ships, your team gets time back, and we keep tuning it as your business changes.",
    note: "Ongoing",
  },
];

const format = new Intl.NumberFormat("en-US");

export default function LedgerConcept() {
  return (
    <>
      <ScrollReveal />
      <RunningTotal />

      <header className={styles.nav}>
        <a className={styles.brand} href="#top" aria-label="Sable Brain home">
          <Image
            src="/sablebrain-wordmark.png"
            alt="Sable Brain"
            width={147}
            height={27}
            priority
          />
        </a>
        <nav className={styles.navLinks} aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
        </nav>
        <a href="#contact" className={styles.navCta}>
          Talk to us
        </a>
      </header>

      <main className={styles.page} id="top">
        {/* 1. Hero */}
        <section className={styles.hero}>
          <div data-reveal>
            <p className={styles.eyebrow}>AI operations agency</p>
            <h1>
              AI workflows that automate <em>the boring work.</em>
            </h1>
            <p className={styles.lede}>
              Sable Brain builds AI systems that take repetitive tasks off your
              team&apos;s plate — inside the tools you already use — so your
              people can do the work that actually needs them.
            </p>
            <div className={styles.heroActions}>
              <a href="#contact" className={styles.btnPrimary}>
                Talk to us
              </a>
              <a href="#work" className={styles.btnSecondary}>
                See our work
              </a>
            </div>
          </div>

          {/* Column headers set the grammar for every section below. */}
          <div className={styles.masthead} data-reveal>
            <span>Entry</span>
            <span className={styles.mastheadDetail}>Account</span>
            <span className={styles.mastheadFigure}>Hours / yr</span>
          </div>
        </section>

        {/* 2. The problem — the debit side */}
        <section className={styles.section}>
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>The problem</p>
            <h2>What the week actually costs.</h2>
          </div>

          <div className={styles.entries}>
            {debits.map((d, i) => (
              <div
                key={d.entry}
                className={styles.entry}
                data-reveal
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className={styles.entryIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.entryTitle}>{d.entry}</span>
                <span className={styles.entryDetail}>{d.detail}</span>
                <span className={`${styles.figure} ${styles.debit}`}>
                  −{format.format(d.hours)}
                </span>
              </div>
            ))}

            <div className={`${styles.entry} ${styles.subtotal}`} data-reveal>
              <span className={styles.entryIndex} />
              <span className={styles.entryTitle}>
                Hours lost to work no human should touch
              </span>
              <span className={styles.entryDetail}>
                Typical 20-person operations team
              </span>
              <span className={`${styles.figure} ${styles.debit}`}>
                −{format.format(debitTotal)}
              </span>
            </div>
          </div>

          <p className={styles.statement} data-reveal>
            Every week, your best people spend hours copying data, chasing
            updates, and re-typing what a system already knows.{" "}
            <span>That isn&apos;t work. That&apos;s friction.</span>
          </p>
        </section>

        {/* 3. What we build */}
        <section className={styles.section} id="services">
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>What we build</p>
            <h2>Practical AI, where the work already happens.</h2>
          </div>

          <div className={styles.entries}>
            {services.map((service, i) => (
              <div
                key={service.title}
                className={styles.entry}
                data-reveal
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className={styles.entryIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.entryTitle}>{service.title}</span>
                <span className={styles.entryDetail}>{service.body}</span>
                <span className={styles.account}>{service.account}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Proof — the credit side */}
        <section className={styles.section} id="work">
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>Proof</p>
            <h2>Boring work we&apos;ve already made disappear.</h2>
          </div>

          <div className={styles.entries}>
            {credits.map((c, i) => (
              <div
                key={c.entry}
                className={`${styles.entry} ${styles.creditRow}`}
                data-reveal
                data-credit={c.hours}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className={styles.entryIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.entryTitle}>
                  {c.entry}
                  <span className={styles.entryClient}>
                    {c.client} · {c.account}
                  </span>
                </span>
                <span className={styles.entryDetail}>{c.result}</span>
                <span className={`${styles.figure} ${styles.credit}`}>
                  +{format.format(c.hours)}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.footnote} data-reveal>
            Illustrative figures against placeholder engagements — replace with
            measured results before launch.
          </p>
        </section>

        {/* 5. How it works */}
        <section className={styles.section}>
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>How it works</p>
            <h2>Three steps. No rip-and-replace.</h2>
          </div>

          <ol className={styles.entries}>
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={styles.entry}
                data-reveal
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className={styles.entryIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.entryTitle}>{step.title}</span>
                <span className={styles.entryDetail}>{step.body}</span>
                <span className={styles.account}>{step.note}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 6. Who we are */}
        <section className={styles.section} id="about">
          <div className={styles.aboutGrid}>
            <div data-reveal>
              <p className={styles.eyebrow}>Who we are</p>
              <h2>Operators first, AI builders second.</h2>
              <p className={styles.aboutBody}>
                We&apos;re a small team that has run the workflows we now
                automate. We measure our work in hours handed back to your team
                — not in demos that never ship.
              </p>
            </div>
            <div className={styles.partnersStrip} data-reveal>
              <p className={styles.eyebrow}>Partners</p>
              <p>
                We collaborate with agencies, consultancies, and software teams
                who want AI capability behind their own client work. If that
                sounds like you, reach us at the address in the footer.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Contact — closing balance */}
        <section className={styles.contact} id="contact">
          <div className={styles.balance} data-reveal>
            <span className={styles.balanceLabel}>Balance</span>
            <span className={styles.balanceFigure}>
              +{format.format(creditTotal)}
            </span>
            <span className={styles.balanceUnit}>
              hours returned, across three engagements
            </span>
          </div>

          <div data-reveal>
            <p className={styles.eyebrow}>Get started</p>
            <h2>Tell us about your most boring task.</h2>
            <p className={styles.contactBody}>
              Bring one repetitive workflow — the one everyone complains about.
              We&apos;ll show you exactly how it disappears.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.btnPrimary}>
              Talk to us
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image
              src="/sablebrain-wordmark.png"
              alt="Sable Brain"
              width={114}
              height={21}
            />
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.footerEmail}>
            {CONTACT_EMAIL}
          </a>
          <p className={styles.footerLegal}>
            © {new Date().getFullYear()} Sable Brain. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
