export type Build = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  href: string;
};

// Add an entry only when the corresponding experiment is working.
export const builds: Build[] = [{
  id: '000',
  title: 'First, a place to put everything.',
  description: 'You’re looking at it. The homepage, the shared components, and the log that every new experiment will join.',
  category: 'Interfaces',
  tags: ['Next.js', 'TypeScript', 'Base UI'],
  href: '/',
}, {
  id: '001',
  title: 'Called It. Words on record.',
  description: 'Make a prediction, set a deadline, and keep the receipt. Browse the collection, then back or challenge a call.',
  category: 'Experiments',
  tags: ['Next.js', 'Supabase', 'X sign-in'],
  href: '/experiments/called-it',
}];
