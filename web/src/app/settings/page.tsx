'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GitHubStatus, MongoDBStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer } from '@/components/AppShell';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Lock,
  ExternalLink,
  Database,
  Users,
  RefreshCw,
  Server
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [token, setToken] = useState('');
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [mongoStatus, setMongoStatus] = useState<MongoDBStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [mongoLoading, setMongoLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/settings');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchStatus = async () => {
    if (!api.isAuthenticated()) return;
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

  const fetchMongoStatus = async () => {
    try {
      setMongoLoading(true);
      const res: any = await api.get('/mongodb/status');
      setMongoStatus(res);
    } catch (err: any) {
      console.warn('Unable to load mongodb status:', err?.message || err);
      setMongoStatus({
        configured: false,
        connected: false,
        message: 'Backend connection check failed',
        database: 'devcommand',
      });
    } finally {
      setMongoLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
      fetchMongoStatus();
    }
  }, [isAuthenticated, user]);

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
    <AppShell>
      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <PageContainer className="max-w-4xl space-y-6">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                ZERO-LEAK CREDENTIAL &amp; CLOUD VAULT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings &amp; Integrations
            </h1>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Configure MongoDB Atlas persistence, GitHub encrypted tokens, and tenant isolation policies.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs">
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span>{mongoStatus?.connected ? 'Atlas Connected' : 'MongoDB Config'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span>AES-256 GCM</span>
            </div>
          </div>
        </div>

        {/* 1. MONGODB ATLAS CLUSTER STATUS CARD */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Database className="w-6 h-6 text-[#C6FF20]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>MongoDB Atlas Storage</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    mongoStatus?.connected 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {mongoStatus?.connected ? '● LIVE ATLAS' : '● ACTION NEEDED'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scalable document store persisting multi-tenant repositories, features, and AI triage logs.
                </p>
              </div>
            </div>

            <button
              onClick={fetchMongoStatus}
              disabled={mongoLoading}
              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mongoLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{mongoLoading ? 'Pinging...' : 'Re-test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Database Name</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{mongoStatus?.database || 'devcommand'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Cluster Host</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{mongoStatus?.host || 'Atlas SRV'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tenant Isolation</span>
              <div className="font-bold text-emerald-600 text-sm mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Enforced</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-xs font-mono flex items-start gap-3 ${
            mongoStatus?.connected
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {mongoStatus?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">{mongoStatus?.message}</div>
              {!mongoStatus?.connected && (
                <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
                  To connect your MongoDB Atlas cluster: Add your connection string to the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> file:
                  <br />
                  <code className="text-[10px] bg-white px-2 py-1 rounded block mt-1 border border-amber-300 font-mono select-all">
                    MONGODB_URL=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/devcommand?retryWrites=true&amp;w=majority
                  </code>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. CURRENT USER ISOLATED IDENTITY CARD */}
        {user && (
          <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-[#0038FF] text-white flex items-center justify-center shadow-md shrink-0">
                <Users className="w-6 h-6 text-[#C6FF20]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Active User Identity &amp; Tenant Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged in as a distinct tenant. All data is partitioned by your account ID.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Email Address</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{user.email}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">GitHub Account</span>
                <div className="font-bold text-[#0038FF] text-sm mt-0.5 truncate">
                  {user.github_username ? `@${user.github_username}` : 'Not linked'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. GITHUB PERSONAL ACCESS TOKEN VAULT CARD */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0038FF] text-white flex items-center justify-center shadow-md shrink-0">
                <GitBranch className="w-6 h-6 text-[#C6FF20]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>GitHub Repository Telemetry Token</span>
                  {status?.is_connected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      CONNECTED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronize your private and public repositories for roadmap tracking.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-4 rounded-xl border border-slate-200 hover:border-[#0038FF] text-slate-700 hover:text-[#0038FF] text-xs font-mono font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <span>Generate PAT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleSaveToken} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
                Personal Access Token (Stored in AES-256 Vault)
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
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

        {/* 4. SECURITY & ARCHITECTURE SPECS */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl space-y-4">
          <h3 className="font-black text-sm text-slate-950 uppercase tracking-wide">
            Zero-Leak Architecture Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Persistence</span>
              <p className="font-bold text-xs text-slate-900 mt-1">MongoDB Atlas</p>
              <p className="text-[11px] text-slate-500 mt-1">Encrypted documents with collection-level isolation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Vault Cipher</span>
              <p className="font-bold text-xs text-slate-900 mt-1">AES-256 GCM</p>
              <p className="text-[11px] text-slate-500 mt-1">Hardware-accelerated authenticated cipher.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Tenant Scoping</span>
              <p className="font-bold text-xs text-slate-900 mt-1">UUID Filter Guard</p>
              <p className="text-[11px] text-slate-500 mt-1">Every database query is constrained to caller user ID.</p>
            </div>
          </div>
        </div>

      </PageContainer>
    </AppShell>
  );
}
