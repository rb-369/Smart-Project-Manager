'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GitHubStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
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
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto space-y-7">
          <div className="pb-4 border-b border-white/[0.07]">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Settings & Integrations
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              Configure encrypted credentials and background repository synchronizers.
            </p>
          </div>

          {/* GitHub Connection Bento Card */}
          <div className="bento-card p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-sky-400">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">GitHub Ingestion Pipeline</h3>
                  <p className="text-xs text-[#94a3b8]">
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
                    className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none font-mono transition shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748b] mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stored using AES-256 Fernet cryptographic cipher at rest.</span>
                </div>
              </div>

              {message && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="bento-btn-primary px-4 py-2.5 text-xs font-semibold rounded-xl text-white disabled:opacity-50 transition cursor-pointer shadow-md"
              >
                {loading ? 'Encrypting & Storing...' : 'Save & Encrypt Token'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
