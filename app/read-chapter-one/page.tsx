import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Read a sample: Define the Win | Clarity Creates Speed",
  description:
    "Read the opening of Chapter One, Define the Win, from Clarity Creates Speed by Jonathan R. Holman."
};

export default async function ReadChapterOnePage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="reading-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>{settings.brand.seriesName}</span>
          <small>{settings.product.title}</small>
        </Link>
        <Link href="/#buy" className="button button-secondary">
          Buy direct
        </Link>
      </header>

      <article className="reader-shell">
        <p className="eyebrow">From the book</p>
        <h1>Chapter One: Define the Win</h1>
        <p className="reader-lede">
          {settings.copy.chapterOneIntro}
        </p>

        <section>
          <p>
            I’d been in business for over a year and still had no
            idea what success looked like.
          </p>
          <p>That was the embarrassing part.</p>
          <p>
            The ironic part was that my business <em>was</em>{" "}
            about helping other people define and reach success in{" "}
            <em>their</em> ventures. On paper, I was a consultant.
            In reality, I was winging it with a nicer vocabulary.
          </p>
          <p>Underneath the surface, here’s what was true:</p>
          <ul>
            <li>
              I had started an unscalable, me-dependent business.
            </li>
            <li>
              Everything bottlenecked at me, with no clean path to
              offload responsibility.
            </li>
            <li>
              Every project felt like reinvention because the
              processes were not documented.
            </li>
            <li>
              I had no strategic plan or CRM and was responding to
              life instead of directing it.
            </li>
            <li>
              Roughly 75% of my revenue had come from one client.
            </li>
          </ul>
          <p>
            Those weren’t little quirks. They were giant blind
            spots—the kind so big they don’t just block your line
            of sight; they <em>are</em> your windshield.
          </p>
          <p>I couldn’t see the path ahead.</p>
          <p>
            At some point, a question surfaced that I had managed
            to dodge for over a year:
          </p>
          <blockquote>
            “What, exactly, are you trying to build?”
          </blockquote>
          <p>
            Not theoretically. Not eventually. Not someday when
            this all settles down. Right now, with the life I had,
            the skills I had, and the responsibilities I had: what
            was I actually trying to create?
          </p>
        </section>

        <section>
          <h2>Drift is a decision—just not a conscious one</h2>
          <p>
            This isn’t about pretending you can know the future in
            perfect detail. You can’t. Businesses pivot. Markets
            change. You grow, and your priorities shift.
          </p>
          <p>
            But when you never define success, you don’t actually
            stay neutral. You drift.
          </p>
          <ul>
            <li>Toward whoever shouts the loudest.</li>
            <li>Toward whoever pays the soonest.</li>
            <li>
              Toward whatever feels urgent instead of what is
              actually important.
            </li>
          </ul>
          <p>
            I had to admit that if I didn’t decide what winning
            looked like, I was authorizing everything around
            me—clients, bills, social media, random opportunities,
            and other people’s emergencies—to decide it for me.
          </p>
          <p>
            So I started doing something basic and uncomfortable:
            I answered the question.
          </p>
        </section>

        <section>
          <h2>Clarity comes as you write, not before</h2>
          <p>
            I didn’t wait until the whole thing was crystal clear
            in my head. If I had, I’d still be waiting.
          </p>
          <blockquote>
            It becomes clear as you write, not before you write.
          </blockquote>
          <p>
            Most people are waiting for the fully formed idea—the
            perfect vision, the perfect plan, the perfect mission
            statement—before they commit anything to paper. That
            is a long, miserable wait.
          </p>
          <p>
            Defining your win is active. It is something you do
            now, not something you wait on until you feel smart
            enough, ready enough, or successful enough to write
            it.
          </p>
        </section>

        <aside className="sample-note">
          <p className="eyebrow">Sample ends here</p>
          <p>
            The complete chapter continues with a practical
            framework for defining the work, business model,
            money, life, tradeoffs, and non-negotiables that make
            up a real win.
          </p>
        </aside>

        <div className="reader-cta">
          <div>
            <p className="eyebrow">Continue reading</p>
            <h2>Get the first Power NOW book.</h2>
            <p>{settings.copy.directEditionIntro}</p>
            <PriceBreakdown settings={settings} compact />
          </div>
          <CheckoutButton
            settings={settings}
            label="Buy the book"
          />
        </div>
      </article>
    </main>
  );
}
