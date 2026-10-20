'use client';

import { FutureProject } from '@/types';
import { ArrowRight, Code, MessageSquareText, Trash2 } from 'lucide-react';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { Menu } from '@/components/ui/Menu';

interface IdeaCardProps {
  idea: FutureProject;
  onPromote: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

/**
 * A single concept in the incubator backlog. Previously duplicated almost
 * verbatim between the dashboard Ideas tab and the dedicated Ideas page,
 * with the two copies disagreeing about what P0 looked like.
 */
export function IdeaCard({ idea, onPromote, onDelete }: IdeaCardProps) {
  const priority = (idea.priority ?? 'P2') as 'P0' | 'P1' | 'P2' | 'P3';

  return (
    <article className="surface-card flex flex-col justify-between gap-3.5 rounded-3xl p-5 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-e3">
      <div className="min-w-0">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge tone="blue" size="xs">
              {idea.project_type}
            </Badge>
            <Badge tone="lime" size="xs">
              No repo yet
            </Badge>
          </div>

          <Menu
            label={`Actions for ${idea.title}`}
            items={[
              {
                label: 'Delete concept',
                icon: <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />,
                onSelect: () => onDelete(idea.id),
                tone: 'danger',
              },
            ]}
          />
        </div>

        <h3 className="text-[0.9375rem] font-extrabold leading-snug tracking-tight text-ink-900">
          {idea.title}
        </h3>

        {idea.elevator_pitch && (
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500">
            {idea.elevator_pitch}
          </p>
        )}

        {idea.notes && (
          <div className="mt-2.5 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-xl border border-brand-blue-500/10 bg-brand-blue-50/70 p-2.5 font-mono text-[0.6875rem] leading-relaxed text-ink-700">
            <span className="mb-0.5 block font-bold text-ink-900">Notes / MVP scope</span>
            {idea.notes}
          </div>
        )}

        {idea.raw_message && (
          <details className="group mt-2 text-[0.75rem]">
            <summary className="flex cursor-pointer select-none items-center gap-1 font-mono text-[0.625rem] font-bold text-ink-500 transition-colors hover:text-ink-800">
              <MessageSquareText className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              <span>View original message</span>
            </summary>
            <div className="mt-1.5 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-2.5 font-mono text-[0.6875rem] leading-relaxed text-ink-800">
              {idea.raw_message}
            </div>
          </details>
        )}

        {idea.target_tech_stack && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-2 font-mono text-[0.6875rem] text-ink-700">
            <Code className="h-3.5 w-3.5 shrink-0 text-brand-blue-500" aria-hidden="true" />
            <span className="truncate font-bold">{idea.target_tech_stack}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-200/80 pt-3">
        <PriorityBadge priority={priority} size="xs" />

        <button
          type="button"
          onClick={() => onPromote(idea.id, idea.title)}
          className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-brand-lime-400 px-3 py-1 font-mono text-[0.6875rem] font-bold text-black shadow-lime transition-colors hover:bg-brand-lime-300"
          title="Convert to an active repository in Command Center"
        >
          <span>Start building</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default IdeaCard;
