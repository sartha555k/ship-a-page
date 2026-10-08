import 'server-only';
import { getSupabaseAdmin } from './supabase';
import { ApiError } from './errors';

// Only called by project-specific server routes, after input validation and quota checks.
// Save results deliberately; do not collect raw prompts, IPs, or personal data by default.
export async function saveExperimentResult(experiment: string, result: Record<string, unknown>): Promise<string> {
  if (!/^[a-z0-9-]{1,64}$/.test(experiment)) throw new ApiError(400, 'INVALID_EXPERIMENT', 'Invalid experiment.');
  if (Buffer.byteLength(JSON.stringify(result)) > 32768) throw new ApiError(413, 'RESULT_TOO_LARGE', 'The result is too large to save.');
  const { data, error } = await getSupabaseAdmin().from('experiment_runs').insert({ experiment_slug: experiment, result }).select('id').single();
  if (error || !data) throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'The result could not be saved.');
  return data.id;
}
