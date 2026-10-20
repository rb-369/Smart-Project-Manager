'use client';

import { Feature } from '@/types';
import { CheckCircle2, RotateCcw, Trash2, Check } from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';
import { Menu } from '@/components/ui/Menu';

interface FeatureCardProps {
  feature: Feature;
  onToggleStatus: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
}

/**
 * A single deliverable on the project roadmap. The delete button used to sit
 * permanently next to the feature title, one stray click away from losing
 * work — it now lives in an overflow menu.
 */
export function FeatureCard({ feature, onToggleStatus, onDelete }: FeatureCardProps) {
  const done = feature.status === 'DONE';

  return (
    <article
      className={`surface-card rounded-2xl p-4 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-e2 ${
        done ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <PriorityBadge priority={feature.priority} size="xs" />
            {done && (
              <span className="font-mono text-[0.625rem] font-black uppercase tracking-wider text-emerald-600">
                Shipped
              </span>
            )}
          </div>
          <h4
            className={`text-[0.8125rem] font-bold leading-snug ${
              done ? 'text-ink-400 line-through' : 'text-ink-900'
            }`}
          >
            {feature.title}
          </h4>
        </div>

        <Menu
          label={`Actions for ${feature.title}`}
          items={[
            {
              label: 'Delete task',
              icon: <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />,
              onSelect: () => onDelete(feature.id),
              tone: 'danger',
            },
          ]}
        />
      </div>

      {feature.description && (
        <p className="mt-2 line-clamp-2 text-[0.6875rem] leading-relaxed text-ink-500">
          {feature.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-200/80 pt-2.5">
        {done ? (
          <span className="font-mono text-[0.625rem] font-black uppercase tracking-wider text-emerald-600">
            Merged
          </span>
        ) : (
          <span className="font-mono text-[0.625rem] text-ink-400">Backlog</span>
        )}

        <button
          type="button"
          onClick={() => onToggleStatus(feature)}
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-bold text-brand-blue-600 transition-colors hover:text-brand-blue-700"
        >
          {done ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reopen
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Mark done
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default FeatureCard;
