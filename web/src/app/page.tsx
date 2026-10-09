import Link from 'next/link';
import { ArrowRight, Sparkles, GitBranch, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top bar */}
      <header className="px-8 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
            D
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Dev<span className="text-indigo-400">Command</span>
          </span>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
        >
          Open Command Center &rarr;
        </Link>
      </header>

      {/* Hero section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Cross-Platform Project Intelligence (Flutter + Next.js + FastAPI)
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Turn your chaotic repositories into a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
            prioritized roadmap.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          DevCommand automatically ingests newly created GitHub repos, classifies them with multi-tier AI (OpenRouter &rarr; Gemini &rarr; NVIDIA), and provides weighted progress tracking and future project planning.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 transition"
          >
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/settings"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
          >
            Connect GitHub Token
          </Link>
        </div>

        {/* Feature pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Auto-GitHub Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Whenever a repo is created, it automatically appears with stars, language, and README context.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">AI Multi-Tier Cascade</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              OpenRouter free models &rarr; Gemini free tier &rarr; NVIDIA NIM fallback for repo triage and next feature ideas.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Weighted Progress</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quantifiable completion percentage driven by P0, P1, P2 feature completion weights.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-8 py-6 text-center text-xs text-slate-500">
        DevCommand &bull; Built with FastAPI, Next.js, and Flutter &bull; 2026
      </footer>
    </div>
  );
}
