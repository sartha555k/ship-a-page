'use client';

import { useState } from 'react';
import { ArrowRight, Plus, FlaskConical } from 'lucide-react';
import { builds } from '../data/builds';
import { BuildCard } from './build-card';

const filters = ['All builds', 'AI + agents', 'Interfaces', 'Experiments'];

export function BuildLog() {
  const [filter, setFilter] = useState('All builds');
  const filtered = builds.filter(build => filter === 'All builds' || build.category === filter);
  return (
    <>
      <div className="build-toolbar">
        <div className="filters" aria-label="Filter builds">{filters.map(item => (
          <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}{item === 'All builds' && <span>{builds.length}</span>}</button>
        ))}</div>
        <span className="eyebrow">JUST GETTING STARTED ↗</span>
      </div>
      <div className="build-grid" aria-live="polite">
        {filtered.map(build => <BuildCard key={build.id} build={build} />)}
        {filtered.length === 0 ? (
          <div className="empty-state"><FlaskConical size={32} /><h3>No builds here yet.</h3><p>The first {filter.toLowerCase()} page will show up after it’s built.</p><button className="text-link" onClick={() => setFilter('All builds')}>Back to all builds <ArrowRight size={16} /></button></div>
        ) : filter === 'All builds' && (
          <article className="next-build"><div className="next-top"><span className="eyebrow">NEXT UP / 001</span><Plus size={24} /></div><div><span className="next-asterisk" aria-hidden="true">✳</span><h3>This spot is<br />for the next rabbit hole.</h3><p>No sneak peek yet. The first experiment goes here once there’s something you can try.</p></div><span className="next-status"><span className="dot" /> IDEA NOT PICKED YET</span></article>
        )}
      </div>
    </>
  );
}
