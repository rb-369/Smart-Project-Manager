import Link from 'next/link';
import { ArrowRight, GitBranch, Cpu, Layers, Sparkles, Activity, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] text-[#f8fafc] flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Optical Glow Orbs */}
      <div className="liquid-glow-orb-purple -top-40 left-1/4" />
      <div className="liquid-glow-orb-cyan top-48 -right-40" />
      <div className="liquid-glow-orb-emerald -bottom-20 left-1/3" />
      <div className="liquid-glow-orb-magenta bottom-96 -left-32" />

      {/* Floating Island Navigation Header */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 floating-glass-island px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-xl blur-[3px] opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8 h-8 rounded-xl bg-[#080a10] border border-white/20 flex items-center justify-center font-mono text-xs font-bold text-white shadow-inner">
              <span className="bg-gradient-to-br from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                DC
              </span>
            </div>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            Dev<span className="text-[#a5b4fc]">Command</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs text-[#94a3b8] hover:text-white transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-white/[0.05]"
          >
            Settings
          </Link>
          <Link
            href="/dashboard"
            className="glass-pill-btn !py-1.5 !px-4 text-xs font-semibold bg-violet-600/30 border-violet-500/40 text-white flex items-center gap-1.5"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-36 pb-20 sm:pt-40 space-y-16 relative z-10 w-full">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Holographic Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/15 text-cyan-300 text-xs font-mono shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Liquid Glass Architecture &bull; Linear/VisionOS Tier</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Transform scattered codebases into an intentional engineering roadmap.
          </h1>

          <p className="text-base sm:text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed font-light">
            Automated GitHub repository ingestion, multi-tier AI inference for feature decomposition, and mathematical weighted progress physics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto glass-pill-btn !py-3.5 !px-7 text-sm font-semibold bg-violet-600/30 border-violet-500/40 text-white flex items-center justify-center gap-2"
            >
              <span>Enter Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="w-full sm:w-auto glass-pill-btn !py-3.5 !px-6 text-sm font-medium text-[#cbd5e1] hover:text-white flex items-center justify-center"
            >
              Configure GitHub Token
            </Link>
          </div>
        </div>

        {/* Double-Bezel Glass Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Block 1: Real-time Ingestion Stream */}
          <div className="glass-shell md:col-span-2">
            <div className="glass-core p-6 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-white">Live GitHub Ingestion Pipeline</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  AES-256 Encrypted
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan" />
                    <span className="text-[#f1f5f9]">smart-project-manager</span>
                  </div>
                  <span className="text-[11px] text-[#64748b]">TypeScript &bull; Synced</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 glow-violet" />
                    <span className="text-[#f1f5f9]">autonomous-eval-suite</span>
                  </div>
                  <span className="text-[11px] text-[#64748b]">Python &bull; Synced</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25 flex items-center justify-between text-amber-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 glow-amber animate-pulse" />
                    <span>neural-query-engine</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-300">Queued for Triage</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.06] text-xs text-[#94a3b8] flex items-center justify-between font-mono">
                <span>Automatic background synchronization</span>
                <span className="text-cyan-400 text-[11px]">200 OK</span>
              </div>
            </div>
          </div>

          {/* Block 2: Multi-Tier AI Cascade */}
          <div className="glass-shell">
            <div className="glass-core p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-violet-400" />
                    AI Cascade Matrix
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    Active
                  </span>
                </div>

                <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                  Zero rate-limit cascading across multi-provider cloud endpoints:
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-slate-300">1. Gemini 2.5 Pro</span>
                    <span className="text-emerald-400 text-[11px] font-semibold">Primary</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-slate-300">2. Claude 3.5 Sonnet</span>
                    <span className="text-cyan-400 text-[11px] font-semibold">Fallback 1</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-slate-300">3. NVIDIA NIM</span>
                    <span className="text-violet-400 text-[11px] font-semibold">Fallback 2</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full Tier Redundancy Active</span>
              </div>
            </div>
          </div>

          {/* Block 3: Weighted Progress Physics */}
          <div className="glass-shell md:col-span-3">
            <div className="glass-core p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Priority-Weighted Progress Physics</h3>
                  </div>
                  <p className="text-xs text-[#94a3b8] max-w-2xl">
                    Deliverables are weighted mathematically: P0 Critical (4x) &bull; P1 High (3x) &bull; P2 Medium (2x) &bull; P3 Nice-to-have (1x) to ensure accurate milestone velocity.
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-[#64748b] font-mono">Formula Velocity</p>
                    <p className="text-xl font-extrabold text-white font-mono num-tabular">82.5%</p>
                  </div>
                  <div className="w-28 h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.08]">
                    <div className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-full w-[82%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-8 py-6 text-center text-xs text-[#64748b] font-mono">
        DevCommand &bull; Engineered with Liquid Glassmorphic Craft &bull; 2026
      </footer>
    </div>
  );
}
