'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GitHubStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, GitBranch } from 'lucide-react';

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res: any = await api.get('/github/status');
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.post('/github/token', { token: token.trim() });
      setMessage('GitHub Personal Access Token encrypted and saved successfully.');
      setToken('');
      fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden flex flex-col bg-grid-pattern-light selection:bg-[#C6FF20] selection:text-black">
      {/* Light Ambient Glows */}
      <div className="ambient-glow-blue -top-40 left-1/4" />
      <div className="ambient-glow-lime top-48 -right-40" />
      <div className="ambient-glow-violet bottom-32 left-1/3" />

      {/* Floating Island Navigation */}
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full space-y-7">
        <div className="gridster-panel bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
            <span className="text-[11px] font-mono text-[#0A5CFF] uppercase tracking-widest font-bold">
              Security & Authentication
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Settings & Integrations
          </h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Configure encrypted credentials and background repository synchronizers.
          </p>
        </div>

        {/* GitHub Connection Card */}
        <div className="gridster-panel bg-white border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A5CFF] shadow-xs">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-950">GitHub Ingestion Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodic polling & on-demand sync for public and private repositories.
                </p>
              </div>
            </div>

            {status?.is_connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5" /> Token Missing
              </span>
            )}
          </div>

          {/* Token Form */}
          <form onSubmit={handleSaveToken} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                GitHub Personal Access Token (PAT)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A5CFF] focus:bg-white rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden font-mono transition shadow-2xs"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0A5CFF]" />
                <span>Stored using AES-256 cryptographic cipher at rest.</span>
              </div>
            </div>

            {message && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {message}
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="btn-blue !py-2.5 !px-5 text-xs font-bold"
            >
              {loading ? 'Encrypting & Storing...' : 'Save & Encrypt Token'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
