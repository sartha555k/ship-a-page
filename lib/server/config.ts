import 'server-only';
import { ApiError } from './errors';

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(503, 'NOT_CONFIGURED', 'This feature is not configured yet.');
  return value;
}

export function positiveInteger(name: string, fallback: number, ceiling: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new ApiError(503, 'INVALID_CONFIGURATION', 'This feature is temporarily unavailable.');
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > ceiling) throw new ApiError(503, 'INVALID_CONFIGURATION', 'This feature is temporarily unavailable.');
  return value;
}

export function limits() {
  return {
    perMinute: positiveInteger('API_RATE_LIMIT_PER_MINUTE', 5, 100),
    daily: positiveInteger('API_DAILY_REQUEST_LIMIT', 100, 10000),
    inputCharacters: positiveInteger('API_MAX_INPUT_CHARACTERS', 4000, 20000),
    outputTokens: positiveInteger('AI_MAX_OUTPUT_TOKENS', 512, 4096),
  };
}
