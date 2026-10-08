import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { getSupabaseAdmin } from './supabase';
import { requiredEnv, limits } from './config';
import { ApiError } from './errors';

export async function reserveRequest(request: Request, experiment: string): Promise<void> {
  if (!/^[a-z0-9-]{1,64}$/.test(experiment)) throw new ApiError(500, 'INVALID_EXPERIMENT', 'This feature is unavailable.');
  const secret = requiredEnv('RATE_LIMIT_HASH_SECRET');
  if (secret.length < 32) throw new ApiError(503, 'INVALID_CONFIGURATION', 'This feature is temporarily unavailable.');
  // Vercel's edge overwrites this header. Never trust a client-supplied X-Forwarded-For.
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : process.env.NODE_ENV === 'development' ? '127.0.0.1' : undefined;
  if (!ip || !isIP(ip)) throw new ApiError(503, 'CLIENT_UNAVAILABLE', 'This feature is temporarily unavailable.');
  const day = new Date().toISOString().slice(0, 10);
  const clientHash = createHmac('sha256', secret).update(`${day}:${ip}`).digest('hex');
  const config = limits();
  const { data, error } = await getSupabaseAdmin().rpc('reserve_experiment_request', {
    p_experiment: experiment, p_client_hash: clientHash, p_per_minute: config.perMinute, p_daily: config.daily,
  });
  if (error || !data || typeof data.allowed !== 'boolean') throw new ApiError(503, 'QUOTA_UNAVAILABLE', 'This feature is temporarily unavailable.');
  if (!data.allowed) throw new ApiError(429, 'USAGE_LIMIT', 'The usage limit has been reached. Please try again later.', Math.max(1, Number(data.retry_after) || 60));
}
