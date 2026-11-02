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
  ExternalLink,
} from 'lucide-react';
import { StaticLoader } from '@/components/StaticLoader';

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
          'GitHub OAuth App client ID is not yet configured. You can connect immediately below using your GitHub Personal Access Token or test accounts.'
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
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col justify-between selection:bg-[#DFFF4F] selection:text-black font-sans">
      {/* Header Monogram */}
      <header className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between relative z-10 border-b-2 border-black">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-mono font-black text-lg border-2 border-black shadow-[2px_2px_0px_#000000]">
            DC
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight text-black uppercase leading-none">
              DevCommand
            </span>
            <span className="text-[9px] font-mono text-[#0047FF] uppercase tracking-widest font-black">
              AUTONOMOUS ENGINE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-xs font-mono font-black text-black shadow-[2px_2px_0px_#000000] uppercase">
          <Database className="w-3.5 h-3.5 text-[#0047FF]" />
          <span>MONGODB ATLAS ISOLATED</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="bg-white text-black border-3 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-6">
          
          {/* Header inside card */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF7EE] text-black border-2 border-black text-[11px] font-mono font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0px_#000000]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>Multi-Tenant Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
              Sign In to DevCommand
            </h1>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-mono">
              Each user account is strictly isolated and backed by dedicated MongoDB Atlas collections.
            </p>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-black text-rose-800 text-xs flex flex-col gap-2 font-mono">
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
                  className="mt-1 py-1.5 px-3 bg-[#0047FF] text-white text-[11px] font-mono font-black uppercase border-2 border-black hover:bg-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000] self-start"
                >
                  <Database className="w-3.5 h-3.5 text-[#DFFF4F]" />
                  <span>Switch to Cloud API (Render + Atlas)</span>
                </button>
              )}
            </div>
          )}

          {oauthNotice && (
            <div className="p-3.5 bg-amber-50 border-2 border-black text-amber-900 text-xs flex items-start gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black uppercase">GitHub OAuth Setup Notice</p>
                <p>{oauthNotice}</p>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black">
            <button
              type="button"
              onClick={() => { setAuthMode('github'); setError(null); }}
              className={`py-2 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                authMode === 'github'
                  ? 'bg-black text-[#DFFF4F] border-black shadow-[2px_2px_0px_#000000]'
                  : 'border-transparent text-neutral-600 hover:text-black'
              }`}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>OAuth</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('token'); setError(null); }}
              className={`py-2 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                authMode === 'token'
                  ? 'bg-black text-[#DFFF4F] border-black shadow-[2px_2px_0px_#000000]'
                  : 'border-transparent text-neutral-600 hover:text-black'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Token</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setError(null); }}
              className={`py-2 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                authMode === 'email'
                  ? 'bg-black text-[#DFFF4F] border-black shadow-[2px_2px_0px_#000000]'
                  : 'border-transparent text-neutral-600 hover:text-black'
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
                className="w-full py-3.5 px-4 bg-black hover:bg-[#111] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <GithubIcon className="w-5 h-5 text-white" />
                <span>{loading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[11px] text-neutral-500 text-center font-mono">
                One-click authorization with GitHub identity &amp; repositories.
              </p>
            </div>
          )}

          {/* 2. GITHUB PERSONAL ACCESS TOKEN (INSTANT) */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1.5">
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 mt-1.5">
                  <span>Requires read:user &amp; repo scopes</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0047FF] hover:underline font-black flex items-center gap-0.5"
                  >
                    <span>Generate token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer"
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
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0047FF] hover:bg-black text-white border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer mt-1"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* MULTI-USER SEPARATION TESTER */}
          <div className="pt-4 border-t-2 border-black space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-700 font-black uppercase">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0047FF]" />
                <span>Test User Separation</span>
              </span>
              <span className="text-[10px] text-black bg-[#BBF7D0] px-2 py-0.5 border border-black">
                100% Isolated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSwitch('alice')}
                disabled={loading}
                className="p-2.5 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-left transition flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <div className="w-7 h-7 bg-pink-300 text-black border border-black font-black text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="truncate">
                  <div className="font-black text-black text-[11px] truncate uppercase">
                    Alice Smith
                  </div>
                  <div className="text-[9px] font-mono text-neutral-600 truncate">
                    Frontend Dev
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSwitch('bob')}
                disabled={loading}
                className="p-2.5 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-left transition flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <div className="w-7 h-7 bg-[#BAE6FD] text-black border border-black font-black text-xs flex items-center justify-center shrink-0">
                  B
                </div>
                <div className="truncate">
                  <div className="font-black text-black text-[11px] truncate uppercase">
                    Bob Chen
                  </div>
                  <div className="text-[9px] font-mono text-neutral-600 truncate">
                    Platform Lead
                  </div>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight font-mono">
              Switch between Alice and Bob to verify that Alice cannot see Bob&apos;s repositories, and Bob cannot see Alice&apos;s incubator ideas.
            </p>
          </div>

          {/* Footer inside card */}
          <div className="text-center pt-2 text-xs text-neutral-600 font-mono">
            <span>Don&apos;t have an account? </span>
            <Link href="/signup" className="font-black text-[#0047FF] hover:underline uppercase">
              Create one
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-neutral-600 border-t-2 border-black relative z-10 font-mono uppercase font-bold">
        DevCommand &bull; Isolated Multi-Tenant Architecture &bull; MongoDB Atlas &bull; AES-256 Vault
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <StaticLoader
        label="SECURING AUTHENTICATION VAULT"
        sublabel="Connecting to isolated tenant matrix..."
        fullScreen={true}
      />
    }>
      <LoginContent />
    </Suspense>
  );
}
