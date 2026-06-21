import Image from "next/image";
import styles from "./page.module.css";

const metrics = [
  { value: "42%", label: "faster queue clearing" },
  { value: "6.3h", label: "saved per operator weekly" },
  { value: "99.9%", label: "workflow uptime target" },
];

const steps = [
  {
    title: "Map the bottleneck",
    body: "We trace the work that slows your team down, from intake to resolution.",
  },
  {
    title: "Plug into your stack",
    body: "Cadence connects to the CRMs, dashboards, booking tools, and inboxes already in use.",
  },
  {
    title: "Ship the working system",
    body: "Your team gets a practical AI workflow that routes, drafts, updates, and reports.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.nav} aria-label="Primary navigation">
        <a className={styles.brand} href="#top" aria-label="Cadence home">
          <Image
            src="/cadence-lockup.svg"
            alt="Cadence"
            width={156}
            height={48}
            priority
          />
        </a>
        <nav>
          <a href="#systems">Systems</a>
          <a href="#process">Process</a>
          <a href="#demo">Demo</a>
        </nav>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>AI systems for smarter operations</p>
          <h1>Make your existing business software work harder.</h1>
          <p className={styles.lede}>
            Cadence builds custom AI workflows and automations inside the tools
            your team already uses, so bottlenecks clear without a platform
            rebuild.
          </p>
          <div className={styles.actions}>
            <a href="#demo" className={styles.primaryCta}>
              Book a demo
            </a>
            <a href="#process" className={styles.secondaryCta}>
              See the process
            </a>
          </div>
        </div>

        <div className={styles.systemPanel} aria-label="Workflow preview">
          <div className={styles.panelTop}>
            <span>workflow health</span>
            <strong>Live</strong>
          </div>
          <div className={styles.rhythmBars} aria-hidden="true">
            <span />
            <span />
            <span />
            <span className={styles.peak} />
            <span />
            <span />
            <span />
          </div>
          <div className={styles.panelGrid}>
            <div>
              <span>crm sync</span>
              <strong>Connected</strong>
            </div>
            <div>
              <span>inbox triage</span>
              <strong>Automated</strong>
            </div>
            <div>
              <span>lead response</span>
              <strong>2m avg</strong>
            </div>
            <div>
              <span>handoff notes</span>
              <strong>Drafted</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Outcome metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.section} id="systems">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>What Cadence builds</p>
          <h2>Practical AI where the work already happens.</h2>
        </div>
        <div className={styles.featureGrid}>
          <article>
            <span>01</span>
            <h3>AI customer operations</h3>
            <p>
              Route requests, draft replies, update records, and surface the
              next best action before a customer waits.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Workflow automations</h3>
            <p>
              Replace manual handoffs with systems that move data between your
              website, CRM, booking tools, and internal dashboards.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Decision dashboards</h3>
            <p>
              Turn scattered operational signals into a single view that shows
              what is stuck, what moved, and what needs attention.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.process} id="process">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>How it works</p>
          <h2>Plug in, do not rip out.</h2>
        </div>
        <div className={styles.timeline}>
          {steps.map((step) => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.demo} id="demo">
        <Image
          src="/cadence-mark.svg"
          alt=""
          width={72}
          height={72}
          aria-hidden="true"
        />
        <div>
          <p className={styles.eyebrow}>One page demo</p>
          <h2>Ready to see the bottleneck clear?</h2>
          <p>
            Bring one workflow that is slow, repetitive, or customer-facing.
            Cadence will map the system and show where AI can create measurable
            operational lift.
          </p>
        </div>
        <a href="mailto:hello@cadence.ai" className={styles.primaryCta}>
          Start the sprint
        </a>
      </section>
    </main>
  );
}
