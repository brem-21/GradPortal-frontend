"use client";

import Link from "next/link";
import { CommunityGallery } from "./community-gallery";
import { MediaSlideshow, SlideIndicator } from "./media-slideshow";
import { SuccessStories } from "./success-stories";
import { SignInProvider, SignInTrigger, type SignInConfig } from "./signin-overlay";
import { Arrow, Hairline, NumberedRow, SectionLabel, Tag, TextArrowLink, cx } from "./ui";
import type { Asset, SlideSet } from "@/lib/media";
import type { Story } from "@/lib/site-content";

const FIELDS = [
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Data Engineering",
  "Data Analytics",
];

const WHAT_WE_DO = [
  { label: "Find", detail: "Admissions pages, scholarship boards and research listings, swept daily" },
  { label: "Filter", detail: "Only the five fields, only what is still open" },
  { label: "Reach", detail: "The named contact on each listing, emailed from your own address" },
  { label: "Review", detail: "Your CV and statements read against a real admissions rubric" },
  { label: "Ask", detail: "A voice or text assistant that answers from your own documents" },
  { label: "Learn", detail: "Mentors who have already made the move" },
];

/** Ghost pill that opens the sign-in overlay instead of navigating. */
function SignInPill({ tone = "paper" }: { tone?: "paper" | "ink" }) {
  return (
    <SignInTrigger
      className={cx(
        "group inline-flex items-center gap-2 rounded-button border px-4 py-[19px]",
        "text-[13px] font-normal leading-none transition-all duration-300",
        tone === "paper"
          ? "border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink"
          : "border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
      )}
    >
      Start your search
      <Arrow className="group-hover:translate-x-1" />
    </SignInTrigger>
  );
}


/** Landing nav bar. The wordmark and "Home" both return to the top. */
function LandingNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30">
      <div className="page-shell flex h-16 items-center justify-between gap-6">
        <a
          href="#top"
          aria-label="GradPortal home"
          className="text-[17px] font-light tracking-[-0.4px] text-paper transition-opacity hover:opacity-70"
        >
          GradPortal
        </a>
        <div className="hidden items-center gap-7 md:flex">
          <a href="#top" className="text-[13px] text-mist transition-colors hover:text-paper">
            Home
          </a>
          <a href="#how" className="text-[13px] text-mist transition-colors hover:text-paper">
            How it works
          </a>
          <a href="#community" className="text-[13px] text-mist transition-colors hover:text-paper">
            Community
          </a>
          <SignInTrigger className="group inline-flex items-center gap-2 text-[13px] text-paper transition-colors hover:text-ember">
            Sign in
            <Arrow className="group-hover:translate-x-1" />
          </SignInTrigger>
        </div>
        <SignInTrigger className="inline-flex h-8 items-center rounded-pill bg-paper px-4 text-[12px] font-medium text-ink transition-opacity hover:opacity-85 md:hidden">
          Sign in
        </SignInTrigger>
      </div>
    </nav>
  );
}

export interface LandingContent {
  hero: SlideSet;
  closing: SlideSet;
  mentorCard: SlideSet;
  footer: SlideSet;
  gallery: Asset[];
  stories: Story[];
}

