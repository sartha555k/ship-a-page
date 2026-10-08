import { NextResponse } from 'next/server';
import { backendConfigured, userClient } from '../supabase/server';
export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function authenticated(request: Request) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try { const parsed = new URL(origin || ''); sameOrigin = parsed.host === request.headers.get('host') && parsed.protocol === new URL(request.url).protocol; } catch {}
  if (!sameOrigin) throw new ApiError('Please submit from this website.', 403);
  if (!backendConfigured()) throw new ApiError('Accounts are not open yet. Please check back soon.', 503);
  const client = await userClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || user.is_anonymous || !user.identities?.some(i => i.provider === 'x')) throw new ApiError('Sign in with X to continue.', 401);
  return { client, user };
}
export async function readBody(request: Request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new ApiError('Submit a JSON request.', 415);
  const reader = request.body?.getReader(); if (!reader) throw new ApiError('Complete the form first.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 16000) { await reader.cancel(); throw new ApiError('This submission is too long.', 413); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ApiError('The submission could not be read.'); }
}
export function failure(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json({ error: 'Could not save that change. Please try again.' }, { status: 500 });
}
export function databaseError(error: { code?: string; message?: string }) {
  if (error.code === '23505') throw new ApiError('You have already responded to this call.', 409);
  if (error.message?.includes('daily limit')) throw new ApiError('You have reached today’s publishing limit. Try again tomorrow.', 429);
  if (error.message?.includes('closed')) throw new ApiError('This call has closed. Responses are now locked.', 409);
  if (error.code === '42501') throw new ApiError('You don’t have permission to make this change.', 403);
  throw new ApiError('Could not save that change. Please try again.', 500);
}
