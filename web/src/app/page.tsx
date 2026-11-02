'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Check, 
  ShieldCheck, 
  GitBranch, 
  Layers, 
  Cpu, 
  Terminal, 
  Lock, 
  Zap,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

/* Reusable weighted deceleration scroll reveal component (Landing Page Design Rule B7) */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'repo' | 'velocity' | 'ai'>('repo');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does DevCommand connect to my GitHub account?',
      a: 'DevCommand uses official GitHub OAuth 2.0 or an optional Personal Access Token with fine grained permissions. It reads repository metadata, commit timestamps, and branch activity. We never modify your code or branch history without explicit user confirmation.'
    },
    {
      q: 'Will my code or repository data remain private?',
      a: 'Yes. All personal tokens and repository metadata are secured with AES 256 encryption. Database queries strictly enforce tenant user isolation, meaning no other user or organization can ever view your repositories or idea backlogs.'
    },
    {
      q: 'What is the multi tier AI cascade and how does it work?',
      a: 'Rather than relying on a single slow or expensive model, DevCommand routes requests through an intelligent cascade: OpenRouter, Google Gemini, and NVIDIA NIM. This ensures instantaneous responses, zero hallucinated steps, and continuous uptime.'
    },
    {
      q: 'Can I access DevCommand from my phone?',
      a: 'Yes. DevCommand features a native Flutter mobile client for Android alongside our Next.js desktop web app. You can log ideas during your commute and review roadmaps on your computer during deep work.'
    },
    {
      q: 'What happens when my 14 day trial concludes?',
      a: 'You can continue using the community tier for your primary repositories or subscribe to the developer plan for unlimited AI triage and automated branch tracking. No credit card is required to begin.'
    },
    {
      q: 'How does idea graduation work?',
      a: 'The incubator lets you jot down raw project concepts and rate feasibility. Once you are ready to build, one click generates a brand new GitHub repository pre populated with an actionable feature backlog.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black font-sans selection:bg-[#DFFF4F] selection:text-black">
      
      {/* ====================================================================
          1. TOP NAVIGATION HEADER (Color-Blocked Swiss Nav)
          ==================================================================== */}
      <header className="w-full border-b-2 border-black bg-[#F6F3EC] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-black text-[#DFFF4F] font-mono text-xs font-bold flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:bg-[#0047FF] group-hover:text-white transition-colors">
              DC
            </div>
            <span className="font-mono text-xs font-black uppercase tracking-widest text-black">
              DevCommand
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[11px] text-[#555555] border-l-2 border-black/20 pl-4">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>PROJECT COMMAND STUDIO · EST. 2026</span>
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-8 font-mono text-xs font-bold tracking-wider text-black">
          <a href="#workflows" className="hover:text-[#0047FF] transition-colors duration-200">
            01 / WORKFLOWS
          </a>
          <a href="#capabilities" className="hover:text-[#0047FF] transition-colors duration-200">
            02 / CAPABILITIES
          </a>
          <a href="#privacy" className="hover:text-[#0047FF] transition-colors duration-200">
            03 / PRIVACY VAULT
          </a>
          <a href="#faq" className="hover:text-[#0047FF] transition-colors duration-200">
            04 / FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-black text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#0047FF] hover:border-[#0047FF] transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1.5"
            >
              <span>COMMAND CENTER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-xs font-bold px-3 py-1.5 text-black hover:text-[#0047FF] transition-colors duration-200"
              >
                SIGN IN
              </Link>
              <Link
                href="/signup"
                className="font-mono text-xs font-black uppercase tracking-wider px-4 py-2 bg-black text-white border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#0047FF] hover:border-[#0047FF] transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1"
              >
                <span>START FREE TRIAL</span>
                <span className="text-[#DFFF4F]">↗</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ====================================================================
          2. SECTION 1: HERO (Split Color-Block Canvas from design-ref.mp4)
          ==================================================================== */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)] border-b-2 border-black">
        {/* Left Column (Warm Parchment #F6F3EC) */}
        <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-black bg-[#F6F3EC]">
          <div>
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-[#FF5533] mb-8">
              <span className="w-2 h-2 rounded-full bg-[#FF5533] animate-pulse" />
              <span>AUTONOMOUS REPO TRACKING · GITHUB SYNC</span>
            </div>

            {/* Giant Stacked Typographic Treatment */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.88] text-black">
              WE MAKE<br />
              <span className="text-[#0047FF]">PROJECTS</span><br />
              <span className="inline-block mt-3 px-5 py-2 bg-white text-black border-2 border-black shadow-[5px_5px_0px_#000000]">
                SHIP.
              </span>
            </h1>

            {/* Subheadline (Max width, no hyphens, balanced wrapping) */}
            <p className="mt-8 max-w-[540px] text-lg sm:text-xl font-medium text-[#222222] leading-relaxed [text-wrap:pretty]">
              Connect your GitHub repositories in ten seconds. Organize feature backlogs with senior level engineering triage, and graduate raw ideas into shipped software.
            </p>

            {/* Action Group */}
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="font-mono text-sm font-black uppercase tracking-wider px-7 py-3.5 bg-black text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#0047FF] hover:border-[#0047FF] transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-center flex items-center justify-center gap-2"
              >
                <span>START 14 DAY FREE TRIAL</span>
                <span className="text-[#DFFF4F]">↗</span>
              </Link>
              <a
                href="#workflows"
                className="font-mono text-sm font-bold uppercase tracking-wider px-6 py-3.5 bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#EFECE6] transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-center"
              >
                EXPLORE WORKFLOWS
              </a>
            </div>

            {/* Reversal of Objections */}
            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 font-mono text-xs font-semibold text-[#444444]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0047FF]" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0047FF]" /> 100% private repo encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0047FF]" /> Zero manual backlog setup
              </span>
            </div>
          </div>

          {/* Bottom Left Status Bar */}
          <div className="mt-12 pt-6 border-t-2 border-black flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#333333]">
            <span className="font-bold">K-01 / COMMAND CONSOLE</span>
            <span>BUILT FOR AMBITIOUS DEVELOPERS WORLDWIDE</span>
          </div>
        </div>

        {/* Right Column (Royal Cobalt Blue #0047FF Panel with Geometric Rotating Symbol & Live Terminal) */}
        <div className="lg:col-span-5 bg-[#0047FF] p-6 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Top Panel Header */}
          <div className="flex items-center justify-between font-mono text-xs font-bold text-white/90 pb-4 border-b-2 border-white/20">
            <span>VELOCITY ENGINE · v1.0</span>
            <span className="px-2 py-0.5 bg-[#DFFF4F] text-black border border-black font-mono text-[10px] font-black">
              LIVE TELEMETRY
            </span>
          </div>

          {/* Central Rotating Geometric Graphic (Scaled, Centered, and Mathematically True Circle - design-ref.mp4) */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 sm:my-8 relative w-full">
            <svg 
              viewBox="0 0 400 400" 
              className="w-72 h-72 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px] shrink-0 aspect-square select-none pointer-events-none"
            >
              {/* Outer Static Circular Orbit Ring */}
              <circle cx="200" cy="200" r="192" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
              
              {/* Concentric Dashed Rotating Orbit */}
              <circle 
                cx="200" 
                cy="200" 
                r="178" 
                stroke="rgba(255,255,255,0.35)" 
                strokeWidth="1.5" 
                strokeDasharray="8 8" 
                fill="none" 
                className="animate-[spin_60s_linear_infinite] origin-center" 
              />

              {/* Rotating 8-Spoke Gear / Sun Emblem */}
              <g className="animate-[spin_35s_linear_infinite] origin-center">
                {/* 8 Radial Spokes */}
                <rect x="40" y="168" width="320" height="64" rx="4" fill="#FF5533" stroke="#000000" strokeWidth="3" />
                <rect x="40" y="168" width="320" height="64" rx="4" fill="#FF5533" stroke="#000000" strokeWidth="3" transform="rotate(45 200 200)" />
                <rect x="40" y="168" width="320" height="64" rx="4" fill="#FF5533" stroke="#000000" strokeWidth="3" transform="rotate(90 200 200)" />
                <rect x="40" y="168" width="320" height="64" rx="4" fill="#FF5533" stroke="#000000" strokeWidth="3" transform="rotate(135 200 200)" />

                {/* 100% Mathematically Circular Black Center Hub */}
                <circle cx="200" cy="200" r="66" fill="#000000" stroke="#000000" strokeWidth="3" />

                {/* Concentric Inner Circular Layers */}
                <circle cx="200" cy="200" r="44" fill="#0047FF" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                <circle cx="200" cy="200" r="18" fill="#DFFF4F" stroke="#000000" strokeWidth="2" />
                <circle cx="200" cy="200" r="6" fill="#000000" />
              </g>
            </svg>
          </div>

          {/* Hard-Bordered High-Density Interactive Deck */}
          <div className="w-full bg-[#FAF7EE] text-black border-2 border-black shadow-[6px_6px_0px_#000000]">
            {/* Deck Tabs */}
            <div className="grid grid-cols-3 border-b-2 border-black font-mono text-xs font-bold">
              <button
                onClick={() => setActiveConsoleTab('repo')}
                className={`py-2 px-1 text-center border-r-2 border-black transition-colors ${
                  activeConsoleTab === 'repo' ? 'bg-[#DFFF4F] text-black' : 'bg-white hover:bg-[#F6F3EC]'
                }`}
              >
                REPO SYNC
              </button>
              <button
                onClick={() => setActiveConsoleTab('velocity')}
                className={`py-2 px-1 text-center border-r-2 border-black transition-colors ${
                  activeConsoleTab === 'velocity' ? 'bg-[#DFFF4F] text-black' : 'bg-white hover:bg-[#F6F3EC]'
                }`}
              >
                SPRINT
              </button>
              <button
                onClick={() => setActiveConsoleTab('ai')}
                className={`py-2 px-1 text-center transition-colors ${
                  activeConsoleTab === 'ai' ? 'bg-[#DFFF4F] text-black' : 'bg-white hover:bg-[#F6F3EC]'
                }`}
              >
                AI TRIAGE
              </button>
            </div>

            {/* Tab Content 1: Repositories */}
            {activeConsoleTab === 'repo' && (
              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/10">
                  <span className="font-bold flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#0047FF]" />
                    <span>smart-project-manager</span>
                  </span>
                  <span className="px-2 py-0.5 bg-[#BBF7D0] border border-black font-bold text-[10px]">
                    MAIN · 8 COMMITS AHEAD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#555555]">
                  <span>PURPOSE: PRODUCTION SAAS</span>
                  <span>AUTOMATIC WEBHOOK: ACTIVE</span>
                </div>
                <div className="p-2.5 bg-white border border-black font-mono text-[11px] text-black leading-relaxed">
                  <span className="font-bold text-[#0047FF]">AUTO STATUS:</span> Ingested fullstack monorepo with FastAPI backend, Next.js web client, and Flutter mobile.
                </div>
              </div>
            )}

            {/* Tab Content 2: Sprint Velocity */}
            {activeConsoleTab === 'velocity' && (
              <div className="p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">EXECUTION VELOCITY</span>
                  <span className="font-bold text-[#0047FF]">94.2%</span>
                </div>
                <div className="w-full h-3 bg-white border border-black overflow-hidden p-0.5">
                  <div className="h-full bg-[#0047FF] w-[94%]" />
                </div>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>GitHub OAuth 2.0 and PAT login</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Multi tenant user database isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#555555]">
                    <span className="w-3.5 h-3.5 rounded-full border border-black inline-block" />
                    <span>Repository webhook sync</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content 3: AI Triage */}
            {activeConsoleTab === 'ai' && (
              <div className="p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FF5533]">ARCHITECT TRIAGE</span>
                  <span className="px-1.5 py-0.5 bg-[#FF5533] text-white font-bold text-[10px]">P0 PRIORITY</span>
                </div>
                <p className="text-[11px] text-black leading-relaxed bg-white p-2.5 border border-black">
                  Prioritize repository webhook synchronization before scaling mobile client polling to preserve GitHub rate limits.
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#555555] pt-1 border-t border-black/10">
                  <span>CASCADE: GEMINI → NVIDIA</span>
                  <span className="font-bold text-black">LATENCY: 84ms</span>
                </div>
              </div>
            )}

            {/* Deck Footer */}
            <div className="px-4 py-2.5 bg-black text-white font-mono text-[11px] flex items-center justify-between border-t-2 border-black">
              <span>DATABASE MIRROR</span>
              <span className="text-[#DFFF4F]">MONGODB ATLAS · CONNECTED</span>
            </div>
          </div>

          {/* Bottom Panel Metadata */}
          <div className="pt-4 border-t-2 border-white/20 flex items-center justify-between font-mono text-xs text-white/90">
            <span>DATA SEGREGATION: STRICT</span>
            <span>AES 256 VAULT</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. SECTION 2: MANDATORY TAGLINE REVEAL (Rule B11)
          ==================================================================== */}
      <section className="w-full bg-black text-white py-14 px-6 sm:px-12 border-b-2 border-black">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#DFFF4F] block mb-2">
                  02 / THE CORE THESIS
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight [text-wrap:balance]">
                  TOO MANY REPOSITORIES DIE IN SILENCE.<br />
                  <span className="text-[#DFFF4F]">DEVCOMMAND GIVES EVERY REPO A WORKING ROADMAP.</span>
                </h2>
              </div>
              <div className="shrink-0 font-mono text-xs text-white/80 max-w-xs border-l-2 border-[#DFFF4F] pl-5 space-y-1.5">
                <p>Zero abandoned ideas.</p>
                <p>Real GitHub commit velocity.</p>
                <p className="text-[#DFFF4F]">Structured progression from raw spark to public release.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          4. SECTION 3: SELECTED WORKFLOWS (Outline Typography - frame_02_256.jpg)
          ==================================================================== */}
      <section id="workflows" className="w-full bg-[#FAF7EE] border-b-2 border-black py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Row */}
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-4 border-b-2 border-black gap-4">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#0047FF] block mb-1">
                  02 / WORKFLOW ARCHITECTURE
                </span>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black">
                  SELECTED <span className="text-[#0047FF]">WORKFLOWS</span>
                </h2>
              </div>
              <div className="font-mono text-xs font-bold text-[#555555] uppercase tracking-wider">
                SIX REPOSITORY AUTOMATIONS · ZERO TEMPLATES
              </div>
            </div>
          </Reveal>

          {/* Three Tactile Bento Cards with Staggered Scroll Reveals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Repositories */}
            <Reveal delay={100}>
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between h-full hover:shadow-[6px_6px_0px_#000000] transition-shadow duration-300">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black font-mono text-xs font-bold text-black mb-4">
                    <span>SUB / 01</span>
                    <span className="text-[#0047FF]">0.0% / 100%</span>
                  </div>
                  <div className="w-12 h-12 bg-[#DFFF4F] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center mb-4">
                    <GitBranch className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Autonomous Repo Ingestion
                  </h3>
                  <p className="font-mono text-xs text-[#555555] leading-relaxed">
                    As soon as you create or fork a repository on GitHub, DevCommand detects it via webhooks and populates your workspace with branch telemetry.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-black font-mono text-[11px] font-bold text-[#0047FF] flex items-center gap-1">
                  <span>NO MANUAL DATA ENTRY</span>
                  <span>→</span>
                </div>
              </div>
            </Reveal>

            {/* Bento Card 2: AI Triage */}
            <Reveal delay={200}>
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between h-full hover:shadow-[6px_6px_0px_#000000] transition-shadow duration-300">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black font-mono text-xs font-bold text-black mb-4">
                    <span>SUB / 02</span>
                    <span className="text-[#FF5533]">MULTI TIER</span>
                  </div>
                  <div className="w-12 h-12 bg-[#FF5533] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center mb-4">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Tiered AI Engineering Mentor
                  </h3>
                  <p className="font-mono text-xs text-[#555555] leading-relaxed">
                    Queries route across OpenRouter, Gemini, and NVIDIA NIM to break complex feature requests into prioritized checklists with zero hallucination.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-black font-mono text-[11px] font-bold text-[#FF5533] flex items-center gap-1">
                  <span>SENIOR ARCHITECT TRIAGE</span>
                  <span>→</span>
                </div>
              </div>
            </Reveal>

            {/* Bento Card 3: Dual Client */}
            <Reveal delay={300}>
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between h-full hover:shadow-[6px_6px_0px_#000000] transition-shadow duration-300">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black font-mono text-xs font-bold text-black mb-4">
                    <span>SUB / 03</span>
                    <span className="text-black">MOBILE AND WEB</span>
                  </div>
                  <div className="w-12 h-12 bg-[#0047FF] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center mb-4">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Cross Platform Ergonomics
                  </h3>
                  <p className="font-mono text-xs text-[#555555] leading-relaxed">
                    Flutter Android app for logging project ideas and checking off tasks on the move; Next.js 16 desktop interface for deep workspace execution.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-black font-mono text-[11px] font-bold text-black flex items-center gap-1">
                  <span>SEAMLESS STATE SYNC</span>
                  <span>→</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. SECTION 4: CAPABILITIES (Proportional & Sleek Electric Coral Canvas)
          ==================================================================== */}
      <section id="capabilities" className="w-full bg-[#FF5533] text-black border-b-2 border-black py-14 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header row */}
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black mb-8 gap-3">
              <span className="font-mono text-xs font-black uppercase tracking-widest text-black">
                03 / CAPABILITIES
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-black/80">
                FROM RAW COMMIT TO PRODUCTION DEPLOY
              </span>
            </div>

            {/* Compact Heading Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-black">
                  WHAT WE BRING TO{' '}
                  <span className="inline-block px-3.5 py-1 bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000]">
                    THE TABLE.
                  </span>
                </h2>
              </div>
              <p className="font-mono text-xs sm:text-sm font-bold text-black max-w-md leading-relaxed">
                One integrated system from first thought to full expression. No handoffs into a void.
              </p>
            </div>
          </Reveal>

          {/* Streamlined Numbered Rows with Cascading Scroll Reveal */}
          <div className="space-y-0 border-t-2 border-black">
            {/* Capability 1 */}
            <Reveal delay={80}>
              <div className="py-4 sm:py-5 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-black/5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="font-mono text-sm sm:text-base font-black text-black">(01)</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                    REPOSITORY INGESTION
                  </h3>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-mono text-xs text-black/90 max-w-md font-medium">
                    Automatic webhook ingestion of your GitHub repositories with live commit velocity, branch ahead counters, and metadata sync.
                  </p>
                  <span className="font-mono text-2xl font-black group-hover:translate-x-1.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Capability 2 */}
            <Reveal delay={160}>
              <div className="py-4 sm:py-5 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-black/5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="font-mono text-sm sm:text-base font-black text-black">(02)</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                    TIERED AI MENTORSHIP
                  </h3>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-mono text-xs text-black/90 max-w-md font-medium">
                    Autonomous inference routed across OpenRouter, Gemini, and NVIDIA to generate concrete roadmaps and eliminate blockers.
                  </p>
                  <span className="font-mono text-2xl font-black group-hover:translate-x-1.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Capability 3 */}
            <Reveal delay={240}>
              <div className="py-4 sm:py-5 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-black/5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="font-mono text-sm sm:text-base font-black text-black">(03)</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                    IDEA INCUBATOR
                  </h3>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-mono text-xs text-black/90 max-w-md font-medium">
                    Log sparks on mobile. Calculate feasibility scores and graduate ready concepts directly into tracked GitHub repos.
                  </p>
                  <span className="font-mono text-2xl font-black group-hover:translate-x-1.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Capability 4 */}
            <Reveal delay={320}>
              <div className="py-4 sm:py-5 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-black/5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="font-mono text-sm sm:text-base font-black text-black">(04)</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                    STRICT TENANT PRIVACY
                  </h3>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-mono text-xs text-black/90 max-w-md font-medium">
                    Hardware level AES 256 encryption for GitHub credentials. Tenant isolated database querying guarantees your ideas remain private.
                  </p>
                  <span className="font-mono text-2xl font-black group-hover:translate-x-1.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. SECTION 5: PRIVACY VAULT & SECURITY ARCHITECTURE
          ==================================================================== */}
      <section id="privacy" className="w-full bg-[#111111] text-white border-b-2 border-black py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/20 mb-12 gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#DFFF4F]">
                04 / SECURITY AND PRIVACY GUARANTEE
              </span>
              <span className="font-mono text-xs font-bold text-white/60">
                ZERO SOURCE CODE RETENTION · 100% PRIVATE
              </span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <Reveal delay={100}>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-6">
                  YOUR CODE AND IDEAS BELONG TO YOU ALONE.
                </h2>
                <p className="font-mono text-sm text-[#CCCCCC] leading-relaxed max-w-xl">
                  We believe developers should never have to sacrifice repository privacy for roadmap intelligence. DevCommand enforces strict tenant database isolation and client token encryption from day one.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 bg-[#1F1F1F] border-2 border-[#333333] shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center gap-2 text-[#DFFF4F] font-bold mb-1.5">
                      <Lock className="w-4 h-4" />
                      <span>AES 256 VAULT</span>
                    </div>
                    <p className="text-white/70 leading-relaxed">
                      Personal Access Tokens and OAuth secrets are encrypted at rest with hardware backed encryption keys.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1F1F1F] border-2 border-[#333333] shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center gap-2 text-[#DFFF4F] font-bold mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>STRICT MULTI TENANCY</span>
                    </div>
                    <p className="text-white/70 leading-relaxed">
                      Database filters enforce user ID boundaries on every single query. No cross account data leakage.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <div className="bg-[#1F1F1F] border-2 border-white/20 p-6 shadow-2xl font-mono text-xs">
                  <div className="pb-3 border-b border-white/10 flex items-center justify-between text-white/60">
                    <span>SECURITY_AUDIT_LOG</span>
                    <span className="text-[#BBF7D0] font-bold">PASSED</span>
                  </div>
                  <div className="py-4 space-y-2 text-[#BBF7D0]">
                    <div>&gt; GITHUB_TOKEN_STATUS: ENCRYPTED_AES256</div>
                    <div>&gt; TENANT_SEPARATION: ENFORCED</div>
                    <div>&gt; MONGODB_ATLAS_CLUSTER: CONNECTED</div>
                    <div>&gt; THIRD_PARTY_AI_TRAINING: DISABLED</div>
                    <div>&gt; ACCESS_EXPIRATION: AUTOMATIC_INTERCEPT</div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-white/50 text-[11px]">
                    DevCommand never trains AI models on your private repository code or commits.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. SECTION 6: FREQUENTLY ASKED QUESTIONS (FAQ)
          ==================================================================== */}
      <section id="faq" className="w-full bg-[#FAF7EE] border-b-2 border-black py-16 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-black mb-10 gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#0047FF]">
                05 / FREQUENTLY ASKED QUESTIONS
              </span>
              <span className="font-mono text-xs font-bold text-[#555555]">
                TRANSPARENT REPO ANSWERS
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black mb-10">
              EVERYTHING YOU NEED TO KNOW.
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <div className="divide-y-2 divide-black border-y-2 border-black">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <span className="text-lg sm:text-xl font-bold text-black group-hover:text-[#0047FF] transition-colors">
                      {faq.q}
                    </span>
                    <span className="font-mono text-base font-bold ml-4">
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <p className="mt-3 font-mono text-xs sm:text-sm text-[#444444] leading-relaxed [text-wrap:pretty]">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          8. SECTION 7: FINAL CTA & RISK REVERSAL
          ==================================================================== */}
      <section className="w-full bg-[#0047FF] text-white py-20 px-6 sm:px-12 border-b-2 border-black">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <Reveal>
            <span className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-black text-[#DFFF4F] border-2 border-black mb-6 shadow-[2px_2px_0px_#000000] inline-block">
              READY TO SHIP
            </span>
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight [text-wrap:balance]">
              STOP LOSING MOMENTUM ON GOOD IDEAS.
            </h2>
            <p className="mt-6 font-mono text-sm sm:text-base text-white/90 max-w-xl leading-relaxed mx-auto">
              Connect your repositories in ten seconds. Triage your feature backlogs with AI clarity, and start shipping today.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="font-mono text-sm font-black uppercase tracking-wider px-8 py-4 bg-black text-white border-2 border-black hover:bg-[#DFFF4F] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] shadow-[5px_5px_0px_#000000] flex items-center gap-2"
              >
                <span>START 14 DAY FREE TRIAL</span>
                <span className="text-[#DFFF4F]">↗</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 font-mono text-xs font-semibold text-white/90">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> 14 day trial</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Cancel anytime</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          9. FOOTER
          ==================================================================== */}
      <footer className="w-full bg-[#F6F3EC] px-6 sm:px-12 py-10 font-mono text-xs text-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black text-[#DFFF4F] font-mono text-xs font-bold flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000]">
              DC
            </div>
            <span className="font-bold uppercase tracking-widest text-black">
              DEVCOMMAND · EST. 2026
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[#555555] font-bold">
            <a href="#workflows" className="hover:text-black transition-colors">WORKFLOWS</a>
            <a href="#capabilities" className="hover:text-black transition-colors">CAPABILITIES</a>
            <a href="#privacy" className="hover:text-black transition-colors">PRIVACY</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
            <a 
              href="https://github.com/rb-369/Smart-Project-Manager" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <span>GITHUB</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-[#555555]">
            © 2026 DevCommand. All rights reserved.
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#777777] text-[11px]">
          <span>Designed with high density Neo-Brutalist &amp; Swiss editorial engineering principles.</span>
          <span>Zero third party code training · Strict tenant database separation.</span>
        </div>
      </footer>

    </div>
  );
}
