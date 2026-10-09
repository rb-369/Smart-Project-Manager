'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, GitBranch, Terminal, CheckCircle2, AlertCircle, Sparkles, Command } from 'lucide-react';

interface NavbarProps {
  onSyncSuccess?: () => void;
  userEmail?: string;
}

export function Navbar({ onSyncSuccess, userEmail }: NavbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isError?: boolean } | null>(null);

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
    <header className="h-14 border-b border-white/[0.07] bg-[#090b11]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand logo with iridescent reflection */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-purple-500 rounded-lg blur-[2px] opacity-60 group-hover:opacity-90 transition duration-300" />
            <div className="relative w-7 h-7 rounded-lg bg-[#0e1018] border border-white/20 flex items-center justify-center font-mono text-xs font-bold text-white shadow-inner">
              DC
            </div>
          </div>
          <span className="font-semibold text-sm text-[#f4f5f8] tracking-tight">
            Dev<span className="text-[#a5b4fc]">Command</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-[#94a3b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald animate-pulse" />
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {syncStatus.isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            {syncStatus.message}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="bento-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : 'text-[#a5b4fc]'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync GitHub'}</span>
        </button>

        <div className="w-7 h-7 rounded-lg bg-[#141724] border border-white/10 flex items-center justify-center text-xs font-semibold text-[#cbd5e1] shadow-inner">
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'R'}
        </div>
      </div>
    </header>
  );
}
