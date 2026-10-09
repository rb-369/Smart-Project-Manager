'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Settings, FolderKanban, ShieldCheck } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Future Ideas', href: '/ideas', icon: Lightbulb },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Command Center
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            AI Fallback Active
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            OpenRouter &rarr; Gemini &rarr; NVIDIA cascade ready for repo triage and feature suggestions.
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>DevCommand Engine</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </div>
    </aside>
  );
}
