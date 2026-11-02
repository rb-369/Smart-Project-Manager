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
          <span>MONGODB ATLAS STORAGE</span>
        </div>
      </header>

      {/* Main Form Card */}
      <main className="max-w-md w-full mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="bg-white text-black border-3 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-5">
          
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF7EE] text-black border-2 border-black text-[11px] font-mono font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0px_#000000]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>Isolated Environment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-mono">
              Get an isolated workspace with autonomous GitHub repo ingestion &amp; AI triage.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-black text-rose-800 text-xs flex items-start gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {oauthNotice && (
            <div className="p-3.5 bg-amber-50 border-2 border-black text-amber-900 text-xs flex items-start gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black uppercase">Notice</p>
                <p>{oauthNotice}</p>
              </div>
            </div>
          )}

          {/* Primary Action: GitHub OAuth */}
          <button
            type="button"
            onClick={handleGitHubOAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-black hover:bg-[#111] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-3 transition-all cursor-pointer group"
          >
            <GithubIcon className="w-5 h-5 text-white" />
            <span>{loading ? 'Connecting...' : 'Sign up with GitHub'}</span>
            <ArrowRight className="w-4 h-4 ml-auto text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-2 border-black" />
            <span className="flex-shrink mx-3 text-[11px] font-mono text-neutral-600 font-black uppercase">
              Or with email
            </span>
            <div className="flex-grow border-t-2 border-black" />
          </div>

          {/* Email Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3">
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
                  className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                />
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
                  className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                GitHub Username (Optional)
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full pl-10 pr-4 py-2 border-2 border-black text-xs font-mono bg-[#FAF7EE] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer mt-1"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer inside card */}
          <div className="text-center pt-2 text-xs text-neutral-600 font-mono">
            <span>Already have an account? </span>
            <Link href="/login" className="font-black text-[#0047FF] hover:underline uppercase">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-neutral-600 border-t-2 border-black relative z-10 font-mono uppercase font-bold">
        DevCommand &bull; Isolated Multi-Tenant Architecture &bull; MongoDB Atlas &bull; AES-256 Vault
      </footer>
    </div>
  );
}
