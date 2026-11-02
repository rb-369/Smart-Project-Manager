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
 * It eliminates harsh strobing, pulsing, or alternating flashing,
 * matching the signature Swiss Neo-Brutalist parchment, black borders, and color accents.
 */
export function StaticLoader({
  label = 'HYDRATING REPOSITORY TELEMETRY',
  sublabel = 'Connecting to isolated workspace matrix...',
  fullScreen = true,
}: StaticLoaderProps) {
  const content = (
    <div className="bg-white text-black border-3 border-black p-8 max-w-sm w-full mx-auto text-center shadow-[8px_8px_0px_#000000] space-y-5">
      {/* Brand Monogram with Cobalt Blue & Lime Terminal Icon */}
      <div className="w-12 h-12 bg-[#0047FF] border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000000]">
        <Terminal className="w-6 h-6 text-[#DFFF4F]" />
      </div>

      {/* Steady, Calm Typography */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-black text-black tracking-tight uppercase font-mono">
          {label}
        </h3>
        <p className="text-xs text-neutral-600 font-mono leading-relaxed">
          {sublabel}
        </p>
      </div>

      {/* Static Calm Telemetry Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF7EE] border-2 border-black text-[11px] font-mono text-black shadow-[2px_2px_0px_#000000]">
        <span className="w-2 h-2 rounded-full bg-[#DFFF4F] border border-black" />
        <span className="font-black text-black">INITIALIZING ENGINE</span>
        <span className="text-black/40">&bull;</span>
        <span className="text-neutral-600 font-bold">READY</span>
      </div>

      {/* Steady Progress Track */}
      <div className="w-48 h-3 bg-[#FAF7EE] border-2 border-black mx-auto overflow-hidden p-0.5">
        <div className="w-3/5 h-full bg-[#DFFF4F] border-r-2 border-black" />
      </div>

      {/* Security Footprint Badge */}
      <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-600 uppercase font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-black" />
        <span>AES-256 Vault &bull; Isolated Tenant</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F6F3EC] text-black flex items-center justify-center p-4 selection:bg-[#DFFF4F] selection:text-black font-sans">
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
