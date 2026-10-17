'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GithubIcon } from '@/components/GithubIcon';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Database,
  Users,
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';
  const { user, loginWithGitHub, loginWithGitHubToken, loginWithEmail, switchDemoAccount } = useAuth();

  const [authMode, setAuthMode] = useState<'github' | 'token' | 'email'>('github');
  const [tokenInput, setTokenInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  // If already logged in, redirect to dashboard or nextUrl
  useEffect(() => {
    if (user) {
      router.push(nextUrl);
    }
  }, [user, router, nextUrl]);

  const handleGitHubOAuth = async () => {
    setLoading(true);
    setError(null);
    setOauthNotice(null);
    try {
      await loginWithGitHub();
    } catch (err: any) {
      if (err.message === 'GITHUB_OAUTH_NOT_CONFIGURED') {
        setOauthNotice(
          'GitHub OAuth App client ID is not yet set in .env. You can connect immediately below using your GitHub Personal Access Token (classic or fine-grained) or use the Test Accounts.'
        );
        setAuthMode('token');
      } else {
        setError(err.message || 'Failed to initialize GitHub OAuth.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter your GitHub Personal Access Token.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithGitHubToken(tokenInput.trim(), true);
    } catch (err: any) {
      setError(err.message || 'GitHub token verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (account: 'alice' | 'bob') => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoAccount(account);
    } catch (err: any) {
      setError(err.message || 'Demo account switch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col justify-between selection:bg-[#C6FF20] selection:text-black font-sans">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Monogram */}
      <header className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-white/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative p-1 shrink-0">
            <svg viewBox="0 0 512 512" fill="none" className="w-full h-full drop-shadow">
              <path d="M208 116 L288 116 L226 232 L286 232 L150 408 L184 274 L140 274 Z" fill="#C6FF20" />
              <path d="M306 132 L394 256 L306 380 L254 380 L336 264 L336 248 L254 132 Z" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight text-white leading-none">
              DevCommand
            </span>
            <span className="text-[9px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
              AUTONOMOUS ENGINE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-white/90">
          <Database className="w-3.5 h-3.5 text-[#C6FF20]" />
          <span>MONGODB ATLAS ISOLATED</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="bg-white text-slate-900 border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header inside card */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0038FF]/10 text-[#0038FF] border border-[#0038FF]/20 text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to DevCommand
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Each user account is strictly separated and backed by dedicated MongoDB Atlas collections.
            </p>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {oauthNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">GitHub OAuth Setup Notice</p>
                <p>{oauthNotice}</p>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('github'); setError(null); }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'github'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>OAuth</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('token'); setError(null); }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'token'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>GitHub PAT</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setError(null); }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'email'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>

          {/* 1. PRIMARY: GITHUB OAUTH */}
          {authMode === 'github' && (
            <div className="space-y-3.5 pt-2">
              <button
                type="button"
                onClick={handleGitHubOAuth}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#24292F] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              >
                <GithubIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>{loading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-white/60 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[11px] text-slate-400 text-center font-mono">
                One-click authorization with GitHub identity &amp; repositories.
              </p>
            </div>
          )}

          {/* 2. GITHUB PERSONAL ACCESS TOKEN (INSTANT) */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Requires read:user &amp; repo scopes</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0038FF] hover:underline flex items-center gap-0.5"
                  >
                    <span>Generate token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0038FF] hover:bg-[#002AD4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>{loading ? 'Verifying with GitHub...' : 'Connect with Token'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 3. EMAIL / PASSWORD LOGIN */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002AD4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* MULTI-USER SEPARATION TESTER (ONE-CLICK SWITCHER) */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0038FF]" />
                <span>TEST USER SEPARATION</span>
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Isolated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSwitch('alice')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0038FF] hover:bg-blue-50/50 text-left transition flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="truncate">
                  <div className="font-bold text-slate-800 text-[11px] group-hover:text-[#0038FF] truncate">
                    Alice Smith
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    Frontend Dev
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSwitch('bob')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0038FF] hover:bg-blue-50/50 text-left transition flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                  B
                </div>
                <div className="truncate">
                  <div className="font-bold text-slate-800 text-[11px] group-hover:text-[#0038FF] truncate">
                    Bob Chen
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    Platform Lead
                  </div>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Switch between Alice and Bob to verify that Alice cannot see Bob&apos;s repositories, and Bob cannot see Alice&apos;s incubator ideas.
            </p>
          </div>

          {/* Footer inside card: link to Sign Up */}
          <div className="text-center pt-2 text-xs text-slate-500">
            <span>Don&apos;t have an account? </span>
            <Link href="/signup" className="font-bold text-[#0038FF] hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-white/70 relative z-10 font-mono">
        DevCommand &bull; Isolated Multi-Tenant Architecture &bull; MongoDB Atlas &bull; AES-256 Vault
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-grid text-white flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-[#0038FF] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-mono">Loading authentication vault...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
