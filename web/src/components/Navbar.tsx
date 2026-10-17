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
  ArrowRight,
  Sparkles
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
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-between shadow-2xl">
      {/* Brand & Monogram Badge */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-white/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative p-1 shrink-0">
            <svg viewBox="0 0 512 512" fill="none" className="w-full h-full drop-shadow">
              <path d="M208 116 L288 116 L226 232 L286 232 L150 408 L184 274 L140 274 Z" fill="#C6FF20" />
              <path d="M306 132 L394 256 L306 380 L254 380 L336 264 L336 248 L254 132 Z" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-sm tracking-tight text-white leading-none">
              DevCommand
            </span>
            <span className="text-[9px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
              AUTONOMOUS ENGINE
            </span>
          </div>
        </Link>

        {/* Live Telemetry Node */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/10 text-[10px] font-mono text-white/90">
          <span className="w-2 h-2 rounded-full bg-[#C6FF20] animate-pulse" />
          <span className="text-[#C6FF20] font-black">ONLINE</span>
          <span className="opacity-40">|</span>
          <span className="text-white/80 font-bold">GRIDSTER BLUE</span>
        </div>
      </div>

      {/* Center Navigation Pills */}
      <nav className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/15">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                isActive
                  ? 'bg-[#C6FF20] text-black shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/70'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & Action Button */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-white/50 focus-within:bg-white/20 focus-within:border-white/40 transition">
          <Search className="w-3.5 h-3.5 text-white/60" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-white/60 w-20 focus:w-32 transition-all font-mono"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 text-white border border-white/20">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Badge */}
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full border font-mono flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-500/20 border-rose-300 text-rose-200'
                : 'bg-[#C6FF20]/20 border-[#C6FF20] text-[#C6FF20] font-bold'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3 h-3 text-rose-300" />
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
          className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
          title="Sync with GitHub"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#C6FF20]' : 'text-white'}`} />
          <span className="hidden sm:inline font-mono text-[11px] font-bold text-white">
            {isSyncing ? 'Syncing' : 'Sync'}
          </span>
        </button>

        {/* User Monogram or Launch CTA */}
        {pathname !== '/dashboard' ? (
          <Link
            href="/dashboard"
            className="btn-lime !py-1.5 !px-3.5 text-xs font-black flex items-center gap-1.5 shadow-md"
          >
            <span>Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white border border-white/40 flex items-center justify-center text-xs font-black text-[#0038FF] shadow-md">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#C6FF20] border-2 border-[#0038FF]" />
          </div>
        )}
      </div>
    </header>
  );
}
