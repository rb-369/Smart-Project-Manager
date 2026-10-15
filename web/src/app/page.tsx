'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  GitBranch, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Terminal
} from 'lucide-react';

export default function Home() {
  const [, setActivePillar] = useState<number | null>(null);

  // User Colorway Sequence: Blue, Lime, White, Violet
  const pillars = [
    {
      id: 0,
      name: 'Blue',
      label: 'Core Engine',
      hex: '#0A5CFF',
      rgb: 'RGB 10, 92, 255',
      cmyk: 'CMYK 88, 65, 0, 0',
      bgClass: 'bg-[#0A5CFF] text-white border-blue-500',
      accentColor: '#ffffff',
      desc: 'Autonomous GitHub ingestion, webhook synchronization, and zero-leak token encryption.',
      image: '/brand/blue_louver.jpg',
      meta: 'AES-256 REPO VAULT',
      foot: '© DEVCOMMAND ARCHITECTURE',
    },
    {
      id: 1,
      name: 'Lime',
      label: 'Velocity Physics',
      hex: '#C6FF20',
      rgb: 'RGB 198, 255, 32',
      cmyk: 'CMYK 27, 0, 100, 0',
      bgClass: 'bg-[#C6FF20] text-black border-lime-300',
      accentColor: '#000000',
      desc: 'Mathematical milestone weight: P0 Critical (4x), P1 High (3x), P2 (2x), P3 (1x).',
      image: '/brand/lime_chart.jpg',
      meta: 'TELEMETRY VELOCITY',
      foot: 'FORMULA ACCURACY 99.4%',
    },
    {
      id: 2,
      name: 'White',
      label: 'Production Ready',
      hex: '#FFFFFF',
      rgb: 'RGB 255, 255, 255',
      cmyk: 'CMYK 0, 0, 0, 0',
      bgClass: 'bg-white text-slate-900 border-slate-200',
      accentColor: '#000000',
      desc: 'Idea triage, ranked incubator backlogs, and rapid promotion to production SaaS.',
      image: '/brand/white_sculpture.jpg',
      meta: 'PROJECT: GRIDSTERGP',
      foot: 'SWIPE TO LAUNCH >>',
    },
    {
      id: 3,
      name: 'Violet',
      label: 'AI Inference',
      hex: '#7020DD',
      rgb: 'RGB 120, 57, 235',
      cmyk: 'CMYK 67, 71, 0, 0',
      bgClass: 'bg-[#7020DD] text-white border-purple-500',
      accentColor: '#ffffff',
      desc: 'Multi-tiered cascade: Gemini 2.5 Pro → Claude 3.5 Sonnet → NVIDIA NIM.',
      image: '/brand/violet_matrix.jpg',
      meta: 'NEURAL CASCADE MATRIX',
      foot: 'LATENCY < 420MS',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden bg-grid-pattern-light selection:bg-[#C6FF20] selection:text-black">
      {/* Soft Ambient Light Glows */}
      <div className="ambient-glow-blue -top-32 left-1/4" />
      <div className="ambient-glow-lime top-80 -right-24" />
      <div className="ambient-glow-violet bottom-20 left-1/3" />

      {/* Floating Island Navigation Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 floating-nav-island px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-xs font-black text-[#0A5CFF] group-hover:border-[#0A5CFF] transition-colors shadow-xs">
              <span>DC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-950 leading-none">
                Dev<span className="text-[#0A5CFF]">Command</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 tracking-wider font-semibold">
                SPECTRUM: BLUE &bull; LIME &bull; WHITE &bull; VIOLET
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A5CFF] pulse-blue" />
            <span className="text-slate-900 font-bold">GRIDSTER LIGHT</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs text-slate-600 hover:text-slate-950 transition-colors font-mono font-medium px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            API Setup
          </Link>
          <Link
            href="/dashboard"
            className="btn-lime !py-1.5 !px-4 text-xs font-extrabold flex items-center gap-1.5"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-12 relative z-10 w-full flex-1">
        <div className="max-w-3xl mx-auto text-center space-y-4 pt-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
            <span className="tracking-wide font-bold">QUADRANT LIGHT // BLUE &bull; LIME &bull; WHITE &bull; VIOLET</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
            Turn chaotic repositories into high-velocity roadmaps.
          </h1>

          {/* Subtext (Max 20 words) */}
          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Automated GitHub ingestion, multi-tier AI feature decomposition, and mathematical milestone velocity physics for ambitious engineers.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto btn-lime !py-3 !px-7 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              <span>Enter Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="w-full sm:w-auto btn-outline-white !py-3 !px-6 text-sm font-mono text-slate-800 hover:text-black flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-slate-500" />
              <span>Configure GitHub PAT</span>
            </Link>
          </div>
        </div>

        {/* ==================================================================
            THE 4-PILLAR SPECTRUM SHOWCASE (LIGHT CANVAS)
            ================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
              <span className="uppercase text-slate-700 font-bold">Colorway Telemetry Matrix</span>
            </div>
            <span className="font-semibold">SPECTRUM: BLUE &bull; LIME &bull; WHITE &bull; VIOLET</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((pillar) => {
              return (
                <div
                  key={pillar.id}
                  onMouseEnter={() => setActivePillar(pillar.id)}
                  onMouseLeave={() => setActivePillar(null)}
                  className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative min-h-[460px] group shadow-lg ${
                    pillar.id === 0
                      ? 'bg-[#0A5CFF] border-blue-500'
                      : pillar.id === 1
                      ? 'bg-[#C6FF20] border-lime-300'
                      : pillar.id === 2
                      ? 'bg-white border-slate-200'
                      : 'bg-[#7020DD] border-purple-500'
                  }`}
                >
                  {/* Top Bar Header */}
                  <div className={`p-4 flex items-center justify-between text-[11px] font-mono border-b ${
                    pillar.id === 0
                      ? 'text-blue-100 border-white/20'
                      : pillar.id === 1
                      ? 'text-black/80 border-black/10'
                      : pillar.id === 2
                      ? 'text-slate-600 border-slate-200'
                      : 'text-purple-200 border-white/20'
                  }`}>
                    <span className="font-bold tracking-wider">{pillar.meta}</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">0{pillar.id + 1}</span>
                  </div>

                  {/* Mid Typographic Moment */}
                  <div className="px-5 py-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className={`text-xs font-mono uppercase tracking-widest mb-1 ${
                        pillar.id === 1 || pillar.id === 2 ? 'text-black/60 font-bold' : 'text-white/80'
                      }`}>
                        {pillar.label}
                      </p>
                      <h2 className={`text-4xl sm:text-5xl font-black tracking-tight leading-none ${
                        pillar.id === 1 || pillar.id === 2 ? 'text-black' : 'text-white'
                      }`}>
                        {pillar.name}
                      </h2>
                    </div>

                    {/* Telemetry specs (HEX, RGB, CMYK) */}
                    <div className={`text-[10px] font-mono space-y-0.5 pt-4 ${
                      pillar.id === 1 || pillar.id === 2 ? 'text-black/80 font-medium' : 'text-white/90'
                    }`}>
                      <p className="font-bold">{pillar.hex}</p>
                      <p>{pillar.rgb}</p>
                      <p>{pillar.cmyk}</p>
                    </div>
                  </div>

                  {/* Bottom Textured Visual Asset */}
                  <div className="relative h-44 w-full overflow-hidden border-t border-black/10">
                    <Image
                      src={pillar.image}
                      alt={`${pillar.name} texture`}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Bottom Pill Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                      {pillar.id === 2 ? (
                        <Link
                          href="/dashboard"
                          className="swipe-pill hover:bg-slate-100 hover:border-slate-400 transition-all"
                        >
                          <span>Swipe</span>
                          <span className="text-[#C6FF20] font-mono">&gt;&gt;</span>
                        </Link>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-slate-300 text-[10px] font-mono text-slate-900 font-bold shadow-xs">
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
            TECHNICAL BENTO MATRIX (Engine Capabilities on Light Theme)
            ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
          {/* Tile 1: GitHub Ingestion Pipeline with Blue Accents */}
          <div className="gridster-panel gridster-panel-blue p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#0A5CFF]" />
                  <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                    GitHub Repo Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A5CFF] font-bold">
                  SYNCED
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Connect your GitHub Personal Access Token to auto-discover and triage new repositories.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
                    <span className="text-slate-800 font-semibold">DevCommand-Core</span>
                  </div>
                  <span className="text-[11px] text-slate-500">TypeScript</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7020DD] pulse-violet" />
                    <span className="text-slate-800 font-semibold">AI-Decomposition-Engine</span>
                  </div>
                  <span className="text-[11px] text-slate-500">FastAPI</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
              <span>Encrypted Token Vault</span>
              <span className="text-[#0A5CFF] font-bold">AES-256 ACTIVE</span>
            </div>
          </div>

          {/* Tile 2: Priority-Weighted Velocity Physics with Lime */}
          <div className="gridster-panel gridster-panel-lime p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-lime-600" />
                  <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                    Weighted Velocity Physics
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-100 border border-lime-300 text-lime-800 font-bold">
                  FORMULA
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Progress is computed with mathematical weighting rather than naive feature counts.
              </p>

              <div className="space-y-2 font-mono text-xs mb-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">P0 Critical</span>
                  <span className="text-lime-700 font-bold">4x Multiplier</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">P1 High</span>
                  <span className="text-slate-900 font-bold">3x Multiplier</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">P2 Medium &bull; P3 Low</span>
                  <span className="text-slate-500">2x &bull; 1x Multiplier</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Formula Velocity</p>
                <p className="text-lg font-black font-mono text-slate-900 num-tabular">82.5%</p>
              </div>
              <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-[#C6FF20] rounded-full w-[82.5%]" />
              </div>
            </div>
          </div>

          {/* Tile 3: Multi-Tier AI Cascade with Violet */}
          <div className="gridster-panel gridster-panel-violet p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                    AI Cascade Redundancy
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-bold">
                  3 TIERS
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Never fail an AI decomposition request. Automated failover guarantees continuous roadmap generation.
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-800 font-medium">1. Gemini 2.5 Pro</span>
                  <span className="text-[#0A5CFF] text-[11px] font-bold">Primary</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-800 font-medium">2. Claude 3.5 Sonnet</span>
                  <span className="text-purple-600 text-[11px] font-semibold">Fallback 1</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">3. NVIDIA NIM Meta Llama</span>
                  <span className="text-slate-400 text-[11px]">Fallback 2</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] font-mono text-purple-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Zero Rate-Limit Fallback Guard</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner (Clean light contrast) */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
              Ready to command your software architecture?
            </h3>
            <p className="text-xs text-slate-600 max-w-xl font-mono">
              Initialize your local database, sync your repositories, and generate your first AI feature roadmap in under 60 seconds.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn-lime !py-3 !px-6 text-xs font-extrabold shrink-0 flex items-center gap-2"
          >
            <span>Open Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Gridster Telemetry Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white px-6 py-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900">DEVCOMMAND</span>
          <span>&bull;</span>
          <span>GRIDSTER LIGHT ARCHITECTURE</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-500">BLUE // LIME // WHITE // VIOLET</span>
          <span className="text-[#0A5CFF] font-bold">ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
