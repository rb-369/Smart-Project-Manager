'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GitHubStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
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
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f7] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 max-w-4xl mx-auto space-y-6">
          <div className="pb-4 border-b border-[#1c1d28]">
            <h1 className="text-xl font-semibold text-[#f4f4f7] tracking-tight">
              Settings & Integrations
            </h1>
            <p className="text-xs text-[#7c8091] mt-0.5">
              Manage GitHub repository access and encrypted token credentials.
            </p>
          </div>

          {/* GitHub Connection Card */}
          <div className="craft-panel p-5 rounded-lg space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1c1d28]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#181a24] border border-[#252838] flex items-center justify-center text-[#c5c8d6]">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#f4f4f7]">GitHub Synchronization</h3>
                  <p className="text-xs text-[#7c8091]">
                    Fetch repositories, stars, languages, and README files for AI roadmap triage.
                  </p>
                </div>
              </div>

              {status?.is_connected ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono text-amber-400 bg-amber-950/30 border border-amber-800/40">
                  <AlertCircle className="w-3.5 h-3.5" /> Token Missing
                </span>
              )}
            </div>

            {/* Token Form */}
            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c5c8d6] mb-1.5">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#555866] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-[#0d0e14] border border-[#222433] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#f4f4f7] placeholder-[#555866] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#64687a] mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Encrypted at rest via AES-256 Fernet. Never exposed over API responses.</span>
                </div>
              </div>

              {message && (
                <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-md bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:opacity-50 transition cursor-pointer shadow-sm"
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
