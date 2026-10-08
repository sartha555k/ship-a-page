import { NextResponse } from 'next/server';
import { authenticated, failure } from '../../../../lib/called-it/api';
export async function POST(request: Request) { try { const { client } = await authenticated(request); const { error } = await client.auth.signOut(); if (error) throw error; return NextResponse.json({ ok: true }); } catch (e) { return failure(e); } }
