'use client';

import React from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';

interface StaticLoaderProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

/**
 * StaticLoader provides a calm, eye-friendly loading state that remains
 * completely static. It eliminates harsh strobing, pulsing, or alternating
 * blue-and-white flashing, while maintaining the signature DevCommand
 * electric blue and neon lime theme.
 */
export function StaticLoader({
  label = 'Hydrating Repository Telemetry',
  sublabel = 'Connecting to isolated workspace matrix...',
  fullScreen = true,
}: StaticLoaderProps) {
  const content = (
    <div className="mx-auto w-full max-w-sm space-y-5 rounded-3xl border border-white/12 bg-ink-950/85 p-8 text-center shadow-deep backdrop-blur-xl">
      {/* Static Brand Monogram with Electric Blue gradient & Lime Terminal Icon */}
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-brand-blue-500 to-brand-blue-800 shadow-[0_10px_28px_-12px_rgba(0,56,255,0.7)]">
        <Terminal className="h-6 w-6 text-brand-lime-400" aria-hidden="true" />
      </div>

      {/* Steady, Calm Typography - strictly non-pulsing and eye-friendly */}
      <div className="space-y-1.5">
        <h3 className="font-mono text-[0.8125rem] font-black uppercase tracking-tight text-white">
          {label}
        </h3>
        <p className="font-mono text-[0.6875rem] leading-relaxed text-ink-400">{sublabel}</p>
      </div>

      {/* Static Calm Telemetry Pill - Completely steady, zero strobe */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.6875rem] text-ink-300">
        <span className="h-2 w-2 rounded-full bg-brand-lime-400" aria-hidden="true" />
        <span className="font-bold text-white">INITIALIZING ENGINE</span>
        <span className="text-white/30">•</span>
        <span className="text-ink-400">READY</span>
      </div>

      {/* Steady Soothing Progress Indicator Track (Static) */}
      <div
        className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Initializing"
        aria-valuenow={60}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full w-3/5 rounded-full bg-brand-lime-400" />
      </div>

      {/* Security Footprint Badge */}
      <div className="flex items-center justify-center gap-1.5 pt-1 font-mono text-[0.625rem] text-ink-500">
        <ShieldCheck className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
        <span>AES-256 Vault • Isolated Tenant</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="surface-canvas flex min-h-screen items-center justify-center p-4 selection:bg-brand-lime-400 selection:text-black">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-16">{content}</div>
  );
}

export default StaticLoader;
