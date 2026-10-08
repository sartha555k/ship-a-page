import Image from 'next/image';
import { ArrowDown, ArrowUpRight, Code2, MoveUpRight, Sparkle } from 'lucide-react';
import { SiteHeader } from '../components/site-header';
import { BuildLog } from '../components/build-log';
import { Workbench } from '../components/workbench';
import { Reveal } from '../components/reveal';

const repository = 'https://github.com/sartha555k/ship-a-page';
const portfolio = 'https://sarthakportfolio-one.vercel.app/';

export default function Home() {
  return (
    <main id="top">
      <SiteHeader />
      <section className="container hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="dot" /> SARTHAK PATEL / BUILDING IN PUBLIC</p>
          <h1 id="hero-title">New tech<br />drops.<br />I <span className="highlight">build with it.</span></h1>
          <p className="intro">Hey, I’m Sarthak. A new model, a strange API, an idea I can’t leave alone. I turn them into small things you can actually try.</p>
          <div className="actions">
            <a className="button" href="#builds">See what I’m building <ArrowDown size={17} /></a>
            <a className="text-link" href={repository} target="_blank" rel="noreferrer"><Code2 size={17} /> Follow the code <ArrowUpRight size={14} /></a>
          </div>
          <p className="hero-footnote"><span className="hand-arrow" aria-hidden="true">↳</span> One repo. A new page for every experiment.</p>
        </div>
        <div className="portrait-stage">
          <div className="portrait-frame">
            <Image src="/sarthak-studio.webp" alt="A newly generated studio portrait of Sarthak Patel, seated casually with his hands clasped" width={1000} height={1250} sizes="(max-width: 760px) 90vw, 42vw" preload className="portrait" />
            <span className="portrait-caption">SARTHAK PATEL <ArrowUpRight size={14} /></span>
          </div>
          <span className="sticker sticker-top"><span className="lime-check">✓</span> Too many tabs open</span>
          <span className="sticker sticker-bottom"><Sparkle size={18} /> Let’s see if this works.</span>
          <span className="portrait-scribble" aria-hidden="true">✳</span>
          <span className="portrait-note">the person behind the pages</span>
        </div>
      </section>

      <div className="ticker" aria-label="Built with Next.js, TypeScript, models, APIs, and curiosity">
        <div className="container ticker-inner"><span>THE CURRENT TOOLBOX</span><div>Next.js <b>✳</b> TypeScript <b>✳</b> Models + APIs <b>✳</b> A little curiosity</div></div>
      </div>

      <section id="builds" className="container section">
        <Reveal><div className="section-heading">
          <div><p className="eyebrow">01 / THE BUILD LOG</p><h2>Here’s what<br /><span className="underline-lime">made it out of my tabs.</span></h2></div>
          <p>Working pages, source code, and a few notes.<br />The collection starts here.</p>
        </div></Reveal>
        <BuildLog />
      </section>

      <section id="routine" className="routine section">
        <div className="container">
          <Reveal><div className="section-heading">
            <div><p className="eyebrow">02 / FROM “WHAT IF” TO A URL</p><h2>The internet moves fast.<br />Let’s <span className="highlight">keep up.</span></h2></div>
            <p>I follow the launches, dig through what people<br />are making, and pick something worth a shot.</p>
          </div></Reveal>
          <Workbench />
        </div>
      </section>

      <section id="about" className="container section about">
        <Reveal className="about-heading"><p className="eyebrow">03 / A NOTE FROM ME</p><h2>I’d rather<br />try the thing.</h2><Sparkle className="about-star" size={70} strokeWidth={1} aria-hidden="true" /></Reveal>
        <Reveal className="about-copy">
          <p className="large-copy">Reading the launch post is easy.<br />Finding out what it can do is the fun part.</p>
          <p>This is my place to do that. Small builds with new models, tools, and ideas — all in one growing project. Some will be useful. Some will be weird. I’ll share what worked and what didn’t.</p>
          <p>A page earns its spot here when there’s something to click, test, or play with.</p>
          <a className="text-link" href={portfolio} target="_blank" rel="noreferrer">More about me <ArrowUpRight size={18} /></a>
        </Reveal>
      </section>

      <Reveal className="container closing">
        <span className="eyebrow">SEND ME DOWN A RABBIT HOLE</span>
        <h2>Got a <span className="highlight">weird idea?</span><br />I’m listening.</h2>
        <a className="button" href={`${repository}/issues/new`} target="_blank" rel="noreferrer">Drop it on GitHub <MoveUpRight size={18} /></a>
        <p>A tool you want tested. A problem nobody seems to fix.<br />Something that probably shouldn’t work, but might.</p>
      </Reveal>
      <footer className="container">
        <a className="wordmark" href="#top">sarthak<span>_</span>ships</a>
        <span>Made by Sarthak. Still figuring things out.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
