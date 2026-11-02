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
  Bot,
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
    { label: 'Copilot AI', href: '/chat', icon: Bot },
    { label: 'Project Ideas', href: '/ideas', icon: Lightbulb },
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
    <header className="w-full border-b border-neutral-200/90 bg-[#F6F3EC]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 selection:bg-[#DFFF4F] selection:text-black">
      {/* Brand & Monogram Badge */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-black text-[#DFFF4F] font-mono text-xs font-bold flex items-center justify-center rounded-lg border border-neutral-800 shadow-xs group-hover:bg-[#0047FF] group-hover:text-white transition-colors shrink-0">
            DC
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-black uppercase tracking-widest text-neutral-900 leading-none">
              DevCommand
            </span>
            <span className="text-[9px] font-mono text-[#0047FF] uppercase tracking-wider font-bold mt-0.5">
              WORKSPACE ENGINE
            </span>
          </div>
        </Link>

        {/* Database Telemetry Indicator */}
        <div className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1 bg-white rounded-xl border border-neutral-200/90 shadow-xs font-mono text-[10px]">
          <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-[#10B981]' : 'bg-amber-400'} animate-pulse`} />
          <span className="font-bold text-neutral-800">
            {mongoStatus?.connected ? 'ATLAS CLUSTER LIVE' : 'SQLITE FALLBACK'}
          </span>
          <span className="opacity-30">|</span>
          <span className="text-neutral-500 font-medium">ISOLATED TENANT</span>
        </div>
      </div>

      {/* Center Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-white rounded-xl border border-neutral-200/90 shadow-xs">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs rounded-lg font-bold transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-neutral-200/90 shadow-xs text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search repos..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-neutral-900 placeholder-neutral-400 w-24 focus:w-36 transition-all font-mono"
          />
        </div>

        {/* Sync Status Badge */}
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-xl border font-mono flex items-center gap-1.5 shadow-xs ${
              syncStatus.isError
                ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="text-[11px]">{syncStatus.message}</span>
          </div>
        )}

        {/* Sync Trigger */}
        {isAuthenticated && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="py-1.5 px-3 bg-neutral-900 hover:bg-[#0047FF] text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
            title="Sync with GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#DFFF4F]' : 'text-white'}`} />
            <span className="hidden sm:inline font-mono text-xs font-bold">
              {isSyncing ? 'SYNCING' : 'SYNC GITHUB'}
            </span>
          </button>
        )}

        {/* User Identity or Sign In CTA */}
        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-200/90 shadow-xs transition cursor-pointer text-left"
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="w-6 h-6 rounded-lg border border-neutral-200 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-neutral-900 text-[#DFFF4F] font-mono font-bold text-xs flex items-center justify-center">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold font-mono text-neutral-800 max-w-[90px] truncate">
                {user.github_username ? `@${user.github_username}` : user.email.split('@')[0]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-neutral-900 rounded-2xl border border-neutral-200/90 shadow-xl p-4 z-50 space-y-3 font-sans">
                {/* User Header */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-900 truncate">
                      {user.full_name || 'Developer'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                      ISOLATED
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    {user.email}
                  </div>
                  {user.github_username && (
                    <div className="flex items-center gap-1 text-[11px] text-[#0047FF] pt-0.5">
                      <GithubIcon className="w-3 h-3" />
                      <span>github.com/{user.github_username}</span>
                    </div>
                  )}
                </div>

                {/* Account Isolation Notice */}
                <div className="p-3 bg-white rounded-xl border border-neutral-200/80 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0047FF]" />
                    <span>Private Tenant Vault</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    All repos, roadmap metrics, and incubator ideas are strictly isolated to your user ID.
                  </p>
                </div>

                {/* Multi-User Switcher Test Bar */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100 font-mono">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>SWITCH TEST PROFILE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => { switchDemoAccount('alice'); setMenuOpen(false); }}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-[#DFFF4F]/50 text-left transition font-mono"
                    >
                      <div className="font-bold text-[11px] text-neutral-900">Alice Smith</div>
                      <div className="text-[9px] text-neutral-500">Frontend</div>
                    </button>
                    <button
                      onClick={() => { switchDemoAccount('bob'); setMenuOpen(false); }}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-[#DFFF4F]/50 text-left transition font-mono"
                    >
                      <div className="font-bold text-[11px] text-neutral-900">Bob Chen</div>
                      <div className="text-[9px] text-neutral-500">Backend</div>
                    </button>
                  </div>
                </div>

                {/* Links */}
                <div className="pt-2 border-t border-neutral-100 space-y-1 font-mono text-xs">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 font-bold text-neutral-800 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0047FF]" />
                    <span>Settings &amp; Database</span>
                  </Link>

                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 font-bold text-red-600 transition text-left cursor-pointer border-t border-neutral-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>SIGN OUT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 bg-neutral-900 text-white hover:bg-[#0047FF] rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-xs active:translate-y-0.5 flex items-center gap-1.5"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>SIGN IN</span>
          </Link>
        )}
      </div>
    </header>
  );
}
