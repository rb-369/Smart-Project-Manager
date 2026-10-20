'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  label?: string;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * A small overflow menu. Replaces the permanently-visible reorder arrows and
 * delete buttons that used to sit on every card.
 */
export function Menu({ items, label = 'More actions', align = 'right', className = '' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-blue-500/30 hover:bg-brand-blue-50 hover:text-brand-blue-600"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1.5 w-48 animate-fade-in-up overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-e3 on-light ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.75rem] font-semibold transition-colors disabled:opacity-40 ${
                item.tone === 'danger'
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-ink-700 hover:bg-brand-blue-50 hover:text-brand-blue-700'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Menu;
