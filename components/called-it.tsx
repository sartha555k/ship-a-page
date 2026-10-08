'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock3, Copy, Download, LockKeyhole, Plus, RefreshCw, X } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { browserClient } from '../lib/supabase/browser';
import { validateDraft } from '../lib/called-it/validation';
import type { Draft, Prediction, Response, Session } from '../lib/called-it/types';
const blank: Draft = { claim: '', reasoning: '', criteria: '', source_url: '', deadline: '' };
const base = '/experiments/called-it';
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
function status(p: Prediction) { return p.status === 'called' ? 'Called it' : p.status === 'missed' ? 'Missed it' : p.status === 'unresolved' ? 'Unresolved' : new Date(p.deadline).getTime() <= Date.now() ? 'Awaiting review' : 'On record'; }
function timing(p: Prediction) { const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000); return p.status !== 'open' ? 'Resolved ' + date(p.resolved_at!) : days <= 0 ? 'Deadline passed' : days === 1 ? 'Less than a day left' : `${days} days left`; }
function Author({ p }: { p: Prediction }) { return <div className="ci-author"><span className="ci-avatar" aria-hidden="true">{(p.author?.display_name || '?').slice(0, 1).toUpperCase()}</span><span>{p.author?.display_name || 'Member'}<small>{p.author?.handle ? '@' + p.author.handle : p.example ? 'Illustrative prediction' : 'Called It member'}</small></span></div>; }
async function send(path: string, body?: unknown) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.'); return data;
}
function receiptLines(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (context.measureText(next).width <= width) { line = next; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const character of word) {
      if (context.measureText(line + character).width > width && line) { lines.push(line); line = ''; }
      line += character;
    }
  }
  if (line) lines.push(line); return lines;
}
async function downloadReceipt(p: Prediction) {
  const canvas = document.createElement('canvas'); canvas.width = 1200;
  const c = canvas.getContext('2d'); if (!c) throw new Error('Receipt downloads are unavailable in this browser.');
  c.font = 'bold 43px Arial'; const claim = receiptLines(c, p.claim, 1010);
  c.font = '21px Arial'; const criteria = receiptLines(c, 'Resolution: ' + p.criteria, 1010);
  c.font = '19px Arial'; const outcome = p.resolution_note ? receiptLines(c, p.resolution_note, 1010) : [];
  const contentEnd = 330 + claim.length * 55 + 32 + criteria.length * 29 + (outcome.length ? 25 + outcome.length * 27 : 0);
  canvas.height = Math.max(900, contentEnd + 195);
  c.fillStyle = '#faf8f4'; c.fillRect(0, 0, 1200, canvas.height);
  c.strokeStyle = '#171816'; c.lineWidth = 2; c.strokeRect(40, 40, 1120, canvas.height - 80);
  c.fillStyle = '#171816'; c.font = 'bold 44px Arial'; c.fillText('called it.', 85, 120);
  c.font = '18px monospace'; c.fillText(p.example ? 'EXAMPLE RECEIPT / NOT A REAL PREDICTION' : 'THE ORIGINAL CALL / ON RECORD', 85, 165);
  c.fillStyle = '#ccf647'; c.fillRect(85, 215, 245, 46); c.fillStyle = '#171816'; c.font = 'bold 19px monospace'; c.fillText(status(p).toUpperCase(), 100, 245);
  let y = 330; c.font = 'bold 43px Arial'; for (const line of claim) { c.fillText(line, 85, y); y += 55; }
  y += 32; c.font = '21px Arial'; for (const line of criteria) { c.fillText(line, 85, y); y += 29; }
  y += 25; c.font = '19px Arial'; for (const line of outcome) { c.fillText(line, 85, y); y += 27; }
  c.font = '18px monospace'; c.fillText(`${(p.author?.display_name || 'Member').slice(0, 60)} · Recorded ${date(p.created_at)}`, 85, canvas.height - 130);
  c.fillText(`Deadline ${new Date(p.deadline).toISOString().slice(0, 16).replace('T', ' ')} UTC`, 85, canvas.height - 95);
  c.fillText('sarthak_ships / called it.', 85, canvas.height - 62);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')); if (!blob) throw new Error('Could not create your receipt.');
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `called-it-${p.id}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CalledIt({ predictions, configured, unavailable, detail, responses = [] }: { predictions: Prediction[]; configured: boolean; unavailable: boolean; detail?: Prediction; responses?: Response[] }) {
  const router = useRouter();
  const [session, setSession] = useState<Session>({ configured, profile: null, admin: false });
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [filter, setFilter] = useState('All calls'); const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false); const [step, setStep] = useState(1); const [draft, setDraft] = useState<Draft>(blank);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [formError, setFormError] = useState('');
  const [stance, setStance] = useState<'back' | 'challenge'>('back'); const [argument, setArgument] = useState('');
  const [resolution, setResolution] = useState('called'); const [resolutionNote, setResolutionNote] = useState(''); const [evidence, setEvidence] = useState('');
  useEffect(() => {
    let alive = true;
    fetch('/api/called-it/session', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (alive) setSession(data); }).catch(() => { if (alive) setNotice('Your session could not be loaded. Refresh to try again.'); }).finally(() => { if (alive) setSessionLoaded(true); });
    try { const saved = sessionStorage.getItem('called-it-draft'); if (saved) { const parsed = JSON.parse(saved); if (['claim','reasoning','criteria','source_url','deadline'].every(k => typeof parsed?.[k] === 'string')) { setDraft(parsed); setOpen(true); } sessionStorage.removeItem('called-it-draft'); } } catch { /* ignore invalid saved drafts */ }
    if (new URLSearchParams(location.search).get('auth') === 'failed') setNotice('X sign-in didn’t finish. Please try again.');
    return () => { alive = false; };
  }, []);
  async function login() {
    if (!configured) { setNotice('Accounts are opening soon. You can explore the example receipts meanwhile.'); return; }
    setBusy(true); setFormError('');
    try {
      if (open) sessionStorage.setItem('called-it-draft', JSON.stringify(draft));
      const next = detail ? `${base}/${detail.id}` : base;
      const { error } = await browserClient().auth.signInWithOAuth({ provider: 'x', options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) throw error;
    } catch { setNotice('Could not connect to X. Please try again.'); setBusy(false); }
  }
  async function action(fn: () => Promise<void>) { setBusy(true); setNotice(''); try { await fn(); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); } }
  function review() { try { const parsed = validateDraft({ ...draft, deadline: draft.deadline ? new Date(draft.deadline).toISOString() : '' }); setDraft({ ...draft, claim: parsed.claim, reasoning: parsed.reasoning, criteria: parsed.criteria, source_url: parsed.source_url }); setFormError(''); setStep(2); } catch (e) { setFormError((e as Error).message); } }
  async function publish() {
    setBusy(true); setFormError('');
    try {
      if (!session.profile) { await login(); return; }
      const data = await send('/api/called-it/predictions', { ...draft, deadline: new Date(draft.deadline).toISOString() });
      setOpen(false); setDraft(blank); setStep(1); router.push(`${base}/${data.id}`); router.refresh();
    } catch (e) { setFormError((e as Error).message); } finally { setBusy(false); }
  }
  const selected = predictions.filter(p => {
    if (filter === 'My calls' && p.author_id !== session.profile?.id) return false;
    if (filter === 'Resolved' && p.status === 'open') return false;
    if (filter === 'Closing soon' && (p.status !== 'open' || new Date(p.deadline).getTime() <= Date.now())) return false;
    return (p.claim + ' ' + p.author?.display_name).toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => filter === 'Closing soon' ? +new Date(a.deadline) - +new Date(b.deadline) : +new Date(b.created_at) - +new Date(a.created_at));
  const alreadyResponded = responses.some(r => r.user_id === session.profile?.id);
  const canRespond = detail && !detail.example && detail.status === 'open' && +new Date(detail.deadline) > Date.now() && detail.author_id !== session.profile?.id && !alreadyResponded;
  return <main className="ci-app">
    <header className="ci-header"><div className="ci-container ci-nav"><Link className="ci-parent" href="/"><ArrowLeft size={15} /> sarthak<span>_</span>ships</Link><div className="ci-nav-actions"><ThemeToggle />{session.profile ? <><span className="ci-member">{session.profile.display_name}</span><button className="ci-text-button" disabled={busy} onClick={() => action(async () => { await send('/api/called-it/signout'); setSession({ configured, profile: null, admin: false }); router.refresh(); })}>Sign out</button></> : <button className="ci-signin" disabled={busy || !sessionLoaded} onClick={login}><span aria-hidden="true">𝕏</span> Sign in</button>}</div></div></header>
    <div className="ci-container">
      <div className="ci-brand-row"><Link href={base} className="ci-wordmark">called it<span>.</span></Link><span className="ci-edition">001 / THE PREDICTION RECORD</span></div>
      {notice && <div className="ci-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
      {!configured && <div className="ci-preview-note"><span className="dot" /><span><strong>Preview collection.</strong> These are illustrative calls, not real predictions. Accounts open once sign-in is connected.</span></div>}
      {unavailable ? <div className="ci-empty"><RefreshCw size={32} /><h1>The record is temporarily unavailable.</h1><p>Please try again in a moment. Your calls haven’t been replaced with examples.</p><button className="ci-primary" onClick={() => router.refresh()}>Try again</button></div> : detail ? <>
        <Link className="ci-back" href={base}><ArrowLeft size={15} /> All calls</Link>
        <article className="ci-detail">
          <div className="ci-card-top"><span className={`ci-status ci-status-${detail.status}`}><span className="dot" />{status(detail)}</span><span className="ci-record-id">{detail.example ? 'EXAMPLE' : '#' + detail.id.slice(0, 8)}</span></div>
          <h1>{detail.claim}</h1><Author p={detail} />
          <div className="ci-record-dates"><span><LockKeyhole size={14} /> Recorded {date(detail.created_at)}</span><span><Clock3 size={14} /> Deadline {new Date(detail.deadline).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC</span></div>
          <div className="ci-detail-block"><h2>The reasoning</h2><p>{detail.reasoning}</p></div>
          <div className="ci-criteria"><span className="eyebrow">HOW THIS GETS RESOLVED</span><p>{detail.criteria}</p><a href={detail.source_url} target="_blank" rel="noreferrer">View agreed evidence source <ArrowUpRight size={14} /></a></div>
          {detail.status !== 'open' && <div className={`ci-resolution ci-status-${detail.status}`}><span className="eyebrow">THE FOLLOW-UP RECEIPT</span><h2>{status(detail)}.</h2><p>{detail.resolution_note}</p>{detail.evidence_url && <a href={detail.evidence_url} target="_blank" rel="noreferrer">Read the resolution evidence <ArrowUpRight size={14} /></a>}</div>}
          <div className="ci-share"><button className="ci-secondary" onClick={() => action(async () => { await navigator.clipboard.writeText(location.href); setNotice('Link copied.'); })}><Copy size={15} /> Copy link</button><button className="ci-secondary" onClick={() => action(() => downloadReceipt(detail))}><Download size={15} /> Download receipt</button></div>
        </article>
        <section className="ci-discussion" aria-labelledby="discussion-title"><div className="ci-discussion-title"><h2 id="discussion-title">The other side of the call.</h2><span>{detail.back_count} back · {detail.challenge_count} challenge</span></div>
          {detail.example ? <p className="ci-muted">Example calls don’t accept responses. Your published calls will.</p> : canRespond ? session.profile ? <form className="ci-response-form" onSubmit={e => { e.preventDefault(); action(async () => { await send(`/api/called-it/predictions/${detail.id}/responses`, { stance, argument }); setArgument(''); setNotice('Your response is on record.'); router.refresh(); }); }}><div className="ci-choice"><button type="button" aria-pressed={stance === 'back'} onClick={() => setStance('back')}>I back this <Check size={15} /></button><button type="button" aria-pressed={stance === 'challenge'} onClick={() => setStance('challenge')}>I challenge this <ArrowUpRight size={15} /></button></div><label htmlFor="argument">Why do you think so?</label><textarea id="argument" value={argument} onChange={e => setArgument(e.target.value)} minLength={10} maxLength={1200} required placeholder="Add an argument people can respond to." /><button className="ci-primary" disabled={busy}>{busy ? 'Saving…' : 'Put my response on record'} <ArrowRight size={16} /></button></form> : <button className="ci-secondary" onClick={login}>Sign in with X to take a side <ArrowRight size={15} /></button> : <p className="ci-muted">{alreadyResponded ? 'Your response is recorded below.' : detail.author_id === session.profile?.id ? 'This is your call. Other members can back or challenge it.' : 'Responses are locked after the deadline.'}</p>}
          {responses.map(r => <article className="ci-response" key={r.id}><div><strong>{r.author?.display_name || 'Member'}</strong><span>{r.stance === 'back' ? 'Backs this call' : 'Challenges this call'}</span></div><p>{r.argument}</p><small>{date(r.created_at)}</small></article>)}
          {!responses.length && !detail.example && <p className="ci-muted">No responses yet. Share the receipt to invite another perspective.</p>}
        </section>
        {session.admin && !detail.example && detail.status === 'open' && +new Date(detail.deadline) <= Date.now() && <form className="ci-admin ci-response-form" onSubmit={e => { e.preventDefault(); action(async () => { await send(`/api/called-it/predictions/${detail.id}/resolve`, { status: resolution, resolution_note: resolutionNote, evidence_url: evidence }); router.refresh(); }); }}><h2>Review this outcome</h2><label htmlFor="outcome">Outcome</label><select id="outcome" value={resolution} onChange={e => setResolution(e.target.value)}><option value="called">Called it</option><option value="missed">Missed it</option><option value="unresolved">Unresolved</option></select><label htmlFor="resolution">Explain the evidence</label><textarea id="resolution" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} required minLength={20} maxLength={2000} /><label htmlFor="evidence">Evidence URL</label><input id="evidence" type="url" value={evidence} onChange={e => setEvidence(e.target.value)} required /><button className="ci-primary" disabled={busy}>Publish resolution</button></form>}
      </> : <>
        <section className="ci-hero"><div><p className="eyebrow"><span className="dot" /> MAKE THE CALL. KEEP THE RECEIPT.</p><h1>Think you know<br />what <span className="highlight">happens next?</span></h1><p className="ci-lede">A prediction. A deadline. A record you can return to<br className="ci-desktop-break" /> when the dust settles.</p><button className="ci-primary" onClick={() => { setOpen(true); setStep(1); setFormError(''); }}>Make a call <Plus size={18} /></button><p className="ci-fine"><LockKeyhole size={13} /> Original words stay on record.</p></div><div className="ci-hero-art" aria-hidden="true"><div className="ci-art-orbit" /><span className="ci-art-label">THE ORIGINAL / UNDER LOCK</span><Image className="ci-vault-image" src="/called-it-vault.webp" alt="" width={960} height={960} sizes="(max-width: 760px) 90vw, 480px" priority /><span className="ci-art-chip ci-art-chip-lock"><LockKeyhole size={13} /> Words locked.</span><span className="ci-art-chip ci-art-chip-time"><Clock3 size={13} /> Deadline set.</span><div className="ci-art-caption"><span className="dot" /> SAY IT NOW. CHECK IT LATER.</div></div></section>
        <section className="ci-feed" aria-labelledby="feed-title"><div className="ci-feed-heading"><h2 id="feed-title">The record<span>.</span></h2><span className="eyebrow">{configured ? 'PUBLIC CALLS' : 'EXAMPLE RECEIPTS'} / {predictions.length.toString().padStart(2, '0')}</span></div><div className="ci-toolbar"><div className="ci-filters">{['All calls', 'Closing soon', 'Resolved', ...(session.profile ? ['My calls'] : [])].map(f => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div><input type="search" aria-label="Search predictions" placeholder="Find a call…" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="ci-grid">{selected.map(p => <article className="ci-card" key={p.id}><div className="ci-card-top"><span className={`ci-status ci-status-${p.status}`}><span className="dot" />{status(p)}</span><span className="ci-record-id">{p.example ? 'EXAMPLE' : '#' + p.id.slice(0, 8)}</span></div><h3><Link href={`${base}/${p.id}`}>{p.claim}</Link></h3><Author p={p} /><div className="ci-card-criteria"><LockKeyhole size={13} /><span>{p.criteria}</span></div><div className="ci-card-bottom"><span><Clock3 size={13} /> {timing(p)}</span><Link href={`${base}/${p.id}`}>Open receipt <ArrowUpRight size={16} /></Link></div></article>)}</div>{!selected.length && <div className="ci-empty"><h3>{search ? 'No calls match that search.' : filter === 'All calls' ? 'The first call could be yours.' : 'No calls here yet.'}</h3><p>{search ? 'Try a different phrase or clear your search.' : 'Put a measurable prediction on record and invite another perspective.'}</p><button className="ci-secondary" onClick={() => { setSearch(''); setFilter('All calls'); if (!predictions.length) setOpen(true); }}>{predictions.length ? 'Show all calls' : 'Make the first call'} <ArrowRight size={15} /></button></div>}</section>
      </>}
      <footer className="ci-footer"><span>Words on record. Outcomes with evidence.</span><div><Link href="/">Built by Sarthak ↗</Link><Link href={`${base}/privacy`}>Privacy</Link><Link href={`${base}/terms`}>Terms</Link></div></footer>
    </div>
    <Dialog.Root open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Popup className="ci-dialog"><Dialog.Close className="dialog-close" aria-label="Close prediction form"><X size={20} /></Dialog.Close><p className="eyebrow">{step === 1 ? '01 / MAKE THE CALL' : '02 / CHECK THE RECEIPT'}</p><Dialog.Title>{step === 1 ? 'What’s your call?' : 'Ready to stand by it?'}</Dialog.Title><Dialog.Description>{step === 1 ? 'Be specific enough that someone else can check the outcome.' : 'Publishing locks your words, deadline and criteria. Read them once more.'}</Dialog.Description>
      {formError && <p className="ci-form-error" role="alert">{formError}</p>}
      {step === 1 ? <form className="ci-form" onSubmit={e => { e.preventDefault(); review(); }}><label htmlFor="claim">Your prediction <span>{draft.claim.length}/280</span></label><textarea id="claim" autoFocus value={draft.claim} onChange={e => setDraft({ ...draft, claim: e.target.value })} placeholder="I predict that…" minLength={15} maxLength={280} required /><label htmlFor="deadline">Deadline <span>Your local time</span></label><input id="deadline" type="datetime-local" value={draft.deadline} onChange={e => setDraft({ ...draft, deadline: e.target.value })} required /><label htmlFor="criteria">What counts as getting it right?</label><textarea id="criteria" value={draft.criteria} onChange={e => setDraft({ ...draft, criteria: e.target.value })} placeholder="The exact metric or event, and how it will be checked." minLength={20} maxLength={1000} required /><label htmlFor="source">Where can we check it?</label><input id="source" type="url" value={draft.source_url} onChange={e => setDraft({ ...draft, source_url: e.target.value })} placeholder="https://…" maxLength={2048} required /><label htmlFor="reasoning">Why do you think this will happen?</label><textarea id="reasoning" value={draft.reasoning} onChange={e => setDraft({ ...draft, reasoning: e.target.value })} placeholder="Give people a reason to back or challenge your call." minLength={20} maxLength={2000} required /><button className="ci-primary" type="submit">Review my call <ArrowRight size={16} /></button></form> : <div className="ci-review"><blockquote>{draft.claim}</blockquote><dl><dt>Deadline</dt><dd>{new Date(draft.deadline).toLocaleString()}</dd><dt>Resolution criteria</dt><dd>{draft.criteria}</dd><dt>Evidence source</dt><dd><a href={draft.source_url} target="_blank" rel="noreferrer">{new URL(draft.source_url).hostname} ↗</a></dd><dt>Your reasoning</dt><dd>{draft.reasoning}</dd></dl><p className="ci-fine"><LockKeyhole size={14} /> Public and permanent. No silent edits.</p><div className="ci-review-actions"><button className="ci-secondary" disabled={busy} onClick={() => setStep(1)}>Edit draft</button><button className="ci-primary" disabled={busy || !sessionLoaded || !configured} onClick={publish}>{busy ? 'Connecting…' : !configured ? 'Accounts opening soon' : session.profile ? 'Put it on record' : 'Sign in with X to publish'} <ArrowRight size={15} /></button></div></div>}
    </Dialog.Popup></Dialog.Portal></Dialog.Root>
  </main>;
}