export function LandingPage({
  signInConfig,
  content,
}: {
  signInConfig: SignInConfig;
  content: LandingContent;
}) {
  return (
    <SignInProvider callbackUrl="/overview" config={signInConfig}>
      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden">
          <MediaSlideshow set={content.hero} />
          <LandingNav />

          <div className="page-shell relative z-10 flex w-full items-start justify-between pt-24">
            <p className="animate-fade-up delay-1 prose-column max-w-[400px] text-[15px] leading-relaxed text-paper">
              Graduate programmes, scholarships, assistantships and research openings in
              computing and data — gathered from admissions offices and funding bodies,
              filtered to what is still open, and delivered with the name of the person
              to write to.
            </p>
          </div>

          <div className="page-shell relative z-10 w-full pb-10">
            <h1 className="wordmark animate-fade-up delay-2 text-paper">GradPortal</h1>
            <div className="animate-fade-up delay-3 mt-8 flex flex-wrap items-center gap-3">
              <SignInPill />
              <TextArrowLink href="#how" tone="paper">
                How it works
              </TextArrowLink>
            </div>
            <SlideIndicator
              count={content.hero.slides.length}
              interval={content.hero.interval}
              className="animate-fade-in delay-4 mt-10"
            />
          </div>
        </section>

        {/* ---------- Editorial ---------- */}
        <section className="page-shell py-20">
          <SectionLabel>Why this exists</SectionLabel>
          <h2 className="heading-lg prose-column">
            The opportunity is rarely the hard part. Finding it in time is.
          </h2>
          <p className="prose-column mt-8 font-serif text-[18px] leading-[1.5] text-ink">
            Funded places exist every year across computing and data. They sit on
            department pages nobody links to, on funding-body PDFs, on boards that close
            quietly. By the time a listing reaches you, the deadline has usually passed.
          </p>
          <p className="prose-column mt-5 text-[15px] leading-[1.5] text-pewter">
            GradPortal watches those pages so you do not have to, keeps only what falls
            inside your five fields, and tells you who to write to — then sends that
            email from your own address, so the reply comes back to your inbox.
          </p>
        </section>

        {/* ---------- Fields ---------- */}
        <section className="page-shell pb-20">
          <SectionLabel>Fields covered</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-2">
            {FIELDS.map((field) => (
              <Tag key={field}>{field}</Tag>
            ))}
          </div>
        </section>

        {/* ---------- What it does ---------- */}
        <section id="how" className="page-shell pb-20">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="heading prose-column mb-10">What the portal does</h2>
          <div>
            {WHAT_WE_DO.map((item, index) => (
              <NumberedRow
                key={item.label}
                index={index + 1}
                label={item.label}
                detail={item.detail}
              />
            ))}
            <Hairline />
          </div>
        </section>

        {/* ---------- Feature cards ---------- */}
        <section className="page-shell pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="flex min-h-[380px] flex-col justify-between rounded-card bg-mist p-6">
              <div>
                <SectionLabel>For applicants</SectionLabel>
                <h3 className="heading">Every listing carries a person, not just a link.</h3>
                <p className="prose-column mt-5 text-[15px] leading-[1.5] text-pewter">
                  Admissions officers, principal investigators, scholarship coordinators.
                  Draft the enquiry in the portal, send it from your own mailbox, and keep
                  the thread where it belongs.
                </p>
              </div>
              <div className="mt-8 flex items-end justify-between">
                <SignInTrigger className="group inline-flex items-center gap-2 text-[15px] text-ink transition-colors hover:text-ember">
                  <span className="border-b border-transparent pb-px group-hover:border-current">
                    Create an account
                  </span>
                  <Arrow className="group-hover:translate-x-1" />
                </SignInTrigger>
                <span className="text-[12px] font-light tracking-[-0.44px] text-ink/30">GP</span>
              </div>
            </article>

            <article className="relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-card p-6">
              <MediaSlideshow set={content.mentorCard} kenBurns={false} />
              <div className="relative z-10">
                <SectionLabel className="text-mist">For mentors</SectionLabel>
                <h3 className="heading text-paper">
                  You have already made the move. Someone is about to.
                </h3>
                <p className="prose-column mt-5 text-[15px] leading-[1.5] text-mist">
                  Post the openings you hear about, take mentorship requests from
                  applicants in your field, and answer the questions you once had.
                </p>
                <div className="mt-8">
                  <SignInTrigger className="group inline-flex items-center gap-2 text-[15px] text-paper transition-colors hover:text-ember">
                    <span className="border-b border-transparent pb-px group-hover:border-current">
                      Join as a mentor
                    </span>
                    <Arrow className="group-hover:translate-x-1" />
                  </SignInTrigger>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ---------- Community gallery + stories ---------- */}
        <div id="community" className="page-shell">
          <CommunityGallery
            photos={content.gallery}
            blurb="Campus life across the programmes and funding bodies this portal tracks."
          />
          <SuccessStories stories={content.stories} />
        </div>

        {/* ---------- Closing band ---------- */}
        <section className="relative mt-10 overflow-hidden">
          <MediaSlideshow set={content.closing} />
          <div className="page-shell relative z-10 py-24">
            <SectionLabel className="text-mist">Get started</SectionLabel>
            <h2 className="heading-lg prose-column text-paper">
              Sign in with Google or LinkedIn. Pick your fields. See what is open.
            </h2>
            <div className="mt-10">
              <SignInPill />
            </div>
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="relative overflow-hidden">
          <MediaSlideshow set={content.footer} kenBurns={false} />
          <div className="page-shell relative z-10 py-14">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <p className="text-[22px] font-light tracking-[-0.44px] text-paper">
                  GradPortal
                </p>
                <p className="mt-2 max-w-[420px] text-[12px] leading-relaxed text-mist/70">
                  Computer Science · Artificial Intelligence · Data Science · Data
                  Engineering · Data Analytics
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/signin"
                  className="text-[13px] text-mist transition-colors hover:text-paper"
                >
                  Sign in
                </Link>
                <a
                  href="#how"
                  className="text-[13px] text-mist transition-colors hover:text-paper"
                >
                  How it works
                </a>
              </div>
            </div>
            <div className="mt-10 border-t border-paper/10 pt-6">
              <p className="text-[12px] text-mist/60">
                Sources are credited on every listing. Always confirm deadlines and
                eligibility on the original page.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </SignInProvider>
  );
}
