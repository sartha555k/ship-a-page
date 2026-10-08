import 'server-only';
import { backendConfigured, userClient } from '../supabase/server';
import type { Prediction, Response } from './types';
const exampleAuthor = { id: 'example', display_name: 'Example author', handle: null, avatar_url: null };
export const examples: Prediction[] = [
  { id: 'example-ship', author_id: 'example', claim: 'I’ll ship three working experiments before the end of this month.', reasoning: 'A small scope and an existing app foundation should make one focused build per week realistic.', criteria: 'Three new publicly accessible experiment pages, each with its own merged pull request, must exist by the deadline.', source_url: 'https://github.com/sartha555k/ship-a-page', deadline: '2026-10-31T18:29:00.000Z', created_at: '2026-10-08T14:00:00.000Z', status: 'open', resolution_note: null, evidence_url: null, resolved_at: null, author: exampleAuthor, back_count: 0, challenge_count: 0, example: true },
  { id: 'example-stars', author_id: 'example', claim: 'This project will reach 1,000 GitHub stars before November ends.', reasoning: 'Consistent releases and useful pages could give visitors a reason to follow the repository.', criteria: 'The public GitHub repository must display at least 1,000 stars at the stated deadline. Earlier peaks do not count.', source_url: 'https://github.com/sartha555k/ship-a-page', deadline: '2026-11-30T18:29:00.000Z', created_at: '2026-10-08T13:00:00.000Z', status: 'open', resolution_note: null, evidence_url: null, resolved_at: null, author: exampleAuthor, back_count: 0, challenge_count: 0, example: true },
  { id: 'example-resolved', author_id: 'example', claim: 'The first release will include a readable light and dark theme.', reasoning: 'Both themes can share the same components and colour tokens.', criteria: 'The released homepage and experiment page both support a persistent light/dark switch.', source_url: 'https://github.com/sartha555k/ship-a-page', deadline: '2026-10-07T18:29:00.000Z', created_at: '2026-10-01T12:00:00.000Z', status: 'called', resolution_note: 'Illustrative resolution: both pages passed the theme checks. This is an example receipt, not a real reviewed outcome.', evidence_url: 'https://github.com/sartha555k/ship-a-page', resolved_at: '2026-10-08T12:00:00.000Z', author: exampleAuthor, back_count: 0, challenge_count: 0, example: true },
];
export async function loadPredictions(): Promise<{ predictions: Prediction[]; configured: boolean; unavailable: boolean }> {
  if (!backendConfigured()) return { predictions: examples, configured: false, unavailable: false };
  try {
    const client = await userClient();
    const { data, error } = await client.from('called_it_feed').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return { predictions: [], configured: true, unavailable: true };
    return { predictions: data as Prediction[], configured: true, unavailable: false };
  } catch { return { predictions: [], configured: true, unavailable: true }; }
}
export async function loadPrediction(id: string): Promise<{ prediction: Prediction | null; responses: Response[]; configured: boolean; unavailable: boolean }> {
  if (!backendConfigured()) return { prediction: examples.find(p => p.id === id) ?? null, responses: [], configured: false, unavailable: false };
  try {
    const client = await userClient();
    const [{ data: prediction, error }, { data: responses, error: responsesError }] = await Promise.all([
      client.from('called_it_feed').select('*').eq('id', id).maybeSingle(),
      client.from('called_it_responses').select('*,author:called_it_profiles(*)').eq('prediction_id', id).order('created_at').limit(100),
    ]);
    return { prediction: prediction as Prediction | null, responses: (responses ?? []) as Response[], configured: true, unavailable: !!(error || responsesError) };
  } catch { return { prediction: null, responses: [], configured: true, unavailable: true }; }
}
