'use client';

import { GitBranch, Cpu, Zap, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';

/**
 * A stylised, live-DOM preview of the DevCommand Command Center.
 *
 * The previous hero used two tilted cards and a rubber stamp — pure
 * template filler that said nothing about the product. This is a real
 * rendering of the actual interface, so it stays crisp at any viewport and
 * cannot drift out of sync with the app.
 */
export function ProductPreview() {
  const repos = [
    { name: 'smart-project-manager', lang: 'TypeScript', progress: 82, tone: 'brand' as const },
    { name: 'commit-tweet-bot', lang: 'Python', progress: 46, tone: 'brand' as const },
    { name: 'pantry-pal', lang: 'Dart', progress: 18, tone: 'violet' as const },
  ];

  const cascade = [
    { name: 'Gemini 2.5 Flash', role: 'Fast primary', dot: 'bg-brand-blue-500' },
    { name: 'Llama 3.2 11B', role: 'NVIDIA NIM', dot: 'bg-brand-violet-500' },
    { name: 'Concept extractor', role: 'WhatsApp ingest', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Glow behind the panel */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-brand-lime-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_40px_120px_-40px_rgba(0,10,40,0.8)] backdrop-blur-2xl">
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-white/15 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" aria-hidden="true" />
          <span className="ml-2 truncate font-mono text-[0.625rem] tracking-wide text-white/55">
            devcommand.app / command-center
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-brand-lime-400/30 bg-brand-lime-400/10 px-2 py-0.5 font-mono text-[0.5625rem] font-bold text-brand-lime-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-lime-400" aria-hidden="true" />
            SYNCED
          </span>
        </div>

        {/* App body */}
        <div className="grid gap-3 bg-white/95 p-3 sm:grid-cols-[1.5fr_1fr] sm:gap-4 sm:p-4">
          {/* Repos column */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Active repositories
              </span>
              <span className="font-mono text-[0.625rem] font-black text-brand-blue-600">3 tracked</span>
            </div>

            {repos.map((repo) => (
              <div
                key={repo.name}
                className="rounded-2xl border border-brand-blue-500/10 bg-white p-3 shadow-e1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <GitBranch
                      className="h-3 w-3 shrink-0 text-brand-blue-500"
                      aria-hidden="true"
                    />
                    <span className="truncate font-mono text-[0.6875rem] font-bold text-ink-900">
                      {repo.name}
                    </span>
                  </div>
                  <span className="num-tabular shrink-0 font-mono text-[0.6875rem] font-black text-ink-900">
                    {repo.progress}%
                  </span>
                </div>
                <ProgressBar
                  value={repo.progress}
                  tone={repo.tone}
                  label={`${repo.name} velocity`}
                  className="mt-2"
                />
                <div className="mt-1.5 flex items-center justify-between font-mono text-[0.5625rem] text-ink-400">
                  <span>{repo.lang}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                    synced
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics column */}
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-brand-blue-500/10 bg-brand-blue-50/60 p-3">
              <div className="flex items-center gap-2">
                <ProgressRing
                  value={74}
                  size={58}
                  strokeWidth={10}
                  trackClassName="text-white"
                  progressClassName="text-brand-blue-500"
                  label="Sprint velocity 74%"
                >
                  <span className="num-tabular font-mono text-[0.8125rem] font-black text-ink-900">
                    74%
                  </span>
                </ProgressRing>
                <div className="min-w-0">
                  <div className="font-mono text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                    Sprint velocity
                  </div>
                  <div className="mt-0.5 text-[0.6875rem] font-bold text-ink-800">
                    41 / 55 features
                  </div>
                  <div className="mt-0.5 font-mono text-[0.5625rem] text-ink-500">
                    weighted 4×/3×/2×/1×
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-blue-500/10 bg-white p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-brand-violet-500" aria-hidden="true" />
                <span className="font-mono text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-500">
                  AI council
                </span>
              </div>
              <ul className="space-y-1.5">
                {cascade.map((agent) => (
                  <li
                    key={agent.name}
                    className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate font-mono text-[0.5625rem] font-bold text-ink-700">
                        {agent.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.5rem] text-ink-400">
                      {agent.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-brand-lime-400/40 bg-brand-lime-400 px-3 py-2.5">
              <Zap className="h-3.5 w-3.5 shrink-0 text-black" aria-hidden="true" />
              <span className="font-mono text-[0.5625rem] font-black uppercase tracking-[0.06em] text-black">
                Next: Ship webhook dispatcher
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPreview;
