import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Build } from '../data/builds';

export function BuildCard({ build }: { build: Build }) {
  return <article className="build-card">
    <Link className="build-preview build-product-preview" href={build.href} aria-label={`Explore ${build.title}`}>
      <Image src={build.image} alt={build.imageAlt} width={960} height={720} sizes="(max-width: 700px) 90vw, 520px" />
    </Link>
    <div className="card-body">
      <div className="card-meta"><span>PAGE {build.id}</span><span>Explore the page <ArrowUpRight size={13} /></span></div>
      <h3>{build.title}</h3><p>{build.description}</p>
      <div className="tags">{build.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      <Link className="details" href={build.href}>Try the experiment <ArrowUpRight size={18} /></Link>
    </div>
  </article>;
}
