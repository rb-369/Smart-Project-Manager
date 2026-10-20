'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { GithubIcon } from '@/components/GithubIcon';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Database,
  Users,
  ExternalLink
} from 'lucide-react';
import { StaticLoader } from '@/components/StaticLoader';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
    <div className="surface-canvas relative flex min-h-screen flex-col justify-between overflow-x-clip font-sans text-white selection:bg-brand-lime-400 selection:text-black">
      {/* Header Monogram */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandLogo size={36} />
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-[0.6875rem] text-white/90 backdrop-blur-md sm:flex">
          <Database className="h-3.5 w-3.5 text-[#C6FF20]" />
          <span>MONGODB ATLAS ISOLATED</span>
        </div>
      </header>

      {/* Main Card */}
      <main id="main-content" className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <div className="on-light bg-white text-ink-900 border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header inside card */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0038FF]/10 text-[#0038FF] border border-[#0038FF]/20 text-[0.6875rem] font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
              Sign In to DevCommand
            </h1>
            <p className="text-xs text-ink-500 max-w-xs mx-auto">
              Each user account is strictly separated and backed by dedicated MongoDB Atlas collections.
            </p>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
              {error.includes('localhost') && (
                <button
                  type="button"
                  onClick={() => {
                    api.setBaseUrl('https://smart-project-manager-em2i.onrender.com/api/v1');
                    setError(null);
                  }}
                  className="mt-1 py-1.5 px-3 rounded-xl bg-[#0038FF] text-white text-[0.6875rem] font-mono font-bold hover:bg-[#002AD4] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start"
                >
                  <Database className="w-3.5 h-3.5 text-[#C6FF20]" />
                  <span>Switch to Live Cloud API (Render + Atlas)</span>
                </button>
              )}
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
          <div className="grid grid-cols-3 gap-1 p-1 bg-brand-blue-50 rounded-2xl text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('github'); setError(null); }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'github'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
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
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
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
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
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
              <p className="text-[0.6875rem] text-ink-400 text-center font-mono">
                One-click authorization with GitHub identity &amp; repositories.
              </p>
            </div>
          )}

          {/* 2. GITHUB PERSONAL ACCESS TOKEN (INSTANT) */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-blue-500/15 text-xs font-mono bg-brand-blue-50/60 focus:bg-white focus:border-brand-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500 transition"
                  />
                </div>
                <div className="flex items-center justify-between text-[0.6875rem] text-ink-400 mt-1.5">
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
                <label className="block text-xs font-mono font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-blue-500/15 text-xs font-mono bg-brand-blue-50/60 focus:bg-white focus:border-brand-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-blue-500/15 text-xs font-mono bg-brand-blue-50/60 focus:bg-white focus:border-brand-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500 transition"
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
          <div className="pt-4 border-t border-ink-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-[0.6875rem] font-mono text-ink-500 font-bold">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0038FF]" />
                <span>TEST USER SEPARATION</span>
              </span>
              <span className="text-[0.6875rem] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Isolated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSwitch('alice')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-brand-blue-500/15 hover:border-brand-blue-500 hover:bg-brand-blue-50 text-left transition flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="truncate">
                  <div className="font-bold text-ink-800 text-[0.6875rem] group-hover:text-[#0038FF] truncate">
                    Alice Smith
                  </div>
                  <div className="text-[0.6875rem] font-mono text-ink-400 truncate">
                    Frontend Dev
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSwitch('bob')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-brand-blue-500/15 hover:border-brand-blue-500 hover:bg-brand-blue-50 text-left transition flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                  B
                </div>
                <div className="truncate">
                  <div className="font-bold text-ink-800 text-[0.6875rem] group-hover:text-[#0038FF] truncate">
                    Bob Chen
                  </div>
                  <div className="text-[0.6875rem] font-mono text-ink-400 truncate">
                    Platform Lead
                  </div>
                </div>
              </button>
            </div>
            <p className="text-[0.6875rem] text-ink-400 leading-tight">
              Switch between Alice and Bob to verify that Alice cannot see Bob&apos;s repositories, and Bob cannot see Alice&apos;s incubator ideas.
            </p>
          </div>

          {/* Footer inside card: link to Sign Up */}
          <div className="text-center pt-2 text-xs text-ink-500">
            <span>Don&apos;t have an account? </span>
            <Link href="/signup" className="font-bold text-[#0038FF] hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 text-center font-mono text-xs text-white/70">
        <p className="text-balance">DevCommand &bull; Isolated Multi-Tenant Architecture</p>
        <p className="mt-1 text-white/45">MongoDB Atlas &bull; AES-256 Vault</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <StaticLoader
        label="Securing Authentication Vault"
        sublabel="Connecting to isolated tenant matrix..."
        fullScreen={true}
      />
    }>
      <LoginContent />
    </Suspense>
  );
}
