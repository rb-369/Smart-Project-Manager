import React from 'react';

export type BadgeTone =
  | 'neutral'
  | 'blue'
  | 'lime'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'slate';

export type BadgeSize = 'xs' | 'sm';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Renders a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  blue: 'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200',
  lime: 'bg-brand-lime-100 text-brand-lime-700 border-brand-lime-200',
  violet: 'bg-brand-violet-50 text-brand-violet-700 border-brand-violet-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-ink-100 text-ink-600 border-ink-200',
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-400',
  blue: 'bg-brand-blue-500',
  lime: 'bg-brand-lime-500',
  violet: 'bg-brand-violet-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-ink-400',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[0.625rem]',
  sm: 'px-2.5 py-1 text-[0.6875rem]',
};

export function Badge({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    'inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-[0.06em] whitespace-nowrap',
    SIZE_CLASSES[size],
    TONE_CLASSES[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   PRIORITY — one semantic scale for the whole app.
   Previously P0 rendered as rose in one place and lime in another, and the
   ideas board showed P0 and P1 with the same dot colour. This is the single
   source of truth.
   ------------------------------------------------------------------------- */

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

const PRIORITY_META: Record<
  Priority,
  { label: string; tone: BadgeTone; weight: string; dot: string }
> = {
  P0: {
    label: 'Critical',
    tone: 'rose',
    weight: '4×',
    dot: 'bg-rose-500',
  },
  P1: {
    label: 'High',
    tone: 'amber',
    weight: '3×',
    dot: 'bg-amber-500',
  },
  P2: {
    label: 'Medium',
    tone: 'blue',
    weight: '2×',
    dot: 'bg-brand-blue-500',
  },
  P3: {
    label: 'Low',
    tone: 'emerald',
    weight: '1×',
    dot: 'bg-emerald-500',
  },
};

export function PriorityBadge({
  priority,
  showWeight = false,
  size = 'sm',
  className = '',
}: {
  priority: Priority;
  showWeight?: boolean;
  size?: BadgeSize;
  className?: string;
}) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.P2;
  return (
    <Badge tone={meta.tone} dot size={size} className={className}>
      {priority}
      <span className="font-sans font-semibold normal-case opacity-80">
        {meta.label}
      </span>
      {showWeight && (
        <span className="font-sans font-bold normal-case opacity-70">
          {meta.weight}
        </span>
      )}
    </Badge>
  );
}

export function priorityMeta(priority: string) {
  return PRIORITY_META[priority as Priority] ?? PRIORITY_META.P2;
}

export default Badge;
