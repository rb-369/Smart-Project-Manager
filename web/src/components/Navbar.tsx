'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  RefreshCw, 
  Search, 
  LayoutDashboard, 
  Lightbulb, 
  Settings,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LogOut,
  Users,
  Database,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface NavbarProps {
  onSyncSuccess?: () => void;
  userEmail?: string;
  onSearchChange?: (val: string) => void;
}

export function Navbar({ onSyncSuccess, onSearchChange }: NavbarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, switchDemoAccount } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mongoStatus, setMongoStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Incubator', href: '/ideas', icon: Lightbulb },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch MongoDB connection status
  useEffect(() => {
    api.get<{ configured: boolean; connected: boolean }>('/mongodb/status')
      .then(setMongoStatus)
      .catch(() => setMongoStatus({ configured: false, connected: false }));
  }, []);

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

        {/* Database Telemetry Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 border border-white/10 text-[10px] font-mono text-white/90">
          <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-[#C6FF20] animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[#C6FF20] font-black">
            {mongoStatus?.connected ? 'ATLAS LIVE' : 'MONGODB READY'}
          </span>
          <span className="opacity-40">|</span>
          <span className="text-white/80 font-bold">ISOLATED TENANT</span>
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

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-white/50 focus-within:bg-white/20 focus-within:border-white/40 transition">
          <Search className="w-3.5 h-3.5 text-white/60" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-white/60 w-20 focus:w-32 transition-all font-mono"
          />
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

        {/* Sync Trigger (Only when authenticated) */}
        {isAuthenticated && (
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
        )}

        {/* User Identity or Sign In CTA */}
        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md transition cursor-pointer text-left"
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="w-7 h-7 rounded-full object-cover border border-white/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white text-[#0038FF] font-black text-xs flex items-center justify-center border border-white/40 shadow">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold font-mono text-white max-w-[90px] truncate">
                {user.github_username ? `@${user.github_username}` : user.email.split('@')[0]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-3 z-50 space-y-3 font-sans animate-in fade-in zoom-in-95 duration-100">
                {/* User Header */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {user.full_name || 'Developer'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      ISOLATED
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {user.email}
                  </div>
                  {user.github_username && (
                    <div className="flex items-center gap-1 text-[11px] text-[#0038FF] font-mono pt-0.5">
                      <GithubIcon className="w-3 h-3" />
                      <span>github.com/{user.github_username}</span>
                    </div>
                  )}
                </div>

                {/* Account Isolation Notice */}
                <div className="px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0038FF]" />
                    <span>Private Workspace</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    All repos, roadmap metrics, and incubator ideas are isolated to your MongoDB Atlas tenant.
                  </p>
                </div>

                {/* Multi-User Switcher Test Bar */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Switch Test User</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => { switchDemoAccount('alice'); setMenuOpen(false); }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-[#0038FF] hover:bg-slate-50 text-left transition"
                    >
                      <div className="font-bold text-[11px] text-slate-800">Alice Smith</div>
                      <div className="text-[9px] text-slate-400">Frontend</div>
                    </button>
                    <button
                      onClick={() => { switchDemoAccount('bob'); setMenuOpen(false); }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-[#0038FF] hover:bg-slate-50 text-left transition"
                    >
                      <div className="font-bold text-[11px] text-slate-800">Bob Chen</div>
                      <div className="text-[9px] text-slate-400">Backend</div>
                    </button>
                  </div>
                </div>

                {/* Links */}
                <div className="pt-1 border-t border-slate-100 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Settings &amp; MongoDB Atlas</span>
                  </Link>

                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="btn-lime !py-1.5 !px-3.5 text-xs font-black flex items-center gap-1.5 shadow-md"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
