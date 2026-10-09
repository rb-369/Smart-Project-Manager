'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, GitBranch, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onSyncSuccess?: () => void;
  userEmail?: string;
}

export function Navbar({ onSyncSuccess, userEmail }: NavbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res: any = await api.post('/github/sync');
      setSyncMessage(`Synced! ${res.new_repos_imported || 0} new repos added.`);
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed. Set your PAT in settings.');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            D
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            Dev<span className="text-indigo-400">Command</span>
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-medium">
          v1.0
        </span>
      </div>

      <div className="flex items-center gap-4">
        {syncMessage && (
          <div className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {syncMessage}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync GitHub'}
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow">
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
