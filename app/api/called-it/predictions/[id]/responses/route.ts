import { NextResponse } from 'next/server';
import { authenticated, databaseError, failure, readBody, ApiError } from '../../../../../../lib/called-it/api';
import { validateResponse } from '../../../../../../lib/called-it/validation';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, user } = await authenticated(request); const { id } = await context.params;
    let input; try { input = validateResponse(await readBody(request)); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError((e as Error).message); }
    const { error } = await client.from('called_it_responses').insert({ ...input, prediction_id: id, user_id: user.id });
    if (error) databaseError(error);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) { return failure(e); }
}
