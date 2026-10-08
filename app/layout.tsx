import type { Metadata } from 'next';
import './site.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sarthak-ships.vercel.app'),
  title: 'Sarthak Ships — New tech. New rabbit holes.',
  description: 'I’m Sarthak Patel. I build small experiments with new models, tools, and ideas. One repo, a new page for every experiment, and the code behind it.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Sarthak Ships',
    description: 'New tech drops. I build with it. Small experiments by Sarthak Patel, built in public.',
    images: [{ url: '/sarthak-studio.webp', width: 1000, height: 1250, alt: 'Sarthak Patel' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
