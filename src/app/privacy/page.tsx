import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import home from "../page.module.css";
import styles from "./privacy.module.css";

const CONTACT_EMAIL = "hello@sablebrain.com";
const LAST_UPDATED = "27 October 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Sable Brain",
  description:
    "What Sable Brain collects when you visit this site, why, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <>
      <header className={home.nav}>
        <Link className={home.brand} href="/" aria-label="Sable Brain home">
          <Image
            src="/sablebrain-wordmark.png"
            alt="Sable Brain"
            width={147}
            height={27}
            priority
          />
        </Link>
        <nav className={home.navLinks} aria-label="Primary navigation">
          <Link href="/#work">Work</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#about">About</Link>
        </nav>
        <Link href="/#contact" className={home.navCta}>
          Talk to us
        </Link>
      </header>

      <main className={home.page}>
        <article className={styles.article}>
          <p className={home.eyebrow}>Legal</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated {LAST_UPDATED}</p>

          <p className={styles.lede}>
            Sable Brain is a small AI operations agency. This page explains what
            happens to your information when you visit sablebrain.com. The
            short version: we collect very little, we don&apos;t sell any of it,
            and you can ask us about it at any time.
          </p>

          <section className={styles.section}>
            <h2>What we collect</h2>
            <ul>
              <li>
                <strong>Your cookie choice.</strong>{" "}
                When you accept, reject, or
                customise cookies, we save that decision in your browser&apos;s
                local storage so we don&apos;t ask again on every page. It never
                leaves your device.
              </li>
              <li>
                <strong>Context for the animated assistant.</strong>{" "}
                The robots
                on our homepage tailor their small talk to your visit. To do
                that, your browser sends a handful of coarse, non-identifying
                details: your local time and weekday, roughly how you arrived
                (search, social, a link, or directly, never the actual page you
                came from), whether you&apos;ve asked your system to reduce
                motion, how long you&apos;ve been on the page, and which section
                you&apos;re viewing. We don&apos;t store these details or tie
                them to you.
              </li>
              <li>
                <strong>Emails you send us.</strong>{" "}
                If you write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, we keep
                your message and contact details so we can reply and follow up
                on your enquiry.
              </li>
              <li>
                <strong>Standard server logs.</strong>{" "}
                Like any website, our
                hosting provider may briefly log technical data such as IP
                address, browser type, and the pages requested, to keep the
                site secure and running.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Cookies</h2>
            <p>
              The site works without any optional cookies. Our banner lets you
              choose separately whether to allow analytics cookies (to
              understand how the site is used) and marketing cookies (to measure
              our campaigns). If we add tools in either category, they will only
              run once you&apos;ve opted in. You can change your mind by
              clearing this site&apos;s data in your browser, and the banner
              will ask you again.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Who we share it with</h2>
            <p>
              We don&apos;t sell or rent personal information. We share data
              only with the service providers that run this site: our hosting
              provider, and the AI provider that writes the homepage
              assistant&apos;s lines from the context described above. We may
              also disclose information when the law requires it.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Your rights</h2>
            <p>
              Depending on where you live, you may have the right to access,
              correct, delete, or restrict the use of personal information we
              hold about you, and to object to how we use it. To make a request,
              email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
              we&apos;ll respond within 30 days.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Changes to this policy</h2>
            <p>
              If we change what we collect, we&apos;ll update this page and the
              date at the top. If the change affects cookies, the banner will
              ask for your consent again.
            </p>
          </section>
        </article>
      </main>

      <footer className={home.footer}>
        <div className={home.footerInner}>
          <div className={home.footerBrand}>
            <Image
              src="/sablebrain-wordmark.png"
              alt="Sable Brain"
              width={114}
              height={21}
            />
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className={home.footerEmail}>
            {CONTACT_EMAIL}
          </a>
          <p className={home.footerLegal}>
            © {new Date().getFullYear()} Sable Brain. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
