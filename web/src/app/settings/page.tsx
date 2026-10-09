'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GitHubStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, GitBranch, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-[#050508] text-[#f8fafc] relative overflow-hidden flex flex-col">
      {/* Ambient Optical Glow Orbs */}
      <div className="liquid-glow-orb-purple -top-40 left-1/4" />
      <div className="liquid-glow-orb-cyan top-48 -right-40" />
      <div className="liquid-glow-orb-emerald -bottom-20 left-1/3" />
      <div className="liquid-glow-orb-magenta bottom-96 -left-32" />

      {/* Floating Island Navigation */}
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full space-y-7">
        <div className="glass-shell">
          <div className="glass-core p-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
              <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest font-semibold">
                Security & Authentication
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Settings & Integrations
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
              Configure encrypted credentials and background repository synchronizers.
            </p>
          </div>
        </div>

        {/* GitHub Connection Glass Card */}
        <div className="glass-shell">
          <div className="glass-core p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">GitHub Ingestion Pipeline</h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    Periodic polling & on-demand sync for public and private repositories.
                  </p>
                </div>
              </div>

              {status?.is_connected ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 glow-emerald" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5 glow-amber" /> Token Missing
                </span>
              )}
            </div>

            {/* Token Form */}
            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none font-mono transition shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748b] mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stored using AES-256 Fernet cryptographic cipher at rest.</span>
                </div>
              </div>

              {message && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="glass-pill-btn !py-2.5 !px-5 text-xs font-semibold bg-violet-600/30 border-violet-500/40 text-white"
              >
                {loading ? 'Encrypting & Storing...' : 'Save & Encrypt Token'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
