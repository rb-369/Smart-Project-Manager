'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  RefreshCw, 
  Search, 
  LayoutDashboard, 
  Lightbulb, 
  Settings,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  onSyncSuccess?: () => void;
  userEmail?: string;
  onSearchChange?: (val: string) => void;
}

export function Navbar({ onSyncSuccess, userEmail, onSearchChange }: NavbarProps) {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Incubator', href: '/ideas', icon: Lightbulb },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await api.post<{ new_repos_imported?: number }>('/github/sync');
      const count = res?.new_repos_imported || 0;
      setSyncStatus({
        message: count > 0 ? `+${count} imported` : 'Up to date',
      });
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setSyncStatus({
        message: error.message || 'Sync failed',
        isError: true,
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 floating-nav-island px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Monogram Badge */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-xs font-black text-[#0A5CFF] group-hover:border-[#0A5CFF] transition-colors shadow-sm">
            <span>DC</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
              Dev<span className="text-[#0A5CFF]">Command</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500 tracking-wider uppercase font-semibold">
              SPECTRUM: BLUE &bull; LIME &bull; WHITE &bull; VIOLET
            </span>
          </div>
        </Link>

        {/* Live Telemetry Node */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] font-mono text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A5CFF] pulse-blue" />
          <span className="text-slate-900 font-bold">GRIDSTER LIGHT</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0A5CFF] font-semibold">ONLINE</span>
        </div>
      </div>

      {/* Center Navigation Pills */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/60">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & Action Button */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 focus-within:border-[#0A5CFF] focus-within:bg-white transition">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder-slate-400 w-24 focus:w-32 transition-all"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white text-slate-500 border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Badge */}
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full border font-mono flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-[#C6FF20]/20 border-[#C6FF20] text-slate-900 font-bold'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3 h-3 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-[#0A5CFF]" />
            )}
            <span className="text-[10px]">{syncStatus.message}</span>
          </div>
        )}

        {/* Sync Trigger */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="btn-outline-white !py-1.5 !px-3 text-xs"
          title="Sync with GitHub"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0A5CFF]' : 'text-slate-600'}`} />
          <span className="hidden sm:inline font-mono text-[11px] font-bold text-slate-700">
            {isSyncing ? 'Syncing' : 'Sync'}
          </span>
        </button>

        {/* User Monogram or Launch CTA */}
        {pathname !== '/dashboard' ? (
          <Link
            href="/dashboard"
            className="btn-lime !py-1.5 !px-3.5 text-xs font-extrabold flex items-center gap-1.5"
          >
            <span>Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue border border-white" />
          </div>
        )}
      </div>
    </header>
  );
}
