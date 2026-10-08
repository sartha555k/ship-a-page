import type { Draft } from './types';
export function safeLink(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Add a valid public evidence URL.');
  let url: URL; try { url = new URL(value.trim()); } catch { throw new Error('Add a valid public evidence URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Evidence links must use https:// without credentials.');
  return url.href;
}
function text(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new Error(`${label} must be ${min}–${max} characters.`);
  return value.trim();
}
export function validateDraft(value: unknown, now = Date.now()): Draft {
  if (!value || typeof value !== 'object') throw new Error('Complete your prediction first.');
  const input = value as Record<string, unknown>;
  const deadline = typeof input.deadline === 'string' ? new Date(input.deadline).getTime() : NaN;
  if (!Number.isFinite(deadline) || deadline < now + 3600000 || deadline > now + 366 * 86400000) throw new Error('Choose a deadline between one hour and one year from now.');
  return { claim: text(input.claim, 'Your call', 15, 280), reasoning: text(input.reasoning, 'Your reasoning', 20, 2000), criteria: text(input.criteria, 'Resolution criteria', 20, 1000), source_url: safeLink(input.source_url), deadline: new Date(deadline).toISOString() };
}
export function validateResponse(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Choose a side and add your reasoning.');
  const input = value as Record<string, unknown>;
  if (input.stance !== 'back' && input.stance !== 'challenge') throw new Error('Choose back or challenge.');
  return { stance: input.stance as 'back' | 'challenge', argument: text(input.argument, 'Your argument', 10, 1200) };
}
export function validateResolution(value: unknown) {
  const input = value as Record<string, unknown> | null;
  if (!input || !['called', 'missed', 'unresolved'].includes(String(input.status))) throw new Error('Choose a resolution.');
  return { status: input.status as 'called' | 'missed' | 'unresolved', resolution_note: text(input.resolution_note, 'Resolution note', 20, 2000), evidence_url: safeLink(input.evidence_url) };
}
export function safeReturn(value: string | null): string {
  return value && /^\/experiments\/called-it(?:\/[a-zA-Z0-9-]+)?$/.test(value) ? value : '/experiments/called-it';
}
