import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function NotFound() {
  return (
    <div className="surface-canvas flex min-h-screen items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-lg rounded-3xl p-8 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <BrandLogo size={40} variant="onLight" showWordmark={false} />
        </div>

        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-brand-blue-200 bg-brand-blue-50 text-brand-blue-600">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </div>

        <p className="eyebrow text-brand-blue-600">404</p>
        <h1 className="mt-1 text-h2 font-extrabold uppercase tracking-tight text-ink-950">
          Nothing here
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
          This page does not exist. It may have been renamed, or the link that brought you
          here is out of date.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-5 py-2.5 font-mono text-[0.75rem] font-black text-black shadow-lime transition-colors hover:bg-brand-lime-300"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Back to the command center
        </Link>
      </div>
    </div>
  );
}
