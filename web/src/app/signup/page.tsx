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
  ExternalLink
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
          <span>MONGODB ATLAS STORAGE</span>
        </div>
      </header>

      {/* Main Form Card */}
      <main className="max-w-md w-full mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="bg-white text-slate-900 border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0038FF]/10 text-[#0038FF] border border-[#0038FF]/20 text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isolated Environment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Get an isolated workspace with autonomous GitHub repo ingestion &amp; AI triage.
            </p>
          </div>

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
                <p className="font-semibold">Notice</p>
                <p>{oauthNotice}</p>
              </div>
            </div>
          )}

          {/* Primary Action: GitHub OAuth */}
          <button
            type="button"
            onClick={handleGitHubOAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#24292F] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <GithubIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span>{loading ? 'Connecting...' : 'Sign up with GitHub'}</span>
            <ArrowRight className="w-4 h-4 ml-auto text-white/60 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-400 font-bold uppercase">
              Or with email
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Email Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                GitHub Username (Optional)
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0038FF] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002AD4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer mt-1"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer inside card */}
          <div className="text-center pt-2 text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link href="/login" className="font-bold text-[#0038FF] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-white/70 relative z-10 font-mono">
        DevCommand &bull; Isolated Multi-Tenant Architecture &bull; MongoDB Atlas &bull; AES-256 Vault
      </footer>
    </div>
  );
}
