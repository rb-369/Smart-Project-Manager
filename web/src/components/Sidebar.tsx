'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Settings, Cpu, Sparkles, Activity } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Idea Incubator', href: '/ideas', icon: Lightbulb },
    { label: 'Settings & Tokens', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-white/[0.07] bg-[#090b11]/60 backdrop-blur-xl flex flex-col justify-between p-3.5 min-h-[calc(100vh-3.5rem)] shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-2.5 mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#64748b]">
            <span>Workspace</span>
            <Activity className="w-3 h-3 text-[#38bdf8]" />
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white font-semibold border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                      : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#818cf8]' : 'text-[#64748b]'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 glow-blue" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Tier Holographic Telemetry Box */}
        <div className="p-3.5 rounded-xl bg-[#0f121d]/80 border border-white/[0.08] space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e2e8f0]">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Engine Matrix</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              Active
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-[#94a3b8]">
            <div className="flex items-center justify-between">
              <span>Tier 1: OpenRouter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Tier 2: Gemini 2.5</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Tier 3: NVIDIA NIM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-[#64748b] flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 glow-emerald animate-pulse" />
          <span>Local SQLite</span>
        </span>
        <span className="text-[10px] text-[#94a3b8]">200 OK</span>
      </div>
    </aside>
  );
}
