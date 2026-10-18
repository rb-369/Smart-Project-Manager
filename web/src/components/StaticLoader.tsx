'use client';

import React from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';

interface StaticLoaderProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

/**
 * StaticLoader provides a calm, eye-friendly loading state that remains completely static.
 * It eliminates harsh strobing, pulsing, or alternating blue-and-white flashing,
 * while maintaining the signature DevCommand electric blue and neon lime theme.
 */
export function StaticLoader({
  label = 'Hydrating Repository Telemetry',
  sublabel = 'Connecting to isolated workspace matrix...',
  fullScreen = true,
}: StaticLoaderProps) {
  const content = (
    <div className="bg-slate-950/90 text-white border border-white/15 rounded-3xl p-8 max-w-sm w-full mx-auto text-center shadow-2xl backdrop-blur-xl space-y-5">
      {/* Static Brand Monogram with Electric Blue gradient & Lime Terminal Icon */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0038FF] to-[#0020A0] border border-white/20 flex items-center justify-center mx-auto shadow-lg shadow-[#0038FF]/20">
        <Terminal className="w-6 h-6 text-[#C6FF20]" />
      </div>

      {/* Steady, Calm Typography - strictly non-pulsing and eye-friendly */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-black text-white tracking-tight uppercase font-mono">
          {label}
        </h3>
        <p className="text-xs text-slate-400 font-mono leading-relaxed">
          {sublabel}
        </p>
      </div>

      {/* Static Calm Telemetry Pill - Completely steady, zero strobe */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
        <span className="w-2 h-2 rounded-full bg-[#C6FF20]" />
        <span className="font-bold text-white">INITIALIZING ENGINE</span>
        <span className="text-white/40">&bull;</span>
        <span className="text-slate-400">READY</span>
      </div>

      {/* Steady Soothing Progress Indicator Track (Static) */}
      <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
        <div className="w-3/5 h-full bg-[#C6FF20] rounded-full" />
      </div>

      {/* Security Footprint Badge */}
      <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>AES-256 Vault &bull; Isolated Tenant</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-blue-grid text-white flex items-center justify-center p-4 selection:bg-[#C6FF20] selection:text-black">
        {content}
      </div>
    );
  }

  return (
    <div className="py-20 w-full flex items-center justify-center">
      {content}
    </div>
  );
}
