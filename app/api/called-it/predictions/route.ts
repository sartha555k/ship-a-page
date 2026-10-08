import { NextResponse } from 'next/server';
import { authenticated, databaseError, failure, readBody, ApiError } from '../../../../lib/called-it/api';
import { validateDraft } from '../../../../lib/called-it/validation';
export async function POST(request: Request) {
  try {
    const { client, user } = await authenticated(request);
    let draft; try { draft = validateDraft(await readBody(request)); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError((e as Error).message); }
    const { data, error } = await client.from('called_it_predictions').insert({ ...draft, author_id: user.id }).select('id').single();
    if (error) databaseError(error);
    return NextResponse.json({ id: data!.id }, { status: 201 });
  } catch (e) { return failure(e); }
}
