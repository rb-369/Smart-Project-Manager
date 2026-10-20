'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { WifiOff } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The frame every signed-in screen sits in: the blue canvas, the fixed
 * navigation island, and a consistent content column.
 */
export function AppShell({ children, className = '' }: AppShellProps) {
  const { sessionError } = useAuth();

  return (
    <div
      className={`surface-canvas relative min-h-screen overflow-x-clip text-white selection:bg-brand-lime-400 selection:text-black ${className}`}
    >
      {children}

      {sessionError && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-lg items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50/95 px-4 py-3 font-mono text-[0.75rem] text-amber-900 shadow-e3 sm:inset-x-auto sm:bottom-6"
        >
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            <strong className="font-black">Workspace unreachable.</strong> Your session is
            still valid — this is a connection problem, not a sign-out. Data on screen may
            be stale.
          </span>
        </div>
      )}
    </div>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The standard content column. Matches the navigation island's max width so
 * the page and the header share the same left and right edges.
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main
      id="main-content"
      className={`relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A consistent page title block: monospace eyebrow, large title, supporting
 * description, and a right-aligned action cluster.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 pb-2 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-brand-lime-400 pulse-lime"
              aria-hidden="true"
            />
            {eyebrow}
          </div>
        )}
        <h1 className="text-h1 font-extrabold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.8125rem] leading-relaxed text-white/75">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}

export default AppShell;
