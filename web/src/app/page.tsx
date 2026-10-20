'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  GitBranch,
  Cpu,
  Layers,
  CheckCircle2,
  Terminal,
  Lightbulb,
  Bot,
  Zap,
  Database,
  ShieldCheck,
  Scale,
  Target,
  Radar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GithubIcon } from '@/components/GithubIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { ProductPreview } from '@/components/landing/ProductPreview';

const TICKER_ITEMS = [
  'AUTONOMOUS REPO INGESTION',
  'GITHUB OAUTH & ISOLATED TENANTS',
  'MONGODB ATLAS PERSISTENCE',
  'AI ROADMAP DECOMPOSITION',
  'WEIGHTED VELOCITY PHYSICS',
  'MULTI-TIER AI INFERENCE',
  'AES-256 VAULT SECURITY',
  'WHATSAPP CONCEPT EXTRACTION',
];

const STEPS = [
  {
    id: '01',
    icon: GitBranch,
    title: 'Connect',
    body: 'Link GitHub and every repository you own is ingested, AST-scanned and mapped to a goal — the moment you create it, not when you remember to.',
  },
  {
    id: '02',
    icon: Scale,
    title: 'Decide',
    body: 'A three-agent council researches the market, judges the idea down to its fatal flaws, and drafts the blueprint for what to build next.',
  },
  {
    id: '03',
    icon: Target,
    title: 'Ship',
    body: 'Features land on a weighted backlog. Velocity is computed from what actually shipped, so your next session starts at the top of the right list.',
  },
];

