'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GithubIcon } from '@/components/GithubIcon';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="bg-white text-black border-3 border-black p-8 shadow-[8px_8px_0px_#000000] max-w-md w-full mx-auto text-center space-y-6">
      <div className="w-14 h-14 bg-black text-white border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000000]">
        <GithubIcon className="w-8 h-8" />
      </div>

      {status === 'processing' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-black uppercase tracking-tight">
              Authenticating with GitHub
            </h2>
            <p className="text-xs text-neutral-600 font-mono">
              Exchanging secure authorization code and preparing your isolated workspace...
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black uppercase text-black shadow-[2px_2px_0px_#000000]">
            <span className="w-2 h-2 rounded-full bg-[#DFFF4F] border border-black" />
            <span>VERIFYING CREDENTIALS</span>
            <span className="text-black/40">&bull;</span>
            <span className="text-neutral-500">STANDBY</span>
          </div>

          <div className="w-44 h-3 bg-[#FAF7EE] border-2 border-black mx-auto overflow-hidden p-0.5">
            <div className="w-2/3 h-full bg-[#0047FF] border-r-2 border-black" />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-3">
          <div className="w-10 h-10 bg-[#BBF7D0] border-2 border-black text-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000000]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">
            Welcome to DevCommand!
          </h2>
          <p className="text-xs text-neutral-600 font-mono">
            GitHub profile linked successfully. Redirecting to Command Center...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-10 h-10 bg-rose-100 border-2 border-black text-rose-700 flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000000]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">
            GitHub Authentication Failed
          </h2>
          <p className="text-xs text-rose-800 bg-rose-50 p-3 border-2 border-black text-left font-mono">
            {errorMessage}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 bg-[#0047FF] hover:bg-black text-white font-mono font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 transition"
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
        label="AUTHORIZING WITH GITHUB"
        sublabel="Exchanging cryptographic OAuth tokens..."
        fullScreen={true}
      />
    }>
      <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col justify-center items-center p-4 selection:bg-[#DFFF4F] selection:text-black font-sans">
        <CallbackContent />
      </div>
    </Suspense>
  );
}
