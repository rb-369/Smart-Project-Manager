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
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
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
          'GitHub OAuth App client ID is not yet configured in .env. You can connect immediately below using your GitHub Personal Access Token or test accounts.'
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
      {/* Top Swiss Telemetry Header */}
      <header className="w-full bg-[#F6F3EC] border-b-2 border-black px-4 sm:px-8 py-3.5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-black text-[#DFFF4F] font-mono text-xs font-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:bg-[#0047FF] group-hover:text-white transition-colors shrink-0">
              DC
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black uppercase tracking-widest text-black leading-none">
                DevCommand
              </span>
              <span className="text-[9px] font-mono text-[#0047FF] uppercase tracking-wider font-bold mt-0.5">
                ACCESS CONTROL // GATEWAY_01
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] font-mono text-[10px] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>ATLAS CLUSTER &bull; ISOLATED TENANT</span>
            </div>
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-[#FAF7EE] hover:bg-black hover:text-[#DFFF4F] border-2 border-black text-black text-xs font-mono font-black uppercase transition shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              &larr; Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main 2-Column Architectural Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: System Showcase & Telemetry Matrix (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            {/* Box 1: Cobalt Blue Platform Identity */}
            <div className="bg-[#0047FF] text-white border-3 border-black p-6 sm:p-7 shadow-[6px_6px_0px_#000000] relative overflow-hidden flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-black text-[#DFFF4F] border border-black tracking-widest">
                    SYSTEM RUNTIME // v1.0.4
                  </span>
                  <div className="w-7 h-7 bg-white text-black border-2 border-black flex items-center justify-center font-mono font-black text-xs shadow-[2px_2px_0px_#000000]">
                    &bull;
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                  Enter Your Autonomous Command Surface
                </h2>
                <p className="text-xs text-white/90 mt-2 font-mono leading-relaxed">
                  Dedicated, zero-leak workspace environment connecting your GitHub codebases, Qdrant vectors, and 3-agent reasoning swarm.
                </p>
              </div>

              {/* Feature Pill Matrix */}
              <div className="space-y-2 pt-2 border-t-2 border-white/20">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white bg-black/25 p-2 border border-white/20">
                  <CheckCircle2 className="w-4 h-4 text-[#DFFF4F] shrink-0" />
                  <span>DEDICATED MONGODB ATLAS PARTITION</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white bg-black/25 p-2 border border-white/20">
                  <Cpu className="w-4 h-4 text-[#DFFF4F] shrink-0" />
                  <span>3-AGENT TRIAGE: JUDGE, PLANNER, RESEARCH</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white bg-black/25 p-2 border border-white/20">
                  <Layers className="w-4 h-4 text-[#DFFF4F] shrink-0" />
                  <span>AUTOMATED GITHUB AST INGESTION</span>
                </div>
              </div>
            </div>

            {/* Box 2: Instant Tenant Switching (Alice & Bob) */}
            <div className="bg-white text-black border-2 border-black p-5 shadow-[4px_4px_0px_#000000] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-black uppercase">
                  <Users className="w-4 h-4 text-[#0047FF]" />
                  <span>1-Click Test Personas</span>
                </div>
                <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-[#BBF7D0] border border-black uppercase">
                  100% Isolated
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 font-mono">
                Click either developer to test multi-tenant data partitioning in real time:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoSwitch('alice')}
                  disabled={loading}
                  className="p-3 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-left transition flex items-center gap-2.5 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group"
                >
                  <div className="w-8 h-8 bg-pink-300 text-black border-2 border-black font-black text-xs flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000000]">
                    A
                  </div>
                  <div className="truncate">
                    <div className="font-black text-black text-xs uppercase truncate group-hover:text-black">
                      Alice Smith
                    </div>
                    <div className="text-[10px] font-mono text-neutral-600 truncate">
                      Frontend Dev
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSwitch('bob')}
                  disabled={loading}
                  className="p-3 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-left transition flex items-center gap-2.5 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group"
                >
                  <div className="w-8 h-8 bg-[#BAE6FD] text-black border-2 border-black font-black text-xs flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000000]">
                    B
                  </div>
                  <div className="truncate">
                    <div className="font-black text-black text-xs uppercase truncate group-hover:text-black">
                      Bob Chen
                    </div>
                    <div className="text-[10px] font-mono text-neutral-600 truncate">
                      Platform Lead
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Box 3: Security & Cryptography Stamp */}
            <div className="bg-[#DFFF4F] text-black border-2 border-black p-3.5 shadow-[4px_4px_0px_#000000] flex items-center justify-between text-xs font-mono font-black uppercase">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>AES-256 GCM ENCRYPTED VAULT</span>
              </span>
              <span className="text-[10px] bg-black text-[#DFFF4F] px-2 py-0.5 border border-black">
                SEALED
              </span>
            </div>
          </div>

          {/* Right Column: Tactile Swiss Authentication Console (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white text-black border-3 border-black p-6 sm:p-9 shadow-[8px_8px_0px_#000000] space-y-6 h-full flex flex-col justify-between">
              <div>
                {/* Terminal Header */}
                <div className="pb-4 border-b-2 border-black">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-[#0047FF] uppercase font-black tracking-wider">
                      [SYS.GATEWAY // AUTH_STAGE_01]
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                      TLS 1.3 SECURE
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                    Sign In to DevCommand
                  </h1>
                  <p className="text-xs text-neutral-600 font-mono mt-1">
                    Select your authentication protocol to access repositories, roadmaps, and AI triage.
                  </p>
                </div>

                {/* Error & Info Alerts */}
                {error && (
                  <div className="mt-4 p-4 bg-rose-50 border-2 border-black text-rose-800 text-xs flex flex-col gap-2 font-mono shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span className="flex-1 font-bold">{error}</span>
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
                  <div className="mt-4 p-4 bg-amber-50 border-2 border-black text-amber-900 text-xs flex items-start gap-2.5 font-mono shadow-[2px_2px_0px_#000000]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-black uppercase">GitHub OAuth Setup Notice</p>
                      <p>{oauthNotice}</p>
                    </div>
                  </div>
                )}

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black my-5 shadow-[3px_3px_0px_#000000]">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('github'); setError(null); }}
                    className={`py-2.5 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                      authMode === 'github'
                        ? 'bg-[#DFFF4F] text-black border-black shadow-[2px_2px_0px_#000000]'
                        : 'border-transparent text-neutral-600 hover:text-black hover:bg-white'
                    }`}
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>OAuth</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('token'); setError(null); }}
                    className={`py-2.5 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                      authMode === 'token'
                        ? 'bg-[#DFFF4F] text-black border-black shadow-[2px_2px_0px_#000000]'
                        : 'border-transparent text-neutral-600 hover:text-black hover:bg-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('email'); setError(null); }}
                    className={`py-2.5 border-2 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                      authMode === 'email'
                        ? 'bg-[#DFFF4F] text-black border-black shadow-[2px_2px_0px_#000000]'
                        : 'border-transparent text-neutral-600 hover:text-black hover:bg-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>
                </div>

                {/* TAB 1: GITHUB OAUTH */}
                {authMode === 'github' && (
                  <div className="space-y-4 pt-1">
                    <button
                      type="button"
                      onClick={handleGitHubOAuth}
                      disabled={loading}
                      className="w-full py-4 px-5 bg-black hover:bg-[#1a1a1a] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <GithubIcon className="w-5 h-5 text-white" />
                        <span>{loading ? 'Connecting to GitHub...' : 'Continue with GitHub OAuth'}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="p-3 bg-[#FAF7EE] border-2 border-black text-[11px] font-mono text-neutral-700 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#0047FF] shrink-0" />
                      <span>One-click GitHub authorization. Syncs public and private repositories securely.</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: GITHUB PERSONAL ACCESS TOKEN */}
                {authMode === 'token' && (
                  <form onSubmit={handleTokenLogin} className="space-y-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-mono font-black text-black uppercase tracking-wider">
                          GitHub Personal Access Token
                        </label>
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono font-black text-[#0047FF] hover:underline flex items-center gap-1 uppercase"
                        >
                          <span>Generate Token</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="ghp_... or github_pat_..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                      <p className="text-[10px] font-mono text-neutral-500 mt-1 uppercase">
                        Requires read:user and repo scopes &bull; Stored in AES-256 vault
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer"
                    >
                      <span>{loading ? 'Verifying with GitHub...' : 'Connect with Token'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* TAB 3: EMAIL / PASSWORD */}
                {authMode === 'email' && (
                  <form onSubmit={handleEmailLogin} className="space-y-4 pt-1">
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
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
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
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#0047FF] hover:bg-black text-white border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer"
                    >
                      <span>{loading ? 'Authenticating...' : 'Sign In with Password'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Provisioning Callout */}
              <div className="pt-4 border-t-2 border-black flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-600">Need a fresh workspace tenant?</span>
                <Link
                  href="/signup"
                  className="px-3 py-1 bg-[#FAF7EE] hover:bg-[#DFFF4F] text-black font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                >
                  Create Account &rarr;
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#F6F3EC] border-t-2 border-black px-6 py-4 text-center text-xs text-neutral-600 font-mono uppercase font-black">
        DEVCOMMAND &bull; MULTI-TENANT ARCHITECTURE &bull; MONGODB ATLAS &bull; AES-256 VAULT
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
