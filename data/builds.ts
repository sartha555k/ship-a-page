export type Build = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  href: string;
  image: string;
  imageAlt: string;
};

// Add an entry only when the corresponding experiment is working.
export const builds: Build[] = [{
  id: '001',
  title: 'Called It. Words on record.',
  description: 'Make a prediction, set a deadline, and keep the receipt. Browse the collection, then back or challenge a call.',
  category: 'Experiments',
  tags: ['Next.js', 'Supabase', 'X sign-in'],
  href: '/experiments/called-it',
  image: '/called-it-preview.webp',
  imageAlt: 'Called It interface showing a prediction, its deadline, outcome criteria, and Back and Challenge actions.',
}];
