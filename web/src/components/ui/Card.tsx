import React from 'react';

export type CardTone = 'card' | 'deep' | 'well' | 'glass';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  /** Adds a hover lift. Only use for cards that are themselves interactive. */
  interactive?: boolean;
  /** Removes the default padding so the caller can control layout fully. */
  flush?: boolean;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<CardTone, string> = {
  card: 'surface-card',
  deep: 'surface-deep',
  well: 'surface-well',
  glass: 'surface-glass',
};

export function Card({
  tone = 'card',
  interactive = false,
  flush = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    TONE_CLASSES[tone],
    flush ? '' : 'p-5 sm:p-6',
    interactive
      ? 'transition-[transform,box-shadow,border-color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-e3'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export default Card;
