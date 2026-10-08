'use client';

import { ArrowUpRight, Check, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import type { Build } from '../data/builds';

export function BuildCard({ build }: { build: Build }) {
  const foundation = build.id === '000';
  return (
    <article className="build-card">
      <div className={`build-preview ${foundation ? 'foundation-preview' : 'experiment-preview'}`} aria-hidden="true">
        {foundation ? <div className="preview-browser"><div className="preview-chrome"><span>● ● ●</span><span>sarthak_ships</span><ArrowUpRight size={12} /></div><div className="preview-content"><span>HEY, I’M SARTHAK.</span><strong>New tech drops.<br /><mark>I build with it.</mark></strong><div className="preview-line" /><span className="preview-badge">ONE REPO. MANY RABBIT HOLES.</span></div><span className="preview-star">✳</span></div> : <><span className="preview-build-number" style={build.id === '001' ? {fontSize: 52, letterSpacing: -3} : undefined}>{build.id === '001' ? 'called it.' : build.id}</span><span>{build.id === '001' ? 'MAKE THE CALL. KEEP THE RECEIPT.' : build.category}</span></>}
        <span className="preview-stamp">{foundation ? 'THE STARTING POINT' : 'OPEN THE PAGE'} ↗</span>
      </div>
      <div className="card-body">
        <div className="card-meta"><span>PAGE {build.id}</span><span><Check size={13} />{foundation ? 'Foundation' : 'Explore the page'}</span></div>
        <h3>{build.title}</h3><p>{build.description}</p>
        <div className="tags">{build.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        {foundation ? <Dialog.Root>
          <Dialog.Trigger className="details">What’s in this build <ArrowUpRight size={18} /></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="dialog-backdrop" />
            <Dialog.Popup className="dialog-popup">
              <Dialog.Close className="dialog-close" aria-label="Close build details"><X /></Dialog.Close>
              <p className="eyebrow">PAGE 000 / THE STARTING POINT</p>
              <Dialog.Title>The home for all of this.</Dialog.Title>
              <Dialog.Description>This page is the first build. The experiments will get their own routes inside the same Next.js project.</Dialog.Description>
              <ul><li><Check size={18} /> A personal homepage with a newly generated portrait.</li><li><Check size={18} /> A shared build log, filters, and reusable components.</li><li><Check size={18} /> Source code and a separate PR for each new project.</li></ul>
              <p>Called It is the first experiment. Every new build gets its own page in this log.</p>
              <a className="button" href="https://github.com/sartha555k/ship-a-page" target="_blank" rel="noreferrer">See the source <ArrowUpRight size={17} /></a>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root> : <a className="details" href={build.href}>Try the experiment <ArrowUpRight size={18} /></a>}
      </div>
    </article>
  );
}
