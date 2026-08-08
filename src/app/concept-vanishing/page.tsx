import type { Metadata } from "next";
import Image from "next/image";
import styles from "./vanishing.module.css";
import ScrollReveal from "../scroll-reveal";
import VanishingList from "./vanishing-list";

/**
 * Concept prototype: "The Vanishing List".
 *
 * Same IA and positioning as `/` (docs/information-architecture.md), built on
 * one idea — the page performs subtraction instead of describing it. Every
 * section removes something. Not linked from the live site.
 */

export const metadata: Metadata = {
  title: "Sable Brain — concept: vanishing list",
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = "hello@sablebrain.com";

const services = [
  {
    title: "Workflow automation",
    body: "The repetitive chains of copy, paste, check, and forward — turned into systems that run themselves and flag only what needs a human.",
    removes: ["Re-typing the same update in three places", "Chasing status by hand"],
  },
  {
    title: "AI integrations",
    body: "AI wired into the tools you already use: your CRM, inbox, spreadsheets, and internal dashboards. No platform migration required.",
    removes: ["Swivel-chairing between tabs", "Exports that become someone's morning"],
  },
  {
    title: "Document & data processing",
    body: "Invoices, contracts, forms, and reports — extracted, structured, and filed without anyone retyping a single field.",
    removes: ["Reading the PDF to fill in the form", "Filing it in the right folder"],
  },
  {
    title: "AI assistants & agents",
    body: "Assistants that triage requests, draft responses, and keep records current, trained on how your business actually works.",
    removes: ["First-pass inbox triage", "Answering the same question again"],
  },
];

// Placeholder engagements — replace with real case studies as they land.
// Cards are designed to graduate into /work/[slug] pages (see docs/information-architecture.md).
const caseStudies = [
  {
    client: "E-commerce retailer",
    tag: "Customer operations",
    title: "Order-status inquiries answered without the support queue",
    removed: "“Where is my order?”, answered by a person",
    result: "Support inbox volume cut by more than half",
  },
  {
    client: "Professional services firm",
    tag: "Document processing",
    title: "Client intake documents processed the moment they arrive",
    removed: "Retyping intake forms into the case system",
    result: "Days of manual data entry reduced to minutes",
  },
  {
    client: "Logistics company",
    tag: "Workflow automation",
    title: "Dispatch updates that write themselves across three systems",
    removed: "The same delivery date, typed three times",
    result: "One source of truth, zero duplicate typing",
  },
];

const steps = [
  {
    title: "Map the boring work",
    body: "A short working session where we trace the repetitive tasks eating your team's week and pick the highest-impact one.",
  },
  {
    title: "Build the workflow",
    body: "We design and build the automation inside your existing tools, and test it against real work until it holds up.",
  },
  {
    title: "Run and improve",
    body: "It ships, your team gets time back, and we keep tuning it as your business changes.",
  },
];

export default function VanishingConcept() {
  return (
    <>
      <ScrollReveal />

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
          <div className={styles.heroCopy} data-reveal>
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

          <div className={styles.heroPanel}>
            <VanishingList />
          </div>
        </section>

        {/* 2. The problem */}
        <section className={styles.problem}>
          <div className={styles.sectionInner} data-reveal>
            <p className={styles.eyebrow}>The problem</p>
            <h2 className={styles.problemStatement}>
              Every week, your best people spend hours{" "}
              <span className={styles.strike}>copying data</span>,{" "}
              <span className={styles.strike}>chasing updates</span>, and{" "}
              <span className={styles.strike}>
                re-typing what a system already knows
              </span>
              .<span className={styles.emphasis}> That isn&apos;t work.</span>
              <span className={styles.emphasis}> That&apos;s friction.</span>
            </h2>
          </div>
        </section>

        {/* 3. What we build */}
        <section className={styles.section} id="services">
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>What we build</p>
            <h2>Practical AI, where the work already happens.</h2>
          </div>
          <div className={styles.serviceGrid}>
            {services.map((service, i) => (
              <article
                key={service.title}
                className={styles.serviceCard}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className={styles.cardIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <ul className={styles.removes}>
                  {service.removes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Proof */}
        <section className={styles.section} id="work">
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>Proof</p>
            <h2>Boring work we&apos;ve already made disappear.</h2>
          </div>
          <div className={styles.workGrid}>
            {caseStudies.map((cs, i) => (
              <article
                key={cs.title}
                className={styles.workCard}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={styles.workMeta}>
                  <span>{cs.client}</span>
                  <span className={styles.workTag}>{cs.tag}</span>
                </div>
                <h3>{cs.title}</h3>
                <p className={styles.workRemoved}>{cs.removed}</p>
                <p className={styles.workResult}>{cs.result}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 5. How it works */}
        <section className={styles.section}>
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>How it works</p>
            <h2>Three steps. No rip-and-replace.</h2>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li
                key={step.title}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className={styles.stepNumber}>{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
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

        {/* 7. Contact */}
        <section className={styles.contact} id="contact">
          <div data-reveal>
            <p className={styles.eyebrow}>Get started</p>
            <h2>Tell us about your most boring task.</h2>
            <p className={styles.contactBody}>
              Bring one repetitive workflow — the one everyone complains about.
              We&apos;ll show you exactly how it disappears.
            </p>
            <div className={styles.ghostRow} aria-hidden="true">
              <span className={styles.marker} />
              <span>Your most boring task</span>
            </div>
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
