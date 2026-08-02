import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

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
        <p className="eyebrow">Sample reading</p>
        <h1>Chapter One: Define the Win</h1>
        <p className="reader-lede">{settings.copy.chapterOneIntro}</p>

        <section>
          <h2>The cost of a blurry win</h2>
          <p>
            “Success” is too vague to drive action on a Tuesday afternoon. Grow the business. Get healthier. Be more consistent. Spend more time with family. These are good desires, but they do not tell you what to do next.
          </p>
          <p>
            When the win is undefined, almost any activity can pretend to be progress. You can answer messages, adjust colors, skim another article, polish an idea again, and still avoid the move that would actually create momentum.
          </p>
        </section>

        <section>
          <h2>Clarity removes the debate</h2>
          <p>
            Speed is not only about willpower. Speed is often the byproduct of knowing what matters before the pressure of the day starts speaking. When you define the win, your work stops looking like a flat list of equal tasks. The few actions that move the needle start standing out from the noise.
          </p>
          <p>
            That is where Power NOW begins: not with frantic motion, but with the kind of clarity that makes the next right move harder to ignore.
          </p>
        </section>

        <section>
          <h2>A practical prompt</h2>
          <p>
            Before you build the perfect plan, answer this: if today could only move one meaningful result forward, what result would deserve your now? Write it in one sentence. Then name the action that would prove you meant it.
          </p>
        </section>

        <div className="reader-cta">
          <div>
            <p className="eyebrow">Continue reading</p>
            <h2>Get the direct author edition.</h2>
            <p>{settings.copy.directEditionIntro}</p>
          </div>
          <CheckoutButton settings={settings} label="Buy the book" />
        </div>
      </article>
    </main>
  );
}
