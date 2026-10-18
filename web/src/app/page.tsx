'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, 
  GitBranch, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Terminal,
  Bot,
  Lightbulb,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'velocity' | 'triaged'>('all');

  const tickerItems = [
    '⚡ AUTONOMOUS REPO INGESTION',
    '⚡ GITHUB OAUTH & SEPARATE TENANTS',
    '⚡ MONGODB ATLAS CLUSTER PERSISTENCE',
    '⚡ AI ROADMAP DECOMPOSITION',
    '⚡ MATHEMATICAL VELOCITY PHYSICS',
    '⚡ MULTI-TIER AI INFERENCE',
    '⚡ AES-256 VAULT SECURITY',
    '⚡ HIGH-VELOCITY DEPLOYS'
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#C6FF20] selection:text-black">
      
      {/* ====================================================================
          1. TOP HERO SECTION: VIBRANT ELECTRIC BLUE CANVAS (Reference Style)
          ==================================================================== */}
      <section className="bg-blue-grid text-white pt-6 pb-28 px-4 sm:px-6 relative overflow-hidden">
        
        {/* Subtle Ambient Vignettes on Blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Top Navigation Header */}
        <header className="max-w-6xl mx-auto w-full z-40 px-4 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-between shadow-xl mb-12 sm:mb-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-white/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative p-1 shrink-0">
                <svg viewBox="0 0 512 512" fill="none" className="w-full h-full drop-shadow">
                  <path d="M208 116 L288 116 L226 232 L286 232 L150 408 L184 274 L140 274 Z" fill="#C6FF20" />
                  <path d="M306 132 L394 256 L306 380 L254 380 L336 264 L336 248 L254 132 Z" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-white leading-none">
                  DevCommand
                </span>
                <span className="text-[9px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                  AUTONOMOUS ENGINE
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/10 text-[10px] font-mono text-white/90">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20]" />
              <span className="font-bold text-[#C6FF20]">ONLINE</span>
              <span className="opacity-40">|</span>
              <span>BLUE &bull; LIME &bull; WHITE &bull; VIOLET</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-white/90">
            <Link href="/dashboard" className="hover:text-white transition-colors">Command Center</Link>
            <Link href="/ideas" className="hover:text-white transition-colors">Incubator</Link>
            <Link href="/settings" className="hover:text-white transition-colors">API Keys</Link>
            <a href="https://github.com/rb-369/Smart-Project-Manager" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn-lime !py-1.5 !px-4 text-xs font-black flex items-center gap-1.5 shadow-md"
              >
                <span>Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-lime !py-1.5 !px-4 text-xs font-black flex items-center gap-1.5 shadow-md"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>Sign In with GitHub</span>
              </Link>
            )}
          </div>
        </header>

        {/* Hero Content Block */}
        <div className="max-w-6xl mx-auto text-center relative z-10 pt-4 pb-16">
          
          {/* Top Neon Badge Pill */}
          <div className="flex justify-center mb-6">
            <span className="lime-sticker text-xs font-black shadow-[0_4px_16px_rgba(198,255,32,0.4)]">
              ⚡ REPO ROADMAP &amp; VELOCITY INTELLIGENCE
            </span>
          </div>

          {/* Massive Stacked White Headline */}
          <div className="relative inline-block max-w-5xl mx-auto px-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase leading-[0.95]">
              <div className="tracking-tight mb-2">AUTONOMOUS REPO</div>
              <div className="flex items-center justify-center flex-wrap gap-3 mt-1 sm:mt-2">
                <span className="tracking-tight">ENGINEERING &amp;</span>
                <span className="inline-block bg-[#C6FF20] text-black px-4 py-1 sm:py-2 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl md:text-5xl font-black shadow-[0_8px_30px_rgba(198,255,32,0.6)] -rotate-1 hover:rotate-0 transition-transform">
                  TASK ROADMAPS
                </span>
              </div>
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
            Automated GitHub ingestion, multi-tier AI feature decomposition, and mathematical velocity physics for ambitious software engineers.
          </p>

          {/* Action CTAs & Neon Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="btn-lime !py-3.5 !px-8 text-sm font-black flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(198,255,32,0.5)] hover:scale-105 transition-all"
                >
                  <span>OPEN COMMAND CENTER</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/ideas"
                  className="py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-2 backdrop-blur-md"
                >
                  <Lightbulb className="w-4 h-4 text-[#C6FF20]" />
                  <span>INCUBATOR IDEAS</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-lime !py-3.5 !px-8 text-sm font-black flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(198,255,32,0.5)] hover:scale-105 transition-all"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>CONTINUE WITH GITHUB</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/login"
                  className="py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-2 backdrop-blur-md"
                >
                  <Terminal className="w-4 h-4 text-[#C6FF20]" />
                  <span>SIGN IN / DEMO ACCOUNTS</span>
                </Link>
              </>
            )}
          </div>

          {/* Floating 3D Repository Cards & Circular Stamp (Reference 2 style) */}
          <div className="mt-14 relative max-w-4xl mx-auto flex items-center justify-center gap-6 flex-wrap sm:flex-nowrap">
            
            {/* Left Tilted Card: Smart Project Manager */}
            <div className="animate-tilt-left w-64 p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/30 text-left shadow-2xl hover:scale-105 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#C6FF20] text-black flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  LIVE REPO
                </span>
              </div>
              <p className="font-bold text-sm text-white truncate">Smart-Project-Manager</p>
              <p className="text-[11px] text-white/80 mt-1">Autonomous triage & feature matrix</p>
              <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-[#C6FF20] font-bold">
                <span>VELOCITY: 94%</span>
                <span className="text-white">P0: 0 CRITICAL</span>
              </div>
            </div>

            {/* Center High-Tech Telemetry Node */}
            <div className="shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center shadow-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#C6FF20] animate-pulse" />
                <span className="text-[10px] font-mono font-black text-[#C6FF20] uppercase tracking-wider">
                  SYNC ENGINE
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/90 font-bold">
                GitHub &bull; MongoDB Atlas
              </div>
            </div>

            {/* Right Tilted Card: Multi-Agent Copilot */}
            <div className="animate-tilt-right w-64 p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/30 text-left shadow-2xl hover:scale-105 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#7020DD] text-white flex items-center justify-center font-bold text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  SUB-AGENTS
                </span>
              </div>
              <p className="font-bold text-sm text-white truncate">Multi-Agent Copilot</p>
              <p className="text-[11px] text-white/80 mt-1">Planner &bull; Researcher &bull; Judge</p>
              <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white font-bold">
                <span className="text-[#C6FF20]">AUTONOMOUS</span>
                <span>SYNCED</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          2. ACID LIME TICKER MARQUEE TAPE (Direct Signature from Reference 1)
          ==================================================================== */}
      <div className="w-full bg-[#C6FF20] text-black font-mono font-black text-xs sm:text-sm uppercase py-3.5 tracking-wider border-y-2 border-black/15 overflow-hidden select-none relative z-30 shadow-lg">
        <div className="animate-marquee gap-8">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 font-bold text-lg">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. CLEAN BRIGHT WHITE CURVED SHEET (Direct Signature from Reference 1 & 2)
          ==================================================================== */}
      <section className="bg-white text-slate-900 rounded-t-[44px] sm:rounded-t-[60px] -mt-6 relative z-20 shadow-2xl pt-20 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        
        {/* Section Header: CREATIVE [SOLUTIONS] JUST FOR YOU */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-[11px] font-mono font-black text-[#0038FF] uppercase tracking-widest">
                ARCHITECTURAL CAPABILITIES
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 uppercase leading-none">
              <span>BUILT FOR</span>
              <span className="violet-pill-badge mx-2.5 sm:mx-3 text-sm sm:text-xl align-middle shadow-md">
                ENGINEERING TEAMS
              </span>
              <span>THAT SHIP</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-md">
            <p className="text-xs text-slate-600 leading-relaxed">
              Every repository ingested into DevCommand is enriched with multi-tiered AI decomposition, mathematical milestone weighting, and zero-leak security.
            </p>
            <Link
              href="/dashboard"
              className="btn-lime !py-2 !px-4 text-xs font-black shrink-0 self-start sm:self-auto border border-black/10 shadow-xs"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Signature Feature Cards (Directly Matching Reference 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: REPOSITORY VAULT */}
          <div className="gridster-panel p-6 bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all rounded-3xl flex flex-col justify-between">
            <div>
              <div className="text-center mb-5">
                <span className="text-xs font-mono font-extrabold text-[#0038FF] uppercase tracking-widest">
                  INGESTION ENGINE
                </span>
                <h3 className="text-lg font-black text-slate-950 uppercase mt-0.5 tracking-tight">
                  AUTOMATED REPO VAULT
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Continuous GitHub synchronization with AES-256 encrypted access.
                </p>
              </div>

              {/* Electric Blue Inner Box (Reference 1 Card Preview) */}
              <div className="bg-[#0038FF] text-white rounded-2xl p-5 shadow-inner flex flex-col justify-between min-h-[170px] relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <GitBranch className="w-5 h-5 text-[#C6FF20]" />
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    AES-256
                  </span>
                </div>
                <div className="space-y-1 my-2">
                  <div className="text-xs font-mono text-white/80">Repository Vault</div>
                  <div className="text-xl font-black text-white">100% Ingested</div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-white/70 pt-2 border-t border-white/20">
                  <span>Zero-leak Auth</span>
                  <span className="text-[#C6FF20] font-bold">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 font-bold">Pipeline Sync</span>
              <Link href="/dashboard" className="text-xs font-bold text-[#0038FF] hover:underline flex items-center gap-1">
                <span>Explore</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: MULTI-AGENT INTELLIGENCE */}
          <div className="gridster-panel p-6 bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all rounded-3xl flex flex-col justify-between">
            <div>
              <div className="text-center mb-5">
                <span className="text-xs font-mono font-extrabold text-[#7020DD] uppercase tracking-widest">
                  COPILOT &amp; TRIAGE
                </span>
                <h3 className="text-lg font-black text-slate-950 uppercase mt-0.5 tracking-tight">
                  MULTI-AGENT INTELLIGENCE
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specialized sub-agents for roadmapping, priority matrix, and research.
                </p>
              </div>

              {/* Electric Blue Inner Box (Reference 1 Card Preview) */}
              <div className="bg-[#0038FF] text-white rounded-2xl p-5 shadow-inner flex flex-col justify-between min-h-[170px] relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <Bot className="w-5 h-5 text-[#C6FF20]" />
                  <span className="text-[10px] font-mono bg-[#7020DD] px-2 py-0.5 rounded-full font-bold">
                    SUB-AGENTS
                  </span>
                </div>
                <div className="space-y-1 my-2">
                  <div className="text-xs font-mono text-white/80">Agent Coordination</div>
                  <div className="text-xl font-black text-white">Planner &bull; Researcher &bull; Judge</div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-white/70 pt-2 border-t border-white/20">
                  <span>Precision Triage</span>
                  <span className="text-[#C6FF20] font-bold">OPTIMIZED</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 font-bold">AI Strategist</span>
              <Link href="/ideas" className="text-xs font-bold text-[#0038FF] hover:underline flex items-center gap-1">
                <span>Incubate</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: VIBRANT ACID-LIME CARD */}
          <div className="rounded-3xl p-6 bg-[#C6FF20] text-black border-2 border-black/15 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between">
            <div>
              <div className="text-center mb-5">
                <span className="text-xs font-mono font-black text-black/60 uppercase tracking-widest">
                  VELOCITY COMPUTATION
                </span>
                <h3 className="text-lg font-black text-black uppercase mt-0.5 tracking-tight">
                  BURNDOWN PHYSICS
                </h3>
                <p className="text-xs text-black/80 mt-1 font-medium">
                  Weighted velocity scoring: P0 (4x), P1 (3x), P2 (2x), P3 (1x).
                </p>
              </div>

              {/* White Inner Box on Lime Card */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 border border-black/10 shadow-sm flex flex-col justify-between min-h-[170px]">
                <div className="flex items-center justify-between">
                  <Zap className="w-5 h-5 text-[#0038FF]" />
                  <span className="text-[10px] font-mono bg-black/10 px-2 py-0.5 rounded-full font-black text-black">
                    WEIGHTED
                  </span>
                </div>
                <div className="space-y-1 my-2">
                  <div className="text-xs font-mono text-slate-500">Milestone Accuracy</div>
                  <div className="text-2xl font-black text-slate-950">99.4% Projected</div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                  <span>Zero Lag Delivery</span>
                  <span className="text-[#0038FF] font-black">UNLOCKED</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-black/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-black/80">Velocity Telemetry</span>
              <Link href="/dashboard" className="text-xs font-black text-black hover:underline flex items-center gap-1">
                <span>View Waveform</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* ==================================================================
            4. ELECTRIC BLUE QUOTE & STATEMENT BANNER (Reference 1 Middle Banner)
            ================================================================== */}
        <div className="mt-16 bg-[#0038FF] text-white rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          
          {/* Subtle Grid texture */}
          <div className="absolute inset-0 bg-blue-grid opacity-30 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            
            {/* Collaboration Partners Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-white/70 uppercase tracking-widest font-semibold border-b border-white/20 pb-5">
              <span>ENGINEERED FOR</span>
              <span className="text-white font-bold">GITHUB</span>
              <span className="text-[#C6FF20]">&bull;</span>
              <span className="text-white font-bold">VERCEL</span>
              <span className="text-[#C6FF20]">&bull;</span>
              <span className="text-white font-bold">FASTAPI</span>
              <span className="text-[#C6FF20]">&bull;</span>
              <span className="text-white font-bold">GEMINI 2.5</span>
            </div>

            {/* Big Impact Statement */}
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              DECOMPILE RAW REPOSITORIES INTO{' '}
              <span className="inline-flex items-center gap-2 bg-[#C6FF20] text-black px-3.5 py-1 rounded-full text-xl sm:text-3xl font-black shadow-lg mx-1 my-1">
                <span className="w-3 h-3 rounded-full bg-black" />
                ACTIONABLE ROADMAPS
              </span>{' '}
              AND PRODUCTION DEPLOYMENTS.
            </h3>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="btn-lime !py-3 !px-8 text-sm font-black inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <span>OPEN COMMAND CENTER</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================================
            5. "OUR BEST WORK" SHOWCASE & WORKSPACES (Reference 1 & 2 Bottom Section)
            ================================================================== */}
        <div className="mt-16 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-extrabold text-[#0038FF] uppercase tracking-wider">
                WORKSPACE INTELLIGENCE
              </span>
              <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
                CONTINUOUS WORKFLOWS
              </h3>
            </div>

            {/* Filter Pills (Reference 1 style) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-[#C6FF20] text-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedFilter('velocity')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  selectedFilter === 'velocity'
                    ? 'bg-[#C6FF20] text-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HIGH VELOCITY
              </button>
              <button
                onClick={() => setSelectedFilter('triaged')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  selectedFilter === 'triaged'
                    ? 'bg-[#C6FF20] text-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI TRIAGED
              </button>
            </div>
          </div>

          {/* 3 Bottom Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Subscribe / Connect to Repos */}
            <div className="gridster-panel p-6 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">
                  CONTINUOUS REPO SYNC
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Automated webhook updates, branch tracking, and commit ingestion.
                </p>

                <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0038FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      DC
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">devcommand.core</div>
                      <div className="text-[10px] text-slate-500 font-mono">14 contributors</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-full bg-[#C6FF20] text-black border border-black/10">
                    LIVE WEBHOOK
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Webhook Polling</span>
                <span className="text-[#0038FF] font-bold">Every 60s</span>
              </div>
            </div>

            {/* Card 2: Choose High Priority Rewards / Triage */}
            <div className="gridster-panel p-6 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">
                  WEIGHTED BACKLOG TRIAGE
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Calculated priority distribution ensuring P0 blockers get resolved first.
                </p>

                <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    P0: Critical 4x
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#C6FF20] text-black flex items-center justify-center font-bold text-sm border border-black/10">
                    &rarr;
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0038FF]">
                    P3: Low 1x
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Backlog Health</span>
                <span className="text-emerald-600 font-bold">Optimal</span>
              </div>
            </div>

            {/* Card 3: Stake Velocity for Teams */}
            <div className="gridster-panel p-6 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">
                  PRODUCTION DEPLOYMENT RADAR
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Direct live URLs with Vercel and cloud deployment telemetry.
                </p>

                <div className="mt-5 p-3 rounded-2xl bg-[#C6FF20] text-black border border-black/10 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/70">
                    CLOUD DEPLOYMENT STATUS
                  </div>
                  <div className="text-2xl font-black text-black num-tabular mt-0.5">
                    100% VERIFIED
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Cloud Live Status</span>
                <span className="text-[#0038FF] font-bold">Active &amp; Passing</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Clean Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
              <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
                <path d="M208 116 L288 116 L226 232 L286 232 L150 408 L184 274 L140 274 Z" fill="#C6FF20" />
                <path d="M306 132 L394 256 L306 380 L254 380 L336 264 L336 248 L254 132 Z" fill="#FFFFFF" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">DevCommand</span>
            <span>&bull; Autonomous Repository Intelligence</span>
          </div>
          <div>
            <span>SPECTRUM: BLUE (#0038FF) &bull; LIME (#C6FF20) &bull; WHITE (#FFFFFF) &bull; VIOLET (#7020DD)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
