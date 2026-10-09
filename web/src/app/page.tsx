import Link from 'next/link';
import { ArrowRight, Terminal, GitBranch, Cpu, ShieldCheck, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f7] flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[#1c1d28] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#181a24] border border-[#2a2e40] flex items-center justify-center font-mono text-xs font-bold text-white">
            DC
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#f4f4f7]">
            DevCommand
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs text-[#8b8f9e] hover:text-[#f4f4f7] transition font-medium px-2.5 py-1"
          >
            Settings
          </Link>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#f4f4f7] hover:bg-white text-[#090a0f] transition shadow-sm font-sans"
          >
            Open Command Center &rarr;
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
            Turn chaotic repositories into a structured engineering roadmap.
          </h1>

          <p className="text-sm sm:text-base text-[#8b8f9e] max-w-2xl leading-relaxed">
            DevCommand automatically tracks your GitHub repositories, auto-classifies them via multi-tier AI inference, and calculates weighted progress milestones across web and mobile.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium flex items-center gap-2 shadow-sm transition"
            >
              Launch Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-md bg-[#13141f] hover:bg-[#1c1d2c] text-[#c5c8d6] text-xs font-medium border border-[#242636] transition"
            >
              Connect GitHub Token
            </Link>
          </div>
        </div>

        {/* Real Terminal / Workflow Preview (No Generic Cards) */}
        <div className="rounded-lg border border-[#222433] bg-[#0d0e15] overflow-hidden shadow-2xl">
          {/* Terminal Titlebar */}
          <div className="px-4 py-2.5 bg-[#12131c] border-b border-[#1c1e2b] flex items-center justify-between text-xs font-mono text-[#6c7082]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2a2c3a]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2a2c3a]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2a2c3a]" />
              <span className="ml-2 text-[#8b8f9e]">devcommand-engine // live-session</span>
            </div>
            <span>fastapi:8000</span>
          </div>

          {/* Terminal Body */}
          <div className="p-5 font-mono text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-[#3b82f6]">$</span>
              <span className="text-[#e2e4eb]">devcommand sync --target github.com/developer</span>
            </div>
            <div className="text-[#8b8f9e] pl-4 space-y-1">
              <p>&rarr; Discovered 12 public & private repositories</p>
              <p>&rarr; Encrypted token verified (AES-256 Fernet at rest)</p>
              <p className="text-amber-400">&bull; 1 new repository queued for triage: <span className="text-white">smart-task-engine</span></p>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-[#1a1b26]">
              <span className="text-[#3b82f6]">$</span>
              <span className="text-[#e2e4eb]">devcommand ai triage smart-task-engine</span>
            </div>
            <div className="text-[#8b8f9e] pl-4 space-y-1">
              <p>&rarr; Executing cascade: OpenRouter (Tier 1) &rarr; Gemini (Tier 2) &rarr; NVIDIA (Tier 3)</p>
              <p className="text-emerald-400">&radic; Successfully classified as PRODUCTION READY [Python/FastAPI]</p>
              <p>&radic; Generated 4 initial backlog features with priority scoring [P0: 1, P1: 2, P2: 1]</p>
            </div>
          </div>
        </div>

        {/* Engineering Architecture Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1c1d28]">
          <div className="p-4 rounded-lg bg-[#111218] border border-[#202230] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <GitBranch className="w-4 h-4 text-blue-400" />
              <span>GitHub Auto-Ingestion</span>
            </div>
            <p className="text-xs text-[#7c8091] leading-relaxed">
              Real-time synchronization of newly created repositories with language detection, README context, and star count.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#111218] border border-[#202230] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Multi-Tier AI Cascade</span>
            </div>
            <p className="text-xs text-[#7c8091] leading-relaxed">
              OpenRouter free models &rarr; Google Gemini &rarr; NVIDIA NIM fallback guarantee uninterrupted feature suggestions.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#111218] border border-[#202230] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Priority-Weighted Velocity</span>
            </div>
            <p className="text-xs text-[#7c8091] leading-relaxed">
              Mathematical progress tracking where P0, P1, and P2 features carry balanced proportional weight toward completion.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1c1d28] px-6 py-4 text-center text-xs text-[#5c6072] font-mono">
        DevCommand // Cross-Platform Engineering Suite
      </footer>
    </div>
  );
}
