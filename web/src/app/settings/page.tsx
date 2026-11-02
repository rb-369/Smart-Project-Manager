'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GitHubStatus, MongoDBStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
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
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#0047FF] border border-black inline-block" />
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest font-black">
                ZERO-LEAK CREDENTIAL &bull; CLOUD VAULT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
              Settings &amp; Integrations
            </h1>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-mono">
              Configure MongoDB Atlas persistence, GitHub encrypted tokens, and tenant isolation policies.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs">
            <div className="px-3 py-1.5 bg-white border-2 border-black text-black font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <Database className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>{mongoStatus?.connected ? 'ATLAS CONNECTED' : 'MONGODB CONFIG'}</span>
            </div>
            <div className="px-3 py-1.5 bg-white border-2 border-black text-black font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <Lock className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>AES-256 GCM</span>
            </div>
          </div>
        </div>

        {/* 1. MONGODB ATLAS CLUSTER STATUS CARD */}
        <div className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-black text-[#DFFF4F] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000000] shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <span>MongoDB Atlas Storage</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-black border uppercase ${
                    mongoStatus?.connected 
                      ? 'bg-[#BBF7D0] text-black border-black' 
                      : 'bg-amber-200 text-black border-black'
                  }`}>
                    {mongoStatus?.connected ? '● LIVE ATLAS' : '● ACTION NEEDED'}
                  </span>
                </h2>
                <p className="text-xs text-neutral-600 mt-0.5 font-mono">
                  Scalable document store persisting multi-tenant repositories, features, and AI triage logs.
                </p>
              </div>
            </div>

            <button
              onClick={fetchMongoStatus}
              disabled={mongoLoading}
              className="py-1.5 px-3 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-black text-xs font-mono font-black uppercase flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mongoLoading ? 'animate-spin' : ''}`} />
              <span>{mongoLoading ? 'Pinging...' : 'Re-test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] text-neutral-500 uppercase font-black">Database Name</span>
              <div className="font-black text-black text-sm mt-0.5">{mongoStatus?.database || 'devcommand'}</div>
            </div>
            <div className="p-3.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] text-neutral-500 uppercase font-black">Cluster Host</span>
              <div className="font-black text-black text-sm mt-0.5 truncate">{mongoStatus?.host || 'Atlas SRV'}</div>
            </div>
            <div className="p-3.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] text-neutral-500 uppercase font-black">Tenant Isolation</span>
              <div className="font-black text-black text-sm mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#0047FF]" />
                <span>100% Enforced</span>
              </div>
            </div>
          </div>

          <div className={`p-4 border-2 border-black text-xs font-mono flex items-start gap-3 shadow-[2px_2px_0px_#000000] ${
            mongoStatus?.connected
              ? 'bg-[#BBF7D0] text-black'
              : 'bg-amber-100 text-black'
          }`}>
            {mongoStatus?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-black uppercase">{mongoStatus?.message}</div>
              {!mongoStatus?.connected && (
                <p className="text-[11px] leading-relaxed font-mono">
                  To connect your MongoDB Atlas cluster: Add your connection string to the <code className="bg-white border border-black px-1 py-0.5 font-bold">.env</code> file:
                  <br />
                  <code className="text-[10px] bg-white px-2 py-1 block mt-1 border-2 border-black font-mono select-all font-bold">
                    MONGODB_URL=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/devcommand?retryWrites=true&amp;w=majority
                  </code>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. CURRENT USER ISOLATED IDENTITY CARD */}
        {user && (
          <div className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b-2 border-black">
              <div className="w-12 h-12 bg-[#0047FF] text-[#DFFF4F] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000000] shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Active User Identity &amp; Tenant Workspace
                </h2>
                <p className="text-xs text-neutral-600 mt-0.5 font-mono">
                  Logged in as a distinct tenant. All data is partitioned by your account ID.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
                <span className="text-[10px] text-neutral-500 uppercase font-black">Email Address</span>
                <div className="font-black text-black text-sm mt-0.5 truncate">{user.email}</div>
              </div>
              <div className="p-3.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
                <span className="text-[10px] text-neutral-500 uppercase font-black">GitHub Account</span>
                <div className="font-black text-[#0047FF] text-sm mt-0.5 truncate uppercase">
                  {user.github_username ? `@${user.github_username}` : 'Not linked'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. GITHUB PERSONAL ACCESS TOKEN VAULT CARD */}
        <div className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-black">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#DFFF4F] text-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000000] shrink-0">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <span>GitHub Repository Telemetry Token</span>
                  {status?.is_connected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono bg-[#BBF7D0] text-black font-black uppercase border border-black">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                      CONNECTED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-600 mt-0.5 font-mono">
                  Synchronize your private and public repositories for roadmap tracking.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-4 bg-[#FAF7EE] hover:bg-black hover:text-white border-2 border-black text-black text-xs font-mono font-black uppercase flex items-center gap-1.5 transition self-start sm:self-auto shadow-[2px_2px_0px_#000000]"
            >
              <span>Generate PAT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleSaveToken} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-2">
                Personal Access Token (Stored in AES-256 Vault)
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white pl-11 pr-4 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none font-mono transition"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#0047FF]" />
                <span>Stored using AES-256 cryptographic cipher at rest. Never logged in plaintext.</span>
              </div>
            </div>

            {message && (
              <div className="p-4 bg-[#BBF7D0] border-2 border-black text-xs text-black flex items-center gap-2 font-mono font-black uppercase shadow-[2px_2px_0px_#000000]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border-2 border-black text-xs text-rose-800 flex items-center gap-2 font-mono font-black uppercase shadow-[2px_2px_0px_#000000]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="py-3 px-7 bg-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] cursor-pointer disabled:opacity-50 transition"
            >
              {loading ? 'Encrypting & Storing...' : 'Save & Encrypt Token'}
            </button>
          </form>
        </div>

        {/* 4. SECURITY & ARCHITECTURE SPECS */}
        <div className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-4">
          <h3 className="font-black text-sm text-black uppercase tracking-wide">
            Zero-Leak Architecture Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-black">Persistence</span>
              <p className="font-black text-xs text-black mt-1 uppercase">MongoDB Atlas</p>
              <p className="text-[11px] text-neutral-600 mt-1 font-mono">Encrypted documents with collection-level isolation.</p>
            </div>
            <div className="p-4 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-black">Vault Cipher</span>
              <p className="font-black text-xs text-black mt-1 uppercase">AES-256 GCM</p>
              <p className="text-[11px] text-neutral-600 mt-1 font-mono">Hardware-accelerated authenticated cipher.</p>
            </div>
            <div className="p-4 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-black">Tenant Scoping</span>
              <p className="font-black text-xs text-black mt-1 uppercase">UUID Filter Guard</p>
              <p className="text-[11px] text-neutral-600 mt-1 font-mono">Every database query is constrained to caller user ID.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
