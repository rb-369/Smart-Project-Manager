'use client';

import React, { useId } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the wiring props that must be spread onto the control. */
  children: (control: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    className: string;
  }) => React.ReactNode;
}

export const CONTROL_CLASS =
  'w-full rounded-xl border bg-brand-blue-50/60 px-3.5 py-2.5 text-[0.8125rem] text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500';

export function Field({
  label,
  hint,
  error,
  required,
  className = '',
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
      >
        {label}
        {required && (
          <span className="ml-1 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: `${CONTROL_CLASS} ${
          error ? 'border-rose-300 focus-visible:outline-rose-500' : 'border-brand-blue-500/15'
        }`,
      })}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.6875rem] leading-relaxed text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-[0.6875rem] font-medium leading-relaxed text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      {(control) => (
        <input
          {...control}
          {...rest}
          className={`${control.className} ${className ?? ''}`}
        />
      )}
    </Field>
  );
}

export default Field;
