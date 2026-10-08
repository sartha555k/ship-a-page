const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { readJsonObject, inputText } = require('../.test-build/lib/server/request.js');
const { ApiError, errorResponse } = require('../.test-build/lib/server/errors.js');
const { limits } = require('../.test-build/lib/server/config.js');
const { generateExperimentText } = require('../.test-build/lib/server/ai.js');
const { reserveRequest } = require('../.test-build/lib/server/quota.js');
const { getSupabaseAdmin } = require('../.test-build/lib/server/supabase.js');
const originalEnv = { ...process.env };
const originalFetch = global.fetch;
after(() => { process.env = originalEnv; global.fetch = originalFetch; });
const req = body => new Request('https://example.test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('rejects malformed JSON, arrays and streaming bodies that exceed the byte cap', async () => {
  await assert.rejects(readJsonObject(req('{')), { status: 400 });
  await assert.rejects(readJsonObject(req('[]')), { status: 400 });
  await assert.rejects(readJsonObject(req(JSON.stringify({ text: 'x'.repeat(40) })), 20), { status: 413 });
  assert.deepEqual(await readJsonObject(req('{"text":"hello"}')), { text: 'hello' });
  assert.throws(() => inputText('abcdef', 5), { status: 413 });
});
test('invalid limits do not silently enable unbounded requests', () => {
  process.env.API_DAILY_REQUEST_LIMIT = '-1';
  assert.throws(limits, { status: 503 });
  delete process.env.API_DAILY_REQUEST_LIMIT;
});
test('error responses do not leak exception details or provider secrets', async () => {
  const response = errorResponse(new Error('private token from provider'));
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes('private token'), false);
  const limited = errorResponse(new ApiError(429, 'USAGE_LIMIT', 'Try later.', 60));
  assert.equal(limited.headers.get('retry-after'), '60');
});
test('AI is disabled without any outbound request by default', async () => {
  delete process.env.AI_ENABLED;
  global.fetch = () => { throw new Error('Must not call a provider'); };
  await assert.rejects(generateExperimentText(req('{}'), 'test', 'Instruction', 'Hello'), { code: 'FEATURE_DISABLED' });
});
test('quota rejects spoofed generic forwarding headers; database failure and denial block the provider', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'test-only-placeholder-not-a-real-key';
  process.env.RATE_LIMIT_HASH_SECRET = 'test-only-placeholder-at-least-32-characters';
  process.env.VERCEL = '1';
  process.env.AI_ENABLED = 'true';
  process.env.AI_GATEWAY_MODEL = 'test/model';
  process.env.AI_GATEWAY_API_KEY = 'test-only-placeholder-not-a-real-key';
  await assert.rejects(reserveRequest(new Request('https://example.test', { headers: { 'x-forwarded-for': '1.2.3.4' } }), 'test'), { code: 'CLIENT_UNAVAILABLE' });
  const client = getSupabaseAdmin();
  const request = new Request('https://example.test', { headers: { 'x-vercel-forwarded-for': '1.2.3.4' } });
  const originalRpc = client.rpc;
  try {
    client.rpc = async () => ({ error: { message: 'private database error' }, data: null });
    await assert.rejects(generateExperimentText(request, 'test', 'Instruction', 'Hello'), { code: 'QUOTA_UNAVAILABLE' });
    client.rpc = async () => ({ error: null, data: { allowed: false, retry_after: 30 } });
    await assert.rejects(generateExperimentText(request, 'test', 'Instruction', 'Hello'), { status: 429 });
    let quotaArgs;
    client.rpc = async (_, args) => { quotaArgs = args; return { error: null, data: { allowed: true } }; };
    let sent;
    global.fetch = async (_, options) => { sent = JSON.parse(options.body); return Response.json({ choices: [{ message: { content: 'Result' } }] }); };
    assert.equal(await generateExperimentText(request, 'test', 'Instruction', 'Hello'), 'Result');
    assert.equal(sent.model, 'test/model');
    assert.equal(sent.max_completion_tokens, 512);
    assert.match(quotaArgs.p_client_hash, /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(quotaArgs).includes('1.2.3.4'), false);
  } finally { client.rpc = originalRpc; }
});
