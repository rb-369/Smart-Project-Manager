'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Settings, Terminal, Cpu } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Idea Incubator', href: '/ideas', icon: Lightbulb },
    { label: 'Settings & Tokens', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-[#222433] bg-[#0c0d13] flex flex-col justify-between p-3.5 min-h-[calc(100vh-3.5rem)] shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-2.5 mb-2 flex items-center justify-between text-[11px] font-semibold text-[#666a7b] tracking-wider uppercase">
            <span>Navigation</span>
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#181a26] text-[#ffffff] font-semibold border border-[#2a2e42]'
                      : 'text-[#8b8f9e] hover:text-[#e4e6ed] hover:bg-[#13141f]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-[#666a7b]'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Tier Status */}
        <div className="p-3 rounded-lg bg-[#11121a] border border-[#202230] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#c5c8d6]">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Cascade Ready</span>
          </div>
          <p className="text-[11px] text-[#6b6f80] leading-relaxed">
            OpenRouter &rarr; Gemini &rarr; NVIDIA fallback engine active.
          </p>
        </div>
      </div>

      <div className="px-2.5 py-2 border-t border-[#1c1e2b] text-[11px] text-[#5c6070] flex items-center justify-between font-mono">
        <span>SQLite / Ready</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
      </div>
    </aside>
  );
}
