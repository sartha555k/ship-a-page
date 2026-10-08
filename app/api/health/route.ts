export const dynamic = 'force-dynamic';
export function GET() {
  // Liveness only: no secrets, config inventory, provider calls or database writes.
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
