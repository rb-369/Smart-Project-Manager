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
    } catch (err: any) {
      console.warn('Unable to load github status from backend:', err?.message || err);
      setStatus({
        is_connected: false,
        github_username: undefined,
        total_projects_synced: 0,
        needs_review_count: 0,
      });
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
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Content: Full Blue Page with Compact Functional Header */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                ZERO-LEAK CREDENTIAL VAULT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings &amp; Integrations
            </h1>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Configure encrypted credentials and background repository synchronizers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs">
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span>AES-256 GCM</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 font-bold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status?.is_connected ? 'bg-[#C6FF20]' : 'bg-amber-400'}`} />
              <span>{status?.is_connected ? 'Live' : 'Token Needed'}</span>
            </div>
          </div>
        </div>

        {/* GitHub Connection Card (Clean White Panel on Full Blue Canvas) */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0038FF] text-white flex items-center justify-center shadow-md shrink-0">
                <GitBranch className="w-6 h-6 text-[#C6FF20]" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-950 uppercase">GitHub Ingestion Pipeline</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodic branch polling &amp; on-demand AST decomposition for your repositories.
                </p>
              </div>
            </div>

            {status?.is_connected ? (
              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-black text-emerald-800 bg-emerald-100 border border-emerald-300 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-black text-amber-800 bg-amber-100 border border-amber-300 self-start sm:self-auto">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Token Missing
              </span>
            )}
          </div>

          {/* Token Form */}
          <form onSubmit={handleSaveToken} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-2">
                GitHub Personal Access Token (PAT)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono transition shadow-inner font-normal"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#0038FF]" />
                <span>Stored using AES-256 cryptographic cipher at rest. Never logged in plaintext.</span>
              </div>
            </div>

            {message && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="btn-lime !py-3 !px-7 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Encrypting & Storing...' : 'Save & Encrypt Token'}
            </button>
          </form>
        </div>

        {/* Security Specs Card */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-4">
          <h3 className="font-black text-sm text-slate-950 uppercase tracking-wide">
            Zero-Leak Architecture Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Encryption</span>
              <p className="font-bold text-xs text-slate-900 mt-1">AES-256 GCM</p>
              <p className="text-[11px] text-slate-500 mt-1">Hardware-accelerated authenticated cipher.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Memory Hygiene</span>
              <p className="font-bold text-xs text-slate-900 mt-1">Zero Plaintext Log</p>
              <p className="text-[11px] text-slate-500 mt-1">Tokens sanitized before telemetry serialization.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Inference Isolation</span>
              <p className="font-bold text-xs text-slate-900 mt-1">Ephemeral Context</p>
              <p className="text-[11px] text-slate-500 mt-1">Multi-tier models discard code diffs post-triage.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
