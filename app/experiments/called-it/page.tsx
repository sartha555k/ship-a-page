import type { Metadata } from 'next';
import { CalledIt } from '../../../components/called-it';
import { loadPredictions } from '../../../lib/called-it/data';
import './called-it.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Called It — Make the call. Keep the receipt.', description: 'Put your tech predictions on record. A deadline, clear criteria, and the receipt when reality catches up.' };
export default async function Page() { const data = await loadPredictions(); return <CalledIt {...data} />; }
