export type Profile = { id: string; display_name: string; handle: string | null; avatar_url: string | null };
export type Prediction = {
  id: string; author_id: string; claim: string; reasoning: string; criteria: string;
  source_url: string; deadline: string; created_at: string;
  status: 'open' | 'called' | 'missed' | 'unresolved';
  resolution_note: string | null; evidence_url: string | null; resolved_at: string | null;
  author: Profile | null; back_count: number; challenge_count: number; example?: boolean;
};
export type Response = { id: string; user_id: string; stance: 'back' | 'challenge'; argument: string; created_at: string; author: Profile | null };
export type Draft = { claim: string; reasoning: string; criteria: string; source_url: string; deadline: string };
export type Session = { profile: Profile | null; admin: boolean; configured: boolean };
