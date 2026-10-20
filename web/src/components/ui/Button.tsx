import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary' /* lime fill, black text */
  | 'secondary' /* blue fill, white text */
  | 'outline' /* white fill, hairline border */
  | 'ghost' /* transparent, blue text */
  | 'danger'; /* rose fill, white text */

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

export type ButtonLinkProps = ButtonBaseProps &
  Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ButtonBaseProps | 'href'
  > & {
    href: string;
  };

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[0.6875rem] gap-1.5',
  md: 'px-5 py-2.5 text-[0.8125rem] gap-2',
  lg: 'px-7 py-3.5 text-sm gap-2.5',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-lime-400 text-black border border-black/10 shadow-lime hover:bg-brand-lime-300 hover:shadow-[0_10px_28px_-8px_rgba(198,255,32,0.6)]',
  secondary:
    'bg-brand-blue-500 text-white border border-transparent shadow-blue hover:bg-brand-blue-400 hover:shadow-[0_12px_34px_-10px_rgba(0,56,255,0.55)]',
  outline:
    'bg-white text-ink-800 border border-brand-blue-500/15 shadow-e1 hover:bg-brand-blue-50 hover:border-brand-blue-500/30 hover:shadow-e2',
  ghost:
    'bg-transparent text-brand-blue-600 border border-transparent hover:bg-brand-blue-50',
  danger:
    'bg-rose-600 text-white border border-transparent shadow-[0_6px_18px_-8px_rgba(225,29,72,0.6)] hover:bg-rose-500',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em] ' +
  'transition-[transform,background-color,box-shadow,border-color] duration-150 ease-out-expo ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

function buildClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className: string,
) {
  return [
    BASE_CLASSES,
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The single button primitive. Renders an anchor when `href` is supplied so
 * links keep real link semantics (open in new tab, middle click, etc).
 */
export function Button(props: ButtonProps): React.ReactElement;
export function Button(props: ButtonLinkProps): React.ReactElement;
export function Button(props: ButtonProps | ButtonLinkProps): React.ReactElement {
  const {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    loading = false,
    fullWidth = false,
    className = '',
    children,
    href,
  } = props as ButtonBaseProps & { href?: string };

  const classes = buildClasses(variant, size, fullWidth, className);

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </>
  );

  if (href) {
    const anchorProps = props as ButtonLinkProps;
    return (
      <Link
        href={anchorProps.href}
        className={classes}
        onClick={anchorProps.onClick}
        target={anchorProps.target}
        rel={anchorProps.rel}
        aria-label={anchorProps['aria-label']}
        title={anchorProps.title}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;
  const {
    type,
    disabled,
    onClick,
    name,
    form,
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    title,
  } = buttonProps;

  return (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      onClick={onClick}
      name={name}
      form={form}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={classes}
    >
      {content}
    </button>
  );
}

export default Button;