const CAPABILITIES = [
  {
    id: '01',
    icon: GitBranch,
    title: 'Repository intelligence',
    body: 'Full AST decomposition, continuous GitHub synchronisation, live deployment links and a triage pass on every repo that needs review.',
    accent: 'blue' as const,
    stat: '100%',
    statLabel: 'Ingested automatically',
    foot: 'Continuous sync · 60s poll',
  },
  {
    id: '02',
    icon: Bot,
    title: 'The AI council',
    body: 'A market researcher, a brutal judge and a feature planner run in sequence, each one able to reject what the last one proposed.',
    accent: 'violet' as const,
    stat: '<420ms',
    statLabel: 'Median inference',
    foot: 'Gemini · NVIDIA NIM · OpenRouter',
  },
  {
    id: '03',
    icon: Zap,
    title: 'Velocity physics',
    body: 'P0 through P3 are weighted 4× / 3× / 2× / 1×, so a shipped critical outranks a shipped nice-to-have. No more busywork at the top of the list.',
    accent: 'lime' as const,
    stat: '99.4%',
    statLabel: 'Milestone accuracy',
    foot: 'Weighted backlog ordering',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="surface-canvas relative flex min-h-screen flex-col overflow-x-clip text-white selection:bg-brand-lime-400 selection:text-black">
      {/* ====================================================================
          NAVIGATION
          ==================================================================== */}
      <header className="relative z-40 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <Link href="/" aria-label="DevCommand home" className="group shrink-0">
          <BrandLogo size={34} />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] p-1 backdrop-blur-xl lg:flex"
          aria-label="Primary"
        >
          {[
            { label: 'Command Center', href: '/dashboard' },
            { label: 'Concept Radar', href: '/ideas' },
            { label: 'Copilot', href: '/chat' },
            { label: 'Settings', href: '/settings' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 font-mono text-[0.6875rem] font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://github.com/rb-369/Smart-Project-Manager"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 font-mono text-[0.6875rem] font-bold text-white/85 backdrop-blur-xl transition-colors hover:bg-white/15 hover:text-white sm:inline-flex"
          >
            <span>GitHub</span>
            <ArrowUpRight className="h-3 w-3 opacity-70" aria-hidden="true" />
          </a>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-4 py-2 font-mono text-[0.6875rem] font-black text-black shadow-lime transition-colors hover:bg-brand-lime-300"
            >
              <span className="hidden sm:inline">Open command center</span>
              <span className="sm:hidden">Open</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-4 py-2 font-mono text-[0.6875rem] font-black text-black shadow-lime transition-colors hover:bg-brand-lime-300"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign in with GitHub</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          )}
        </div>
      </header>

      {/* ====================================================================
          HERO
          ==================================================================== */}
      <section className="relative px-4 pb-24 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <span className="lime-sticker">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Autonomous repo roadmaps
            </span>
          </div>

          <h1 className="text-[clamp(2.5rem,8vw,5.25rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
            <span className="block">Know what</span>
            <span className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-3 sm:gap-4">
              <span>to build</span>
              <span className="-rotate-1 rounded-2xl bg-brand-lime-400 px-3.5 py-1.5 text-[0.55em] font-black text-black shadow-[0_10px_40px_-8px_rgba(198,255,32,0.7)] transition-transform hover:rotate-0 sm:rounded-3xl sm:px-6 sm:py-2.5">
                next
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-white/80 sm:text-base">
            DevCommand ingests every GitHub repository you own, decomposes each one into
            weighted features, and tells you exactly what to build next — with a three-agent
            AI council backing every call.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {isAuthenticated ? (
              <Button
                href="/dashboard"
                size="lg"
                iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                Open command center
              </Button>
            ) : (
              <Button
                href="/login"
                size="lg"
                iconLeft={<GithubIcon className="h-4 w-4" aria-hidden="true" />}
                iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                Connect GitHub
              </Button>
            )}

            <Button
              href="/ideas"
              variant="outline"
              size="lg"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              iconLeft={<Lightbulb className="h-4 w-4" aria-hidden="true" />}
            >
              Open the radar
            </Button>
          </div>
        </div>

        {/* Product preview */}
        <div className="mt-14 sm:mt-20">
          <ProductPreview />
        </div>
      </section>

      {/* ====================================================================
          TICKER
          ==================================================================== */}
      <div
        className="relative z-20 w-full overflow-hidden border-y-2 border-black/15 bg-brand-lime-400 py-4 font-mono text-[0.6875rem] font-black uppercase tracking-widest text-black select-none sm:text-sm"
        aria-hidden="true"
      >
        <div className="animate-marquee gap-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 text-lg">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          WHITE SHEET
          ==================================================================== */}
      <section className="relative z-30 w-full bg-white pb-20 pt-16 text-ink-900 sm:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* ---------------- HOW IT WORKS ---------------- */}
        <div className="mb-14">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow text-brand-blue-600">The pipeline</span>
              <h2 className="mt-2 text-h1 font-extrabold uppercase tracking-tight text-ink-950">
                From push to shipped
              </h2>
            </div>
            <p className="max-w-md text-[0.8125rem] leading-relaxed text-ink-500">
              No manual entry, no guessing which repo matters, no half-finished backlog
              nobody trusts. Three steps, running on every repository you own.
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const active = index === activeStep;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveStep(index)}
                    onFocus={() => setActiveStep(index)}
                    onClick={() => setActiveStep(index)}
                    aria-label={`Step ${step.id}: ${step.title}`}
                    className={`group h-full w-full rounded-3xl border p-6 text-left transition-[transform,box-shadow,border-color] duration-200 ease-out-expo hover:-translate-y-1 ${
                      active
                        ? 'border-brand-blue-500/30 bg-white shadow-e3'
                        : 'border-ink-200 bg-white shadow-e1'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-2xl border transition-colors ${
                          active
                            ? 'border-brand-blue-500/20 bg-brand-blue-50 text-brand-blue-600'
                            : 'border-ink-200 bg-ink-50 text-ink-400'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="num-tabular font-mono text-[0.6875rem] font-black text-ink-300">
                        {step.id}
                      </span>
                    </div>
                    <h3 className="mt-4 text-h3 font-extrabold uppercase tracking-tight text-ink-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500">
                      {step.body}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ---------------- CAPABILITIES ---------------- */}
        <div className="mb-16">
          <div className="mb-8 max-w-2xl">
            <span className="eyebrow text-brand-blue-600">Architectural capabilities</span>
            <h2 className="mt-2 text-h1 font-extrabold uppercase tracking-tight text-ink-950">
              One system for every repo
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              const isLime = cap.accent === 'lime';
              const isViolet = cap.accent === 'violet';

              return (
                <article
                  key={cap.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-1 ${
                    isLime
                      ? 'border-brand-lime-400 bg-brand-lime-400 shadow-lime'
                      : 'border-ink-200 bg-white shadow-e1 hover:shadow-e3'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-2xl border ${
                          isLime
                            ? 'border-black/15 bg-white/70 text-black'
                            : isViolet
                              ? 'border-brand-violet-200 bg-brand-violet-50 text-brand-violet-600'
                              : 'border-brand-blue-200 bg-brand-blue-50 text-brand-blue-600'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span
                        className={`num-tabular font-mono text-[0.625rem] font-black ${
                          isLime ? 'text-black/50' : 'text-ink-300'
                        }`}
                      >
                        {cap.id}
                      </span>
                    </div>

                    <h3
                      className={`mt-4 text-h3 font-extrabold uppercase tracking-tight ${
                        isLime ? 'text-black' : 'text-ink-950'
                      }`}
                    >
                      {cap.title}
                    </h3>
                    <p
                      className={`mt-2 text-[0.8125rem] leading-relaxed ${
                        isLime ? 'text-black/75' : 'text-ink-500'
                      }`}
                    >
                      {cap.body}
                    </p>

                    <div
                      className={`mt-5 rounded-2xl border p-4 ${
                        isLime
                          ? 'border-black/10 bg-white'
                          : isViolet
                            ? 'border-brand-violet-500 bg-brand-violet-500 text-white'
                            : 'border-brand-blue-500 bg-brand-blue-500 text-white'
                      }`}
                    >
                      <div
                        className={`font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
                          isLime ? 'text-ink-400' : 'text-white/70'
                        }`}
                      >
                        {cap.statLabel}
                      </div>
                      <div
                        className={`mt-0.5 text-h2 font-black tracking-tight ${
                          isLime ? 'text-ink-950' : 'text-white'
                        }`}
                      >
                        {cap.stat}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-5 flex items-center justify-between border-t pt-4 font-mono text-[0.625rem] ${
                      isLime ? 'border-black/15 text-black/70' : 'border-ink-200 text-ink-500'
                    }`}
                  >
                    <span>{cap.foot}</span>
                    <Link
                      href="/dashboard"
                      className={`inline-flex items-center gap-1 font-bold ${
                        isLime
                          ? 'text-black hover:underline'
                          : 'text-brand-blue-600 hover:text-brand-blue-700'
                      }`}
                    >
                      <span>Explore</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* ---------------- STATEMENT ---------------- */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-blue-500 p-8 text-center text-white shadow-e3 sm:p-14">
          <div className="bg-blue-grid absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-white/20 pb-5 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-white/70">
              <span>In collaboration with</span>
              <span className="text-white">GitHub</span>
              <span className="text-brand-lime-400">•</span>
              <span className="text-white">Vercel</span>
              <span className="text-brand-lime-400">•</span>
              <span className="text-white">FastAPI</span>
              <span className="text-brand-lime-400">•</span>
              <span className="text-white">Gemini 2.5</span>
            </div>

            <h3 className="text-[clamp(1.75rem,4.5vw,3rem)] font-black uppercase leading-[1.05] tracking-tight text-white">
              Every repository becomes a{' '}
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-lime-400 px-4 py-1.5 text-[0.6em] font-black text-black shadow-lime">
                <span className="h-2.5 w-2.5 rounded-full bg-black" aria-hidden="true" />
                roadmap
              </span>{' '}
              you actually trust.
            </h3>

            <p className="mx-auto max-w-xl text-[0.8125rem] leading-relaxed text-white/80">
              Multi-tenant by construction, encrypted at rest, and always answering the only
              question that matters: what do I build today?
            </p>

            <Button
              href="/dashboard"
              size="lg"
              iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Open command center
            </Button>
          </div>
        </div>
        </div>
      </section>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer className="border-t border-ink-200 bg-ink-50 px-4 py-12 text-ink-600 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo size={32} variant="onLight" />
            <p className="mt-4 max-w-xs text-[0.8125rem] leading-relaxed text-ink-500">
              The command center for engineers with more repositories than momentum.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 font-mono text-[0.625rem] font-bold text-ink-500">
                <Database className="h-3 w-3 text-brand-blue-500" aria-hidden="true" />
                MongoDB Atlas
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 font-mono text-[0.625rem] font-bold text-ink-500">
                <ShieldCheck className="h-3 w-3 text-brand-blue-500" aria-hidden="true" />
                AES-256 vault
              </span>
            </div>
          </div>

          <div>
            <h4 className="eyebrow text-ink-400">Product</h4>
            <ul className="mt-3 space-y-2 text-[0.8125rem]">
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-brand-blue-600">
                  Command Center
                </Link>
              </li>
              <li>
                <Link href="/ideas" className="transition-colors hover:text-brand-blue-600">
                  Concept Radar
                </Link>
              </li>
              <li>
                <Link href="/chat" className="transition-colors hover:text-brand-blue-600">
                  AI Copilot
                </Link>
              </li>
              <li>
                <Link href="/settings" className="transition-colors hover:text-brand-blue-600">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-ink-400">Capabilities</h4>
            <ul className="mt-3 space-y-2 text-[0.8125rem]">
              <li className="flex items-center gap-2">
                <Radar className="h-3.5 w-3.5 text-brand-blue-500" aria-hidden="true" />
                Repo ingestion
              </li>
              <li className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-brand-blue-500" aria-hidden="true" />
                AI council
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-brand-blue-500" aria-hidden="true" />
                Velocity physics
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-500" aria-hidden="true" />
                Triage
              </li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-ink-400">Project</h4>
            <ul className="mt-3 space-y-2 text-[0.8125rem]">
              <li>
                <a
                  href="https://github.com/rb-369/Smart-Project-Manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-blue-600"
                >
                  Source code
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-brand-blue-600">
                  Sign in
                </Link>
              </li>
              <li className="flex items-center gap-2 font-mono text-[0.6875rem] text-ink-400">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                v1.0.0
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-ink-200 pt-6 font-mono text-[0.6875rem] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 DevCommand. Isolated multi-tenant architecture.</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-blue-500" aria-hidden="true" />
            All systems operational
          </span>
        </div>
      </footer>
    </div>
  );
}
