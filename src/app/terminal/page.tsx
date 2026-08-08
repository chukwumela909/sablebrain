import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import styles from "./terminal.module.css";
import TypedCommand from "./typed-command";

/**
 * Experimental terminal-styled treatment of the landing page.
 * Same IA and copy as `/`, different skin. Not linked from the live site.
 */

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Sable Brain — terminal",
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = "hello@sablebrain.com";
const PROMPT = "visitor@sablebrain ~ %";

const boot = [
  "loading workflow engine",
  "connecting integrations",
  "mounting client systems",
];

const services = [
  {
    mode: "drwxr-xr-x",
    name: "workflow-automation/",
    body: "Repetitive chains of copy, paste, check, forward — turned into systems that run themselves and flag only what needs a human.",
  },
  {
    mode: "drwxr-xr-x",
    name: "ai-integrations/",
    body: "AI wired into the tools you already use: CRM, inbox, spreadsheets, internal dashboards. No platform migration required.",
  },
  {
    mode: "drwxr-xr-x",
    name: "document-processing/",
    body: "Invoices, contracts, forms, reports — extracted, structured, filed without anyone retyping a single field.",
  },
  {
    mode: "drwxr-xr-x",
    name: "assistants-agents/",
    body: "Assistants that triage requests, draft responses, keep records current — trained on how your business actually works.",
  },
];

// Placeholder engagements — replace with real case studies.
const results = [
  {
    ts: "e-commerce",
    tag: "customer-ops",
    line: "Order-status inquiries answered without the support queue",
    result: "support inbox volume down >50%",
  },
  {
    ts: "prof-services",
    tag: "doc-processing",
    line: "Client intake documents processed the moment they arrive",
    result: "days of manual entry cut to minutes",
  },
  {
    ts: "logistics",
    tag: "workflow-auto",
    line: "Dispatch updates that write themselves across three systems",
    result: "one source of truth, zero duplicate typing",
  },
];

const steps = [
  {
    title: "map the boring work",
    body: "A short working session tracing the repetitive tasks eating your team's week. We pick the highest-impact one.",
  },
  {
    title: "build the workflow",
    body: "We design and build the automation inside your existing tools, tested against real work until it holds up.",
  },
  {
    title: "run and improve",
    body: "It ships, your team gets time back, and we keep tuning it as your business changes.",
  },
];

function Prompt({ command }: { command: string }) {
  return (
    <p className={styles.promptLine}>
      <span className={styles.promptUser}>{PROMPT}</span>{" "}
      <span className={styles.command}>{command}</span>
    </p>
  );
}

export default function TerminalPage() {
  return (
    <div className={`${mono.className} ${styles.screen}`}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.dots} aria-hidden="true">
            <i /> <i /> <i />
          </span>
          <span className={styles.title}>sablebrain — ~/company — zsh</span>
          <a href="#contact" className={styles.titleCta}>
            talk to us
          </a>
        </div>

        <main className={styles.body}>
          <section className={styles.boot} aria-label="System boot">
            <p className={styles.bootHead}>sablebrain-os 1.0.4 — initializing</p>
            {boot.map((line) => (
              <p key={line} className={styles.bootLine}>
                <span className={styles.ok}>[ ok ]</span> {line}
              </p>
            ))}
          </section>

          {/* Hero */}
          <section className={styles.block}>
            <p className={styles.promptLine}>
              <span className={styles.promptUser}>{PROMPT}</span>{" "}
              <span className={styles.command}>
                <TypedCommand text="sablebrain --whoami" />
              </span>
            </p>
            <div className={styles.output}>
              <h1 className={styles.h1}>
                AI workflows that automate <em>the boring work.</em>
              </h1>
              <p className={styles.lede}>
                Sable Brain builds AI systems that take repetitive tasks off
                your team&apos;s plate — inside the tools you already use — so
                your people can do the work that actually needs them.
              </p>
              <div className={styles.actions}>
                <a href="#contact" className={styles.btnPrimary}>
                  ./talk-to-us
                </a>
                <a href="#work" className={styles.btnGhost}>
                  cat work/
                </a>
              </div>
            </div>
          </section>

          {/* Problem */}
          <section className={styles.block}>
            <Prompt command="cat problem.txt" />
            <div className={styles.output}>
              <blockquote className={styles.quote}>
                Every week, your best people spend hours copying data, chasing
                updates, and re-typing what a system already knows.
                <span> That isn&apos;t work. That&apos;s friction.</span>
              </blockquote>
            </div>
          </section>

          {/* Services */}
          <section className={styles.block} id="services">
            <Prompt command="ls -la services/" />
            <div className={styles.output}>
              <h2 className={styles.srOnly}>What we build</h2>
              <p className={styles.meta}>total {services.length}</p>
              <ul className={styles.listing}>
                {services.map((s) => (
                  <li key={s.name} className={styles.listItem}>
                    <span className={styles.mode}>{s.mode}</span>
                    <span className={styles.fileName}>{s.name}</span>
                    <span className={styles.fileBody}>{s.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Proof */}
          <section className={styles.block} id="work">
            <Prompt command="tail -n 3 work/results.log" />
            <div className={styles.output}>
              <h2 className={styles.srOnly}>Proof</h2>
              <ul className={styles.logList}>
                {results.map((r) => (
                  <li key={r.line} className={styles.logItem}>
                    <span className={styles.logMeta}>
                      <span className={styles.logTs}>[{r.ts}]</span>
                      <span className={styles.logTag}>{r.tag}</span>
                    </span>
                    <span className={styles.logLine}>{r.line}</span>
                    <span className={styles.logResult}>
                      <span className={styles.arrow}>→</span> {r.result}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Process */}
          <section className={styles.block}>
            <Prompt command="./engage --explain" />
            <div className={styles.output}>
              <h2 className={styles.srOnly}>How it works</h2>
              <ol className={styles.steps}>
                {steps.map((step, i) => (
                  <li key={step.title} className={styles.step}>
                    <span className={styles.stepNum}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.stepBody}>
                      <strong>{step.title}</strong>
                      <span>{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* About */}
          <section className={styles.block} id="about">
            <Prompt command="whoami --team" />
            <div className={styles.output}>
              <h2 className={styles.h2}>operators first, AI builders second</h2>
              <p className={styles.body}>
                We&apos;re a small team that has run the workflows we now
                automate. We measure our work in hours handed back to your team
                — not in demos that never ship.
              </p>
              <p className={styles.note}>
                <span className={styles.noteKey}>partners:</span> we collaborate
                with agencies, consultancies, and software teams who want AI
                capability behind their own client work.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className={styles.block} id="contact">
            <Prompt command="./talk-to-us" />
            <div className={styles.output}>
              <h2 className={styles.h2}>tell us about your most boring task</h2>
              <p className={styles.body}>
                Bring one repetitive workflow — the one everyone complains
                about. We&apos;ll show you exactly how it disappears.
              </p>
              <div className={styles.actions}>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className={styles.btnPrimary}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
              <p className={styles.promptLine}>
                <span className={styles.promptUser}>{PROMPT}</span>
                <span className={styles.cursor} aria-hidden="true" />
              </p>
            </div>
          </section>
        </main>

        <footer className={styles.statusBar}>
          <span className={styles.statusItem}>sable-brain</span>
          <span className={styles.statusDim}>ai operations agency</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.statusLink}>
            {CONTACT_EMAIL}
          </a>
          <span className={styles.statusSpacer} />
          <span className={styles.statusDim}>
            © {new Date().getFullYear()}
          </span>
        </footer>
      </div>
    </div>
  );
}
