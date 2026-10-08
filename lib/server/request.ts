import 'server-only';
import { ApiError } from './errors';

// Streaming read bounds the body even when Content-Length is absent or dishonest.
export async function readJsonObject(request: Request, maxBytes = 32768): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) {
    throw new ApiError(415, 'JSON_REQUIRED', 'Send a JSON request.');
  }
  const declared = Number(request.headers.get('content-length'));
  if (declared > maxBytes) throw new ApiError(413, 'INPUT_TOO_LARGE', 'The request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INVALID_INPUT', 'A JSON object is required.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, 'INPUT_TOO_LARGE', 'The request is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(body)); }
  catch { throw new ApiError(400, 'INVALID_JSON', 'The request contains invalid JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ApiError(400, 'INVALID_INPUT', 'A JSON object is required.');
  return parsed as Record<string, unknown>;
}

export function inputText(value: unknown, maxCharacters: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, 'INVALID_INPUT', 'Please enter some text.');
  if (value.length > maxCharacters) throw new ApiError(413, 'INPUT_TOO_LARGE', `Use at most ${maxCharacters} characters.`);
  return value.trim();
}
