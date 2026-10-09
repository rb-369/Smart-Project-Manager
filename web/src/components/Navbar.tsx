'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  RefreshCw, 
  Search, 
  Bell, 
  Sparkles, 
  LayoutDashboard, 
  FolderGit2, 
  Lightbulb, 
  Settings,
  CheckCircle2,
  AlertCircle
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
      const res: any = await api.post('/github/sync');
      const count = res.new_repos_imported || 0;
      setSyncStatus({
        message: count > 0 ? `+${count} imported` : 'Up to date',
      });
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus({
        message: err.message || 'Sync failed',
        isError: true,
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-50 floating-glass-island px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Monogram */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-xl blur-[3px] opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8 h-8 rounded-xl bg-[#080a10] border border-white/20 flex items-center justify-center font-mono text-xs font-bold text-white shadow-inner">
              <span className="bg-gradient-to-br from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                DC
              </span>
            </div>
          </div>
          <span className="font-semibold text-sm text-[#f8fafc] tracking-tight hidden sm:inline-block">
            Dev<span className="text-[#a5b4fc]">Command</span>
          </span>
        </Link>

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-[#94a3b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald animate-pulse" />
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Center Nav Pill Links */}
      <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`glass-nav-pill ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-[#64748b]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar Input */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#94a3b8] focus-within:border-white/20 focus-within:bg-white/[0.08] transition">
          <Search className="w-3.5 h-3.5 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[#f1f5f9] placeholder-[#64748b] w-28 focus:w-36 transition-all"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.06] text-[#94a3b8] border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Badge */}
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            <span className="text-[11px]">{syncStatus.message}</span>
          </div>
        )}

        {/* Sync Action Pill */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="glass-pill-btn !py-1.5 !px-3 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-indigo-300'}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Notification Bell */}
        <button className="relative w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#94a3b8] hover:text-white transition">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
        </button>

        {/* User Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-white/20 flex items-center justify-center text-xs font-semibold text-white shadow-inner">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'R'}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 glow-emerald border border-[#080a10]" />
        </div>
      </div>
    </header>
  );
}

