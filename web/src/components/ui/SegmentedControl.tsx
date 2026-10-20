'use client';

import React, { useEffect, useRef } from 'react';

export interface SegmentedControlItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** `dark` sits on the blue canvas, `light` on a white surface. */
  tone?: 'dark' | 'light';
  className?: string;
}

/**
 * A scroll-safe segmented control.
 *
 * The previous implementation was a flex row with `overflow-x-auto` inside a
 * fixed-width container, which clipped the last tab ("Hidden") even on a
 * 1440px display. This version scrolls properly, keeps the selected tab in
 * view, and exposes real tab semantics.
 */
export function SegmentedControl<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  tone = 'dark',
  className = '',
}: SegmentedControlProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const active = activeRef.current;
    const list = listRef.current;
    if (!active || !list) return;
    if (active.offsetLeft < list.scrollLeft) {
      list.scrollTo({ left: active.offsetLeft - 8, behavior: 'smooth' });
    } else if (active.offsetLeft + active.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({
        left: active.offsetLeft + active.offsetWidth - list.clientWidth + 8,
        behavior: 'smooth',
      });
    }
  }, [value]);

  const isDark = tone === 'dark';

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        isDark
          ? 'border border-white/15 bg-ink-950/25 backdrop-blur-md'
          : 'border border-brand-blue-500/12 bg-brand-blue-50'
      } ${className}`}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={selected ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold transition-colors duration-150 ${
              selected
                ? isDark
                  ? 'bg-brand-lime-400 text-black shadow-lime'
                  : 'bg-brand-blue-500 text-white shadow-blue'
                : isDark
                  ? 'text-white/75 hover:bg-white/10 hover:text-white'
                  : 'text-ink-600 hover:bg-white hover:text-ink-900'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-px text-[0.625rem] font-black ${
                  selected
                    ? isDark
                      ? 'bg-black/15 text-black'
                      : 'bg-white/25 text-white'
                    : isDark
                      ? 'bg-white/15 text-white/85'
                      : 'bg-brand-blue-500/10 text-brand-blue-700'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
