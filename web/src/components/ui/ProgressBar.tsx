import React from 'react';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
  /** Accessible description of what the bar measures. */
  label?: string;
  /** Bar fill colour. Defaults to the brand blue to lime ramp. */
  tone?: 'brand' | 'lime' | 'violet';
}

const TONE_CLASSES = {
  brand: 'bg-gradient-to-r from-brand-blue-500 to-brand-lime-400',
  lime: 'bg-brand-lime-400',
  violet: 'bg-gradient-to-r from-brand-blue-500 to-brand-violet-500',
};

export function ProgressBar({
  value,
  className = '',
  label,
  tone = 'brand',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-1.5 w-full overflow-hidden rounded-full border border-ink-200/80 bg-ink-100 p-px ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out-expo ${TONE_CLASSES[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
