'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Settings, Cpu, Bot, Activity } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Copilot & Judge', href: '/chat', icon: Bot },
    { label: 'Idea Incubator', href: '/ideas', icon: Lightbulb },
    { label: 'Settings & Tokens', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r-2 border-black bg-[#FAF7EE] flex flex-col justify-between p-4 min-h-[calc(100vh-53px)] shrink-0 font-mono">
      <div className="space-y-6">
        <div>
          <div className="px-2 mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#555555] border-b-2 border-black pb-2">
            <span>WORKSPACE</span>
            <Activity className="w-3.5 h-3.5 text-[#0047FF]" />
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-all border-2 ${
                    isActive
                      ? 'bg-[#DFFF4F] text-black border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]'
                      : 'bg-white text-black border-transparent hover:border-black hover:bg-[#F6F3EC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#555555]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Tier Matrix Deck */}
        <div className="p-3.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-black">
            <div className="flex items-center gap-1.5 text-xs font-bold text-black">
              <Cpu className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>AI MATRIX</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#BBF7D0] border border-black">
              ONLINE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-[#444444]">
            <div className="flex items-center justify-between">
              <span>Tier 1: OpenRouter</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <div className="flex items-center justify-between">
              <span>Tier 2: Gemini 2.5</span>
              <span className="w-2 h-2 rounded-full bg-[#0047FF]" />
            </div>
            <div className="flex items-center justify-between">
              <span>Tier 3: NVIDIA NIM</span>
              <span className="w-2 h-2 rounded-full bg-[#FF5533]" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-[11px] text-black flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>Local Vault</span>
        </span>
        <span className="text-[10px] font-bold px-1 bg-[#DFFF4F] border border-black">200 OK</span>
      </div>
    </aside>
  );
}
