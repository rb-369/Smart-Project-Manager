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
      {/* Brand & Monogram Badge (Inspired by Gridster K-mark) */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center font-mono text-xs font-black text-white group-hover:border-[#C6FF20] transition-colors shadow-sm">
            <span className="text-white group-hover:text-[#C6FF20] transition-colors">DC</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white leading-none">
              Dev<span className="text-[#C6FF20]">Command</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase">
              GRIDSTER ARCHITECTURE
            </span>
          </div>
        </Link>

        {/* Live Telemetry Node */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20] pulse-lime" />
          <span className="text-zinc-300 font-semibold">ONLINE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">2026.10</span>
        </div>
      </div>

      {/* Center Navigation Pills */}
      <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & Action Button */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-400 focus-within:border-[#C6FF20]/50 focus-within:bg-white/[0.08] transition">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 w-24 focus:w-32 transition-all"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Badge */}
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full border font-mono flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-[#C6FF20]/10 border-[#C6FF20]/30 text-[#C6FF20]'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-[#C6FF20]" />
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
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#C6FF20]' : 'text-zinc-300'}`} />
          <span className="hidden sm:inline font-mono text-[11px]">{isSyncing ? 'Syncing' : 'Sync'}</span>
        </button>

        {/* User Monogram or Launch CTA */}
        {pathname !== '/dashboard' ? (
          <Link
            href="/dashboard"
            className="btn-lime !py-1.5 !px-3.5 text-xs font-bold flex items-center gap-1.5"
          >
            <span>Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime border border-black" />
          </div>
        )}
      </div>
    </header>
  );
}
