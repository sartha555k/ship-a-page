import 'server-only';
import { requiredEnv, limits } from './config';
import { ApiError } from './errors';
import { inputText } from './request';
import { reserveRequest } from './quota';

// One server-chosen text model; visitors cannot override models, URLs or token limits.
// Each project supplies its own system instruction and validated input. No public proxy.
export async function generateExperimentText(request: Request, experiment: string, system: string, input: string): Promise<string> {
  if (process.env.AI_ENABLED !== 'true') throw new ApiError(503, 'FEATURE_DISABLED', 'This experiment is not available yet.');
  const model = requiredEnv('AI_GATEWAY_MODEL');
  if (!/^[a-z0-9-]+\/[a-zA-Z0-9._:/-]+$/.test(model)) throw new ApiError(503, 'INVALID_CONFIGURATION', 'This experiment is temporarily unavailable.');
  const token = process.env.AI_GATEWAY_API_KEY?.trim() || requiredEnv('VERCEL_OIDC_TOKEN');
  const config = limits();
  const prompt = inputText(input, config.inputCharacters);
  await reserveRequest(request, experiment);
  let response: Response;
  try {
    response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(25000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_completion_tokens: config.outputTokens, stream: false }),
    });
  } catch { throw new ApiError(502, 'AI_UNAVAILABLE', 'The model is temporarily unavailable.'); }
  // Keep provider errors and credentials out of public responses and logs.
  if (!response.ok) throw new ApiError(502, 'AI_UNAVAILABLE', 'The model is temporarily unavailable.');
  try {
    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error();
    return text;
  } catch { throw new ApiError(502, 'AI_UNAVAILABLE', 'The model returned an unexpected response.'); }
}
