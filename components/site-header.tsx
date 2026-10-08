'use client';

import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container navigation">
        <a className="wordmark" href="#top" onClick={() => setOpen(false)}>sarthak<span>_</span>ships</a>
        <nav id="primary-navigation" className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
          <a href="#builds" onClick={() => setOpen(false)}>The builds</a>
          <a href="#routine" onClick={() => setOpen(false)}>The routine</a>
          <a href="#about" onClick={() => setOpen(false)}>The person</a>
        </nav>
        <a className="nav-button" href="https://github.com/sartha555k/ship-a-page" target="_blank" rel="noreferrer">Open source <ArrowUpRight size={15} /></a>
        <button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
