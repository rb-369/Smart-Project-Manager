'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, GitBranch, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

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
        message: count > 0 ? `Synced: +${count} new repos` : 'Sync complete (up to date)',
      });
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus({
        message: err.message || 'Sync failed. Check PAT in settings',
        isError: true,
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-14 border-b border-[#222433] bg-[#090a0f] sticky top-0 z-30 px-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#181a24] border border-[#2c3044] flex items-center justify-center text-slate-100 font-mono text-xs font-bold shadow-sm">
            DC
          </div>
          <span className="font-semibold text-sm text-[#f4f4f7] tracking-tight">
            DevCommand
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#13151f] text-[#8b8f9e] border border-[#222433]">
          v1.0.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        {syncStatus && (
          <div
            className={`text-xs px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition ${
              syncStatus.isError
                ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#13151f] hover:bg-[#1c1e2c] border border-[#282b3d] text-[#e2e4eb] hover:text-white transition disabled:opacity-50 cursor-pointer shadow-sm"
          title="Synchronize GitHub repositories on demand"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-[#8b8f9e]'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync GitHub'}</span>
        </button>

        <div className="w-7 h-7 rounded-md bg-[#181a24] border border-[#282b3d] flex items-center justify-center text-xs font-medium text-[#c0c4d4]">
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'D'}
        </div>
      </div>
    </header>
  );
}
