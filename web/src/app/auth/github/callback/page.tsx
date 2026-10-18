'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GithubIcon } from '@/components/GithubIcon';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

import { StaticLoader } from '@/components/StaticLoader';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) {
      setStatus('error');
      setErrorMessage(errorParam);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No GitHub authorization code received in callback.');
      return;
    }

    let isMounted = true;

    async function exchangeCode() {
      try {
        const res: any = await api.post('/auth/github/callback', { code });
        if (!isMounted) return;

        if (res?.tokens?.access_token) {
          api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
          await refreshUser();
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1200);
        } else {
          throw new Error('Authentication succeeded but tokens were missing.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Failed to exchange GitHub authorization code.');
      }
    }

    exchangeCode();

    return () => {
      isMounted = false;
    };
  }, [code, errorParam, refreshUser, router]);

  return (
    <div className="bg-white text-slate-900 border border-white/30 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-auto text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-[#24292F] text-white flex items-center justify-center mx-auto shadow-md">
        <GithubIcon className="w-8 h-8" />
      </div>

      {status === 'processing' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900">
              Authenticating with GitHub
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Exchanging secure authorization code and preparing your isolated workspace...
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold">VERIFYING CREDENTIALS</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500">STANDBY</span>
          </div>

          <div className="w-44 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-2/3 h-full bg-[#0038FF] rounded-full" />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Welcome to DevCommand!
          </h2>
          <p className="text-xs text-slate-500">
            GitHub profile linked successfully. Redirecting to Command Center...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            GitHub Authentication Failed
          </h2>
          <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left font-mono">
            {errorMessage}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-[#0038FF] hover:bg-[#002AD4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Return to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <StaticLoader
        label="Authorizing with GitHub"
        sublabel="Exchanging cryptographic OAuth tokens..."
        fullScreen={true}
      />
    }>
      <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col justify-center items-center p-4 selection:bg-[#C6FF20] selection:text-black font-sans">
        <CallbackContent />
      </div>
    </Suspense>
  );
}
