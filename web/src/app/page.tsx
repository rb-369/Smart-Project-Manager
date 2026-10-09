import Link from 'next/link';
import { ArrowRight, GitBranch, Cpu, Layers, Sparkles, Terminal, Activity, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col justify-between selection:bg-indigo-500/40 selection:text-white relative overflow-hidden">
      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full" />

      {/* Top Header */}
      <header className="px-6 sm:px-10 py-5 border-b border-white/[0.07] bg-[#08090d]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-sky-400 rounded-lg blur-[2px] opacity-70" />
            <div className="relative w-8 h-8 rounded-lg bg-[#0e1018] border border-white/20 flex items-center justify-center font-mono text-xs font-bold text-white shadow-inner">
              DC
            </div>
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            Dev<span className="text-[#a5b4fc]">Command</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="text-xs text-[#94a3b8] hover:text-white transition-colors font-medium"
          >
            Settings
          </Link>
          <Link
            href="/dashboard"
            className="bento-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-24 space-y-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Holographic Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121422]/90 border border-indigo-500/30 text-indigo-300 text-xs font-mono shadow-[0_0_20px_-3px_rgba(99,102,241,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>Next-Gen Engineering Roadmap Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Transform scattered repositories into an intentional engineering roadmap.
          </h1>

          <p className="text-base sm:text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Automated GitHub repository ingestion, multi-tier AI inference for feature decomposition, and mathematical weighted progress milestones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bento-btn-primary px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              Enter Command Center <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1] hover:text-white text-sm font-medium border border-white/[0.08] transition shadow-inner"
            >
              Configure GitHub Token
            </Link>
          </div>
        </div>

        {/* High-End Bento Interactive Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Block 1: Real-time Ingestion Stream */}
          <div className="bento-card p-6 flex flex-col justify-between md:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-semibold text-white">Live GitHub Ingestion Pipeline</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                AES-256 Encrypted
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#0c0d15] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 glow-blue" />
                  <span className="text-[#f1f5f9]">smart-project-manager</span>
                </div>
                <span className="text-[11px] text-[#64748b]">TypeScript &bull; Synced</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0c0d15] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-[#f1f5f9]">autonomous-eval-suite</span>
                </div>
                <span className="text-[11px] text-[#64748b]">Python &bull; Synced</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/25 flex items-center justify-between text-amber-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 glow-amber animate-ping" />
                  <span>neural-query-engine</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-300">Queued for Triage</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/[0.06] text-xs text-[#94a3b8] flex items-center justify-between">
              <span>Automatic sync via periodic polling & on-demand trigger</span>
              <span className="text-sky-400 font-mono text-[11px]">200 OK</span>
            </div>
          </div>

          {/* Bento Block 2: Multi-Tier AI Cascade Telemetry */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  AI Cascade
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                  Resilient
                </span>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                High-availability LLM cascading guarantees zero rate-limit interruptions:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-slate-300">1. OpenRouter Free</span>
                  <span className="text-emerald-400 text-[11px]">Primary</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-slate-300">2. Google Gemini 2.5</span>
                  <span className="text-sky-400 text-[11px]">Fallback</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-slate-300">3. NVIDIA NIM</span>
                  <span className="text-purple-400 text-[11px]">Fallback 2</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Tier Redundancy Active</span>
            </div>
          </div>

          {/* Bento Block 3: Weighted Progress Physics */}
          <div className="bento-card p-6 md:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Priority-Weighted Progress Physics</h3>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Features are weighted proportionally to enforce genuine milestone velocity: P0 Critical (4x) &bull; P1 High (3x) &bull; P2 Medium (2x) &bull; P3 Nice-to-have (1x).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-[#64748b] font-mono">Formula Velocity</p>
                  <p className="text-xl font-extrabold text-white font-mono num-tabular">78.5%</p>
                </div>
                <div className="w-24 h-2 bg-[#171a27] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full w-[78%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-8 py-6 text-center text-xs text-[#64748b] font-mono">
        DevCommand // Designed with High-End Holographic Bento Craft &bull; 2026
      </footer>
    </div>
  );
}
