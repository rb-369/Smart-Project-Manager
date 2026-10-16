'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GitHubStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, GitBranch, Lock, Server } from 'lucide-react';

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

  const tickerItems = [
    '⚡ AES-256 VAULT ENCRYPTION',
    '⚡ ZERO-LEAK CREDENTIAL ISOLATION',
    '⚡ GITHUB WEBHOOK PIPELINE',
    '⚡ SHA-256 INTEGRITY VALIDATION',
    '⚡ CONTINUOUS POLL SCHEDULE'
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#C6FF20] selection:text-black">
      
      {/* ====================================================================
          1. TOP HERO: ELECTRIC BLUE BLUEPRINT GRID (Matching Landing Page)
          ==================================================================== */}
      <section className="bg-blue-grid text-white pt-6 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Ambient Vignettes on Blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Island Navigation Header */}
        <Navbar />

        {/* Hero Content Block */}
        <div className="max-w-4xl mx-auto text-center relative z-10 pt-20 pb-8">
          
          {/* Top Neon Badge Pill */}
          <div className="flex justify-center mb-5">
            <span className="lime-sticker text-xs font-black shadow-[0_4px_16px_rgba(198,255,32,0.4)]">
              ⚡ ZERO-LEAK CREDENTIAL VAULT
            </span>
          </div>

          {/* Massive Stacked White Headline */}
          <div className="relative inline-block max-w-4xl mx-auto px-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[0.95]">
              <div className="tracking-tight mb-2">SYSTEM VAULT &amp;</div>
              <div className="flex items-center justify-center flex-wrap gap-3 mt-1 sm:mt-2">
                <span className="tracking-tight">CREDENTIAL</span>
                <span className="inline-block bg-[#C6FF20] text-black px-4 py-1 sm:py-2 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl font-black shadow-[0_8px_30px_rgba(198,255,32,0.6)] -rotate-1 hover:rotate-0 transition-transform">
                  SETTINGS
                </span>
              </div>
            </h1>

            {/* Hand-Drawn SVG Neon Lime Arrow */}
            <div className="hidden md:block absolute -top-6 -right-10 text-[#C6FF20]">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-12">
                <path d="M20 70 C 35 30, 65 30, 75 40" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" />
                <path d="M60 28 L 78 40 L 70 58" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Subtext */}
          <p className="text-white/85 text-sm sm:text-base max-w-xl mx-auto mt-5 leading-relaxed font-normal">
            Configure encrypted GitHub personal access tokens, background repository synchronizers, and zero-leak API authentication.
          </p>

          {/* Security Counters */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span>Cipher: AES-256 GCM</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status?.is_connected ? 'bg-[#C6FF20]' : 'bg-amber-400'}`} />
              <span>Pipeline: {status?.is_connected ? 'Connected' : 'Token Required'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          2. ACID LIME TICKER MARQUEE TAPE
          ==================================================================== */}
      <div className="w-full bg-[#C6FF20] text-black font-mono font-black text-xs sm:text-sm uppercase py-3 tracking-wider border-y-2 border-black/15 overflow-hidden select-none relative z-30 shadow-lg">
        <div className="animate-marquee gap-8">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 font-bold text-lg">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. CLEAN BRIGHT WHITE CURVED SHEET (Form Controls)
          ==================================================================== */}
      <main className="bg-white text-slate-900 rounded-t-[44px] sm:rounded-t-[60px] -mt-6 relative z-20 shadow-2xl pt-14 pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full space-y-8 flex-1">
        
        {/* GitHub Connection Card */}
        <div className="gridster-panel bg-white border border-slate-200/90 shadow-md p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0038FF] text-white flex items-center justify-center shadow-md shrink-0">
                <GitBranch className="w-6 h-6 text-[#C6FF20]" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-950 uppercase">GitHub Ingestion Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodic branch polling &amp; on-demand AST decomposition for your repositories.
                </p>
              </div>
            </div>

            {status?.is_connected ? (
              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-black text-emerald-800 bg-emerald-100 border border-emerald-300 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-black text-amber-800 bg-amber-100 border border-amber-300 self-start sm:self-auto">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Token Missing
              </span>
            )}
          </div>

          {/* Token Form */}
          <form onSubmit={handleSaveToken} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-2">
                GitHub Personal Access Token (PAT)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
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

        {/* Security Specs Card */}
        <div className="gridster-panel bg-white border border-slate-200/90 shadow-md p-6 sm:p-8 rounded-3xl space-y-4">
          <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">
            Zero-Leak Architecture Specifications
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Encryption</span>
              <p className="font-bold text-xs text-slate-900 mt-1">AES-256 GCM</p>
              <p className="text-[11px] text-slate-500 mt-1">Hardware-accelerated authenticated cipher.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Memory Hygiene</span>
              <p className="font-bold text-xs text-slate-900 mt-1">Zero Plaintext Log</p>
              <p className="text-[11px] text-slate-500 mt-1">Tokens sanitized before telemetry serialization.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Inference Isolation</span>
              <p className="font-bold text-xs text-slate-900 mt-1">Ephemeral Context</p>
              <p className="text-[11px] text-slate-500 mt-1">Multi-tier models discard code diffs post-triage.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
