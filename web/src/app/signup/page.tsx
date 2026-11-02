'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GithubIcon } from '@/components/GithubIcon';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Database,
  CheckCircle2,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user, loginWithGitHub, registerWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGitHubOAuth = async () => {
    setLoading(true);
    setError(null);
    setOauthNotice(null);
    try {
      await loginWithGitHub();
    } catch (err: any) {
      if (err.message === 'GITHUB_OAUTH_NOT_CONFIGURED') {
        setOauthNotice(
          'GitHub OAuth App credentials are not configured in .env yet. You can sign up using email below or connect with a GitHub Personal Access Token on the Login page.'
        );
      } else {
        setError(err.message || 'GitHub OAuth failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerWithEmail(email, password, fullName, githubUsername);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength score
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: 'EMPTY', color: 'bg-neutral-200' };
    if (password.length < 6) return { level: 1, label: 'TOO SHORT (MIN 6)', color: 'bg-[#FF5533]' };
    if (password.length < 10) return { level: 2, label: 'GOOD', color: 'bg-amber-300' };
    return { level: 3, label: 'STRONG (SHIELD ACTIVE)', color: 'bg-[#BBF7D0]' };
  };

  const strength = getPasswordStrength();

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
                TENANT PROVISIONING // REGISTRATION
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] font-mono text-[10px] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>ISOLATED TENANT MATRIX</span>
            </div>
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-[#FAF7EE] hover:bg-black hover:text-[#DFFF4F] border-2 border-black text-black text-xs font-mono font-black uppercase transition shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main 2-Column Architectural Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Provisioning Blueprint & Features Matrix (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            {/* Box 1: Cobalt Blue Provisioning Overview */}
            <div className="bg-[#0047FF] text-white border-3 border-black p-6 sm:p-7 shadow-[6px_6px_0px_#000000] relative overflow-hidden flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-black text-[#DFFF4F] border border-black tracking-widest">
                    TENANT.INITIALIZE // NEW ACCOUNT
                  </span>
                  <div className="w-7 h-7 bg-white text-black border-2 border-black flex items-center justify-center font-mono font-black text-xs shadow-[2px_2px_0px_#000000]">
                    +
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                  Provision Your Autonomous Development Hub
                </h2>
                <p className="text-xs text-white/90 mt-2 font-mono leading-relaxed">
                  Upon registration, your workspace receives a dedicated UUID partition with full multi-agent triage, vector storage, and repository telemetry.
                </p>
              </div>

              {/* 4 Provisioned Engine Layers */}
              <div className="space-y-2 pt-2 border-t-2 border-white/20">
                <div className="p-3 bg-black/25 border border-white/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-[#DFFF4F]">
                    <Database className="w-3.5 h-3.5" />
                    <span>1. Dedicated MongoDB Partition</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-mono">
                    Zero cross-tenant data leakage. All repositories and feature tasks are partitioned by your tenant ID.
                  </p>
                </div>

                <div className="p-3 bg-black/25 border border-white/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-[#DFFF4F]">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>2. 3-Agent Reasoning Swarm</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-mono">
                    Instant access to The Judge, Market Researcher, and Feature Planner powered by Gemini &amp; Llama 3.2.
                  </p>
                </div>

                <div className="p-3 bg-black/25 border border-white/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-[#DFFF4F]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>3. Qdrant Cloud Vectors &amp; AST</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-mono">
                    Semantic indexing of codebases with zero plain-text token exposure.
                  </p>
                </div>
              </div>
            </div>

            {/* Box 2: Security & Assurance Stamp */}
            <div className="bg-[#BBF7D0] text-black border-2 border-black p-4 shadow-[4px_4px_0px_#000000] flex items-center justify-between text-xs font-mono font-black uppercase">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Zero Credit Card &bull; Instant Provisioning</span>
              </span>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 border border-black">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Right Column: Tactile Swiss Registration Console (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white text-black border-3 border-black p-6 sm:p-9 shadow-[8px_8px_0px_#000000] space-y-5 h-full flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="pb-4 border-b-2 border-black">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-[#0047FF] uppercase font-black tracking-wider">
                      [SYS.GATEWAY // REGISTRATION_01]
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                      PROVISION TENANT
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                    Create Developer Account
                  </h1>
                  <p className="text-xs text-neutral-600 font-mono mt-1">
                    Sign up with GitHub OAuth for one-click access, or initialize via email and password.
                  </p>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="mt-4 p-4 bg-rose-50 border-2 border-black text-rose-800 text-xs flex items-start gap-2.5 font-mono shadow-[2px_2px_0px_#000000]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}

                {oauthNotice && (
                  <div className="mt-4 p-4 bg-amber-50 border-2 border-black text-amber-900 text-xs flex items-start gap-2.5 font-mono shadow-[2px_2px_0px_#000000]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-black uppercase">Notice</p>
                      <p>{oauthNotice}</p>
                    </div>
                  </div>
                )}

                {/* Primary Action: GitHub OAuth */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleGitHubOAuth}
                    disabled={loading}
                    className="w-full py-4 px-5 bg-black hover:bg-[#1a1a1a] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <GithubIcon className="w-5 h-5 text-white" />
                      <span>{loading ? 'Connecting to GitHub...' : 'Sign up with GitHub (Fast 1-Click)'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t-2 border-black" />
                  <span className="flex-shrink mx-3 text-[11px] font-mono text-neutral-600 font-black uppercase">
                    Or with developer email
                  </span>
                  <div className="flex-grow border-t-2 border-black" />
                </div>

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                        GitHub Username <span className="text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <GithubIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          placeholder="janedoe"
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono font-black text-black uppercase tracking-wider">
                        Password *
                      </label>
                      <span className="text-[10px] font-mono font-black uppercase text-neutral-600">
                        Strength: {strength.label}
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                    {/* Live Password Strength Meter */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <div className={`h-1.5 border border-black ${strength.level >= 1 ? strength.color : 'bg-neutral-200'}`} />
                      <div className={`h-1.5 border border-black ${strength.level >= 2 ? strength.color : 'bg-neutral-200'}`} />
                      <div className={`h-1.5 border border-black ${strength.level >= 3 ? strength.color : 'bg-neutral-200'}`} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer mt-2"
                  >
                    <span>{loading ? 'Provisioning Tenant Workspace...' : 'Initialize Tenant Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Bottom Switcher */}
              <div className="pt-4 border-t-2 border-black flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-600">Already have an active account?</span>
                <Link
                  href="/login"
                  className="px-3 py-1 bg-[#FAF7EE] hover:bg-[#DFFF4F] text-black font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                >
                  Sign In &rarr;
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
