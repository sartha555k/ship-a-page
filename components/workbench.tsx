'use client';

import { useState } from 'react';
import { ArrowUpRight, Search, Code2, MousePointer2 } from 'lucide-react';

const steps = [
  { label: 'Dig around', time: '07:00 + 17:00 IST', title: 'Find the interesting bit.', text: 'Launch posts, demos, GitHub, X, Reddit. What changed? What are people actually doing with it?', Icon: Search, lines: ['read the launch', 'try the demo', 'check what already exists'], note: 'Start with a source. Follow the rabbit hole.' },
  { label: 'Pick & build', time: 'ONE IDEA AT A TIME', title: 'Choose something worth making.', text: 'Five ideas in the evening. I pick one, then build a focused page around it. The idea comes before the stack.', Icon: Code2, lines: ['five ideas → one pick', 'one focused interaction', 'a separate pull request'], note: 'Small enough to finish. Interesting enough to try.' },
  { label: 'Put it out', time: 'WHEN IT WORKS', title: 'Give it a URL.', text: 'Test it, add it to the log, and share the result. Include the rough edges and the code so you can see how it works.', Icon: MousePointer2, lines: ['test the actual flow', 'add the page to the log', 'share what worked + what didn’t'], note: 'The output is something you can open.' },
];

export function Workbench() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return <div className="workbench">
    <div className="workbench-controls" role="tablist" aria-label="The building routine">{steps.map((item, index) => <button role="tab" id={`routine-tab-${index}`} aria-controls="routine-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} key={item.label} onClick={() => setActive(index)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % steps.length : event.key === 'ArrowLeft' ? (index + steps.length - 1) % steps.length : event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : null;
      if (next !== null) { event.preventDefault(); setActive(next); document.getElementById(`routine-tab-${next}`)?.focus(); }
    }}><span>0{index + 1}</span>{item.label}<ArrowUpRight size={17} /></button>)}</div>
    <div id="routine-panel" role="tabpanel" aria-labelledby={`routine-tab-${active}`} className="workbench-panel" tabIndex={0}>
      <div className="workbench-copy"><span className="eyebrow">{step.time}</span><step.Icon size={28} /><h3>{step.title}</h3><p>{step.text}</p></div>
      <div className="note-card"><div className="note-top"><span className="dot" /> THE PLAN, NOT A LIVE FEED</div><div className="note-lines">{step.lines.map((line, index) => <div key={line}><span>0{index + 1}</span>{line}<span>↗</span></div>)}</div><p>{step.note}</p></div>
    </div>
  </div>;
}
