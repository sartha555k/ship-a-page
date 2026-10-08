import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ship a Page — Sarthak Patel’s Build Lab',description:'New technology, real experiments. An independent build lab by Sarthak Patel, turning curiosity into useful things you can try.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
