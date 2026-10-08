import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalledIt } from '../../../../components/called-it';
import { loadPrediction } from '../../../../lib/called-it/data';
import '../called-it.css';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const { prediction } = await loadPrediction(id);
  return { title: prediction ? `${prediction.claim} — Called It` : 'Called It', description: prediction?.criteria };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const data = await loadPrediction(id);
  if (!data.prediction && !data.unavailable) notFound();
  return <CalledIt predictions={data.prediction ? [data.prediction] : []} configured={data.configured} unavailable={data.unavailable} detail={data.prediction ?? undefined} responses={data.responses} />;
}
