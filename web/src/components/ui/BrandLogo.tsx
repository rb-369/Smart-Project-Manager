import React from 'react';

type BrandLogoVariant = 'onDark' | 'onLight';

interface BrandLogoProps {
  /** Rendered size of the mark in pixels. */
  size?: number;
  /** Render the wordmark and tagline next to the mark. */
  showWordmark?: boolean;
  /** Small uppercase descriptor under the wordmark. */
  tagline?: string;
  /** `onDark` for the blue canvas, `onLight` for white surfaces. */
  variant?: BrandLogoVariant;
  className?: string;
}

/**
 * The DevCommand monogram. This is the single source of truth for the logo —
 * it previously existed as a copy-pasted inline SVG in four different files.
 */
export function BrandLogo({
  size = 32,
  showWordmark = true,
  tagline = 'Autonomous Engine',
  variant = 'onDark',
  className = '',
}: BrandLogoProps) {
  const isDark = variant === 'onDark';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-[0.625rem] border border-white/25 shadow-[0_6px_18px_-8px_rgba(0,10,40,0.6)]"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-brand-blue-400 via-brand-blue-600 to-brand-blue-800" />
        <svg viewBox="0 0 512 512" fill="none" className="relative h-full w-full p-[16%]">
          <path
            d="M208 116 L288 116 L226 232 L286 232 L150 408 L184 274 L140 274 Z"
            fill="#C6FF20"
          />
          <path
            d="M306 132 L394 256 L306 380 L254 380 L336 264 L336 248 L254 132 Z"
            fill="#FFFFFF"
          />
        </svg>
      </span>

      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={`truncate text-[0.9375rem] font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-ink-900'
            }`}
          >
            DevCommand
          </span>
          <span
            className={`mt-0.5 font-mono text-[0.5625rem] font-bold uppercase tracking-[0.18em] ${
              isDark ? 'text-brand-lime-400' : 'text-brand-blue-600'
            }`}
          >
            {tagline}
          </span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
