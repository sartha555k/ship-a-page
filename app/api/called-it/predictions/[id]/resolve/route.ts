import { NextResponse } from 'next/server';
import { authenticated, databaseError, failure, readBody, ApiError } from '../../../../../../lib/called-it/api';
import { validateResolution } from '../../../../../../lib/called-it/validation';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await authenticated(request); const { id } = await context.params;
    const { data: admin } = await client.rpc('called_it_is_admin'); if (!admin) throw new ApiError('Only a reviewer can resolve calls.', 403);
    let input; try { input = validateResolution(await readBody(request)); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError((e as Error).message); }
    const { data, error } = await client.from('called_it_predictions').update({ ...input, resolved_at: new Date().toISOString() }).eq('id', id).eq('status', 'open').lte('deadline', new Date().toISOString()).select('id');
    if (error) databaseError(error); if (!data?.length) throw new ApiError('This call is not ready for resolution.', 409);
    return NextResponse.json({ ok: true });
  } catch (e) { return failure(e); }
}
