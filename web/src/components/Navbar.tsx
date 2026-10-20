'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavbarProps {
  onSyncSuccess?: () => void;
  userEmail?: string;
  onSearchChange?: (val: string) => void;
}

const NAV_LINKS = [
  { label: 'Command', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Copilot', href: '/chat', icon: Bot },
  { label: 'Ideas', href: '/ideas', icon: Lightbulb },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar({ onSyncSuccess, onSearchChange }: NavbarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, switchDemoAccount } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isError?: boolean } | null>(
    null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mongoStatus, setMongoStatus] = useState<{
    configured: boolean;
    connected: boolean;
  } | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close both menus whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Fetch MongoDB connection status
  useEffect(() => {
    api
      .get<{ configured: boolean; connected: boolean }>('/mongodb/status')
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

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      onSearchChange?.(value);
    },
    [onSearchChange],
  );

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname.startsWith('/projects')
      : pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 font-mono text-[0.6875rem] font-bold transition-colors duration-150 ${
      active
        ? 'bg-brand-lime-400 text-black shadow-lime'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="surface-glass flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:gap-3 sm:rounded-full sm:px-4">
          {/* Brand */}
          <Link href="/" className="shrink-0" aria-label="DevCommand home">
            <BrandLogo size={30} tagline="Autonomous Engine" />
          </Link>

          {/* Desktop navigation */}
          <nav className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={navLinkClass(isActive(item.href))}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Storage telemetry — one chip instead of two competing badges */}
          <div
            className="telemetry-pill hidden shrink-0 2xl:inline-flex"
            title="Isolated tenant storage status"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                mongoStatus?.connected ? 'bg-brand-lime-400' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <span className={mongoStatus?.connected ? 'text-brand-lime-400' : 'text-amber-300'}>
              {mongoStatus?.connected ? 'Atlas Live' : 'MongoDB Ready'}
            </span>
            <span className="text-white/35">|</span>
            <span className="text-white/70">Isolated Tenant</span>
          </div>

          {/* Search — reachable on every breakpoint */}
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white transition-colors focus-within:border-white/40 focus-within:bg-white/20 md:flex">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
            <label htmlFor="global-search" className="sr-only">
              Search repositories
            </label>
            <input
              id="global-search"
              type="search"
              placeholder="Search repos..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-28 bg-transparent text-xs text-white outline-none placeholder:text-white/50 focus:w-44 transition-all font-mono lg:w-36 xl:w-44"
            />
          </div>

          {/* Sync status badge */}
          {syncStatus && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.625rem] font-bold transition ${
                syncStatus.isError
                  ? 'border-rose-300/50 bg-rose-500/20 text-rose-100'
                  : 'border-brand-lime-400/50 bg-brand-lime-400/15 text-brand-lime-300'
              }`}
            >
              {syncStatus.isError ? (
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Sync trigger */}
          {isAuthenticated && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-[0.6875rem] font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              title="Sync repositories from GitHub"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-brand-lime-400' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing' : 'Sync'}</span>
              <span className="sr-only sm:hidden">Sync repositories</span>
            </button>
          )}

          {/* Account */}
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 p-1 pl-1.5 pr-2.5 transition-colors hover:bg-white/20"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full border border-white/40 object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-white text-[0.6875rem] font-black text-brand-blue-600">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[90px] truncate font-mono text-[0.6875rem] font-bold text-white sm:inline">
                  {user.github_username ? `@${user.github_username}` : user.email.split('@')[0]}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/70 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-3 w-72 animate-fade-in-up space-y-3 rounded-2xl border border-brand-blue-500/12 bg-white p-3 font-sans text-ink-900 shadow-e3"
                >
                  <div className="space-y-1 rounded-xl bg-brand-blue-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-ink-900">
                        {user.full_name || 'Developer'}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 font-mono text-[0.625rem] font-bold text-emerald-700">
                        ISOLATED
                      </span>
                    </div>
                    <div className="truncate font-mono text-[0.6875rem] text-ink-500">
                      {user.email}
                    </div>
                    {user.github_username && (
                      <div className="flex items-center gap-1 pt-0.5 font-mono text-[0.6875rem] text-brand-blue-600">
                        <GithubIcon className="h-3 w-3" />
                        <span className="truncate">github.com/{user.github_username}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 rounded-xl border border-brand-blue-500/10 bg-brand-blue-50/70 px-3 py-2 text-[0.6875rem] text-ink-700">
                    <div className="flex items-center gap-1 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-blue-600" aria-hidden="true" />
                      <span>Private Workspace</span>
                    </div>
                    <p className="text-[0.625rem] leading-relaxed text-ink-500">
                      All repos, roadmap metrics, and incubator ideas are isolated to your MongoDB
                      Atlas tenant.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-ink-200/80 pt-3">
                    <div className="flex items-center gap-1 px-1 font-mono text-[0.625rem] font-bold uppercase tracking-wider text-ink-400">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      <span>Switch Test User</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                      <button
                        onClick={() => {
                          switchDemoAccount('alice');
                          setMenuOpen(false);
                        }}
                        className="rounded-lg border border-ink-200 p-1.5 text-left transition hover:border-brand-blue-500 hover:bg-white"
                      >
                        <div className="text-[0.6875rem] font-bold text-ink-800">Alice Smith</div>
                        <div className="text-[0.5625rem] text-ink-400">Frontend</div>
                      </button>
                      <button
                        onClick={() => {
                          switchDemoAccount('bob');
                          setMenuOpen(false);
                        }}
                        className="rounded-lg border border-ink-200 p-1.5 text-left transition hover:border-brand-blue-500 hover:bg-white"
                      >
                        <div className="text-[0.6875rem] font-bold text-ink-800">Bob Chen</div>
                        <div className="text-[0.5625rem] text-ink-400">Backend</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-ink-200/80 pt-2">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-100"
                    >
                      <Settings className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                      <span>Settings &amp; MongoDB Atlas</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-3.5 py-1.5 font-mono text-[0.6875rem] font-black text-black shadow-lime transition-colors hover:bg-brand-lime-300 sm:flex"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div
            id="mobile-nav"
            className="surface-glass mt-2 animate-fade-in-up space-y-3 rounded-2xl p-3 lg:hidden"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white focus-within:border-white/40 focus-within:bg-white/20">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
              <label htmlFor="mobile-search" className="sr-only">
                Search repositories
              </label>
              <input
                id="mobile-search"
                type="search"
                placeholder="Search repos..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/50"
              />
            </div>

            <nav className="grid grid-cols-2 gap-1.5" aria-label="Primary mobile">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 font-mono text-[0.6875rem] font-bold transition-colors ${
                      active
                        ? 'border-transparent bg-brand-lime-400 text-black'
                        : 'border-white/15 bg-white/5 text-white/85'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {!isAuthenticated && (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-brand-lime-400 px-4 py-2.5 font-mono text-[0.6875rem] font-black text-black shadow-lime"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <span>Sign In with GitHub</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
