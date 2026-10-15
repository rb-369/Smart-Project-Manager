'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  GitBranch, 
  Cpu, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  ChevronRight,
  Terminal,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  const [activePillar, setActivePillar] = useState<number | null>(null);

  const pillars = [
    {
      id: 0,
      name: 'Black',
      label: 'Core Engine',
      hex: '#000000',
      rgb: 'RGB 0, 0, 0',
      cmyk: 'CMYK 75, 68, 67, 90',
      bgClass: 'bg-black text-white border-zinc-800',
      accentColor: '#ffffff',
      desc: 'Autonomous GitHub ingestion, webhook listeners, and zero-leak token encryption.',
      image: '/brand/black_louver.jpg',
      meta: 'AES-256 REPO VAULT',
      foot: '© DEVCOMMAND ARCHITECTURE',
    },
    {
      id: 1,
      name: 'Violet',
      label: 'AI Inference',
      hex: '#7020DD',
      rgb: 'RGB 120, 57, 235',
      cmyk: 'CMYK 67, 71, 0, 0',
      bgClass: 'bg-[#7020DD] text-white border-purple-500/40',
      accentColor: '#ffffff',
      desc: 'Multi-tiered cascade: Gemini 2.5 Pro → Claude 3.5 Sonnet → NVIDIA NIM.',
      image: '/brand/violet_matrix.jpg',
      meta: 'NEURAL CASCADE MATRIX',
      foot: 'LATENCY < 420MS',
    },
    {
      id: 2,
      name: 'Lime',
      label: 'Velocity Physics',
      hex: '#C6FF20',
      rgb: 'RGB 198, 255, 32',
      cmyk: 'CMYK 27, 0, 100, 0',
      bgClass: 'bg-[#C6FF20] text-black border-lime-400',
      accentColor: '#000000',
      desc: 'Mathematical milestone weight: P0 Critical (4x), P1 High (3x), P2 (2x), P3 (1x).',
      image: '/brand/lime_chart.jpg',
      meta: 'TELEMETRY VELOCITY',
      foot: 'FORMULA ACCURACY 99.4%',
    },
    {
      id: 3,
      name: 'White',
      label: 'Production Ready',
      hex: '#FFFFFF',
      rgb: 'RGB 255, 255, 255',
      cmyk: 'CMYK 0, 0, 0, 0',
      bgClass: 'bg-white text-black border-zinc-200',
      accentColor: '#000000',
      desc: 'Idea triage, ranked incubator backlogs, and rapid promotion to production SaaS.',
      image: '/brand/white_sculpture.jpg',
      meta: 'PROJECT: GRIDSTERGP',
      foot: 'SWIPE TO LAUNCH >>',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden bg-grid-pattern selection:bg-[#C6FF20] selection:text-black">
      {/* Gridster Ambient Lighting */}
      <div className="ambient-glow-violet -top-32 left-1/4" />
      <div className="ambient-glow-lime top-80 -right-24" />

      {/* Floating Island Navigation Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 floating-nav-island px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center font-mono text-xs font-black text-white group-hover:border-[#C6FF20] transition-colors">
              <span className="text-white group-hover:text-[#C6FF20] transition-colors">DC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                Dev<span className="text-[#C6FF20]">Command</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">
                GRIDSTERGP // 2026
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20] pulse-lime" />
            <span className="text-zinc-300 font-semibold">GRIDSTER SYSTEM ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs text-zinc-400 hover:text-white transition-colors font-mono px-3 py-1.5 rounded-full hover:bg-white/[0.05]"
          >
            API Setup
          </Link>
          <Link
            href="/dashboard"
            className="btn-lime !py-1.5 !px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section (Restrained Stack: max 4 text elements, fits viewport) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-12 relative z-10 w-full flex-1">
        <div className="max-w-3xl mx-auto text-center space-y-4 pt-4">
          {/* Eyebrow (1 per 3 sections rule) */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
            <span className="tracking-wide">GRIDSTERGP ARCHITECTURE // SPEC V1.0</span>
          </div>

          {/* Headline (Max 2 lines desktop) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Turn chaotic repositories into high-velocity roadmaps.
          </h1>

          {/* Subtext (Max 20 words) */}
          <p className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Automated GitHub ingestion, multi-tier AI feature decomposition, and mathematical milestone velocity physics for ambitious engineers.
          </p>

          {/* CTAs (1 primary + 1 secondary) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto btn-lime !py-3 !px-7 text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Enter Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="w-full sm:w-auto btn-outline-white !py-3 !px-6 text-sm font-mono text-zinc-300 hover:text-white flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span>Configure GitHub PAT</span>
            </Link>
          </div>
        </div>

        {/* ==================================================================
            THE 4-PILLAR GRIDSTER SPECTRUM SHOWCASE (Exact Match to User Image)
            ================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7020DD] pulse-violet" />
              <span className="uppercase text-zinc-400 font-semibold">Colorway Telemetry Matrix</span>
            </div>
            <span>PROJECT: GRIDSTERGP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((pillar) => {
              const isSelected = activePillar === pillar.id;
              return (
                <div
                  key={pillar.id}
                  onMouseEnter={() => setActivePillar(pillar.id)}
                  onMouseLeave={() => setActivePillar(null)}
                  className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[460px] group shadow-2xl ${
                    pillar.id === 0
                      ? 'bg-zinc-950 border-zinc-800'
                      : pillar.id === 1
                      ? 'bg-[#7020DD] border-purple-400/40'
                      : pillar.id === 2
                      ? 'bg-[#C6FF20] border-lime-300'
                      : 'bg-white border-zinc-200'
                  }`}
                >
                  {/* Top Bar Header */}
                  <div className={`p-4 flex items-center justify-between text-[11px] font-mono border-b ${
                    pillar.id === 0
                      ? 'text-zinc-400 border-zinc-800/80'
                      : pillar.id === 1
                      ? 'text-purple-200 border-white/20'
                      : pillar.id === 2
                      ? 'text-black/80 border-black/10'
                      : 'text-zinc-600 border-zinc-200'
                  }`}>
                    <span className="font-bold tracking-wider">{pillar.meta}</span>
                    <span className="text-[10px] font-mono opacity-80">0{pillar.id + 1}</span>
                  </div>

                  {/* Mid Typographic Moment */}
                  <div className="px-5 py-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className={`text-xs font-mono uppercase tracking-widest mb-1 ${
                        pillar.id === 2 || pillar.id === 3 ? 'text-black/60 font-semibold' : 'text-zinc-400'
                      }`}>
                        {pillar.label}
                      </p>
                      <h2 className={`text-4xl sm:text-5xl font-black tracking-tight leading-none ${
                        pillar.id === 2 || pillar.id === 3 ? 'text-black' : 'text-white'
                      }`}>
                        {pillar.name}
                      </h2>
                    </div>

                    {/* Telemetry specs (HEX, RGB, CMYK) */}
                    <div className={`text-[10px] font-mono space-y-0.5 pt-4 ${
                      pillar.id === 2 || pillar.id === 3 ? 'text-black/80 font-medium' : 'text-zinc-300'
                    }`}>
                      <p className="font-bold">{pillar.hex}</p>
                      <p>{pillar.rgb}</p>
                      <p>{pillar.cmyk}</p>
                    </div>
                  </div>

                  {/* Bottom Textured Visual Asset (Direct Reference from Uploaded Image) */}
                  <div className="relative h-44 w-full overflow-hidden border-t border-black/10">
                    <Image
                      src={pillar.image}
                      alt={`${pillar.name} texture`}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Bottom Pill Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                      {pillar.id === 3 ? (
                        <Link
                          href="/dashboard"
                          className="swipe-pill hover:bg-black hover:border-[#C6FF20] transition-colors"
                        >
                          <span>Swipe</span>
                          <span className="text-[#C6FF20] font-mono">&gt;&gt;</span>
                        </Link>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300">
                          {pillar.foot}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================================
            TECHNICAL BENTO MATRIX (Engine Capabilities & Telemetry)
            ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
          {/* Tile 1: GitHub Ingestion Pipeline */}
          <div className="gridster-panel p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#C6FF20]" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    GitHub Repo Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6FF20]/10 border border-[#C6FF20]/30 text-[#C6FF20]">
                  SYNCED
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Connect your GitHub Personal Access Token to auto-discover and triage new repositories.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
                    <span className="text-zinc-200">DevCommand-Core</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">TypeScript</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7020DD] pulse-violet" />
                    <span className="text-zinc-200">AI-Decomposition-Engine</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">FastAPI</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
              <span>Encrypted Token Vault</span>
              <span className="text-[#C6FF20]">ACTIVE</span>
            </div>
          </div>

          {/* Tile 2: Multi-Tier AI Cascade */}
          <div className="gridster-panel gridster-panel-violet p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    AI Cascade Redundancy
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  3 TIERS
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Never fail an AI decomposition request. Automated failover guarantees continuous roadmap generation.
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <span className="text-zinc-300">1. Gemini 2.5 Pro</span>
                  <span className="text-[#C6FF20] text-[11px] font-semibold">Primary</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <span className="text-zinc-300">2. Claude 3.5 Sonnet</span>
                  <span className="text-purple-300 text-[11px]">Fallback 1</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <span className="text-zinc-300">3. NVIDIA NIM Meta Llama</span>
                  <span className="text-zinc-500 text-[11px]">Fallback 2</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 text-[11px] font-mono text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Zero Rate-Limit Fallback Guard</span>
            </div>
          </div>

          {/* Tile 3: Priority-Weighted Physics */}
          <div className="gridster-panel gridster-panel-lime p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C6FF20]" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Weighted Velocity Physics
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6FF20]/10 border border-[#C6FF20]/30 text-[#C6FF20]">
                  FORMULA
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Progress is computed with mathematical weighting rather than naive feature counts.
              </p>

              <div className="space-y-2 font-mono text-xs mb-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-zinc-300">P0 Critical</span>
                  <span className="text-[#C6FF20] font-bold">4x Multiplier</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-zinc-300">P1 High</span>
                  <span className="text-white font-medium">3x Multiplier</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-zinc-300">P2 Medium &bull; P3 Low</span>
                  <span className="text-zinc-500">2x &bull; 1x Multiplier</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Formula Velocity</p>
                <p className="text-lg font-black font-mono text-[#C6FF20] num-tabular">82.5%</p>
              </div>
              <div className="w-32 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#C6FF20] rounded-full w-[82.5%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Ready to command your software architecture?
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl font-mono">
              Initialize your local database, sync your repositories, and generate your first AI feature roadmap in under 60 seconds.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn-lime !py-3 !px-6 text-xs font-bold shrink-0 flex items-center gap-2"
          >
            <span>Open Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Gridster Telemetry Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-black px-6 py-6 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">DEVCOMMAND</span>
          <span>&bull;</span>
          <span>GRIDSTERGP SPECIFICATION</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-zinc-600">BLACK // VIOLET // LIME // WHITE</span>
          <span className="text-[#C6FF20]">ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
