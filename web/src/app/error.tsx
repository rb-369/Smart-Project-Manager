'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, TriangleAlert } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DevCommand] Unhandled route error:', error);
  }, [error]);

  return (
    <div className="surface-canvas flex min-h-screen items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-lg rounded-3xl p-8 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <BrandLogo size={40} variant="onLight" showWordmark={false} />
        </div>

        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </div>

        <h1 className="text-h2 font-extrabold uppercase tracking-tight text-ink-950">
          Something broke
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
          This screen failed to render. Your repositories and backlog are untouched — try
          again, and if it keeps happening the workspace API may be down.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[0.625rem] text-ink-400">Reference: {error.digest}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-5 py-2.5 font-mono text-[0.75rem] font-black text-black shadow-lime transition-colors hover:bg-brand-lime-300"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue-500/15 bg-white px-5 py-2.5 font-mono text-[0.75rem] font-bold text-ink-800 transition-colors hover:bg-brand-blue-50"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            Command center
          </Link>
        </div>
      </div>
    </div>
  );
}
