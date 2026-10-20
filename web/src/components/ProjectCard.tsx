'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProjectSummary } from '@/types';
import {
  ExternalLink,
  ArrowRight,
  SlidersHorizontal,
  Star,
  EyeOff,
  RotateCcw,
  Globe,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Radio,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Menu } from '@/components/ui/Menu';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface ProjectCardProps {
  project: ProjectSummary;
  onTriageClick?: (project: ProjectSummary) => void;
  onStarToggle?: (project: ProjectSummary) => void;
  onHideToggle?: (project: ProjectSummary) => void;
  onUpdateLiveUrl?: (project: ProjectSummary, url: string) => Promise<void>;
  onMoveUp?: (project: ProjectSummary) => void;
  onMoveDown?: (project: ProjectSummary) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  python: 'bg-blue-500',
  typescript: 'bg-sky-500',
  javascript: 'bg-amber-400',
  dart: 'bg-teal-500',
  go: 'bg-cyan-500',
  rust: 'bg-orange-500',
};

export function ProjectCard({
  project,
  onTriageClick,
  onStarToggle,
  onHideToggle,
  onUpdateLiveUrl,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: ProjectCardProps) {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(project.live_url || '');
  const [urlSaving, setUrlSaving] = useState(false);

  const languageKey = project.primary_language?.toLowerCase() ?? '';
  const languageColor = LANGUAGE_COLORS[languageKey] ?? 'bg-ink-400';

  const statusLabel =
    project.status === 'IN_PROGRESS'
      ? 'Active'
      : project.status === 'PAUSED'
        ? 'Paused'
        : project.status === 'COMPLETED'
          ? 'Complete'
          : project.status.replace('_', ' ');

  const statusTone =
    project.status === 'IN_PROGRESS'
      ? 'lime'
      : project.status === 'PAUSED'
        ? 'amber'
        : project.status === 'COMPLETED'
          ? 'emerald'
          : 'neutral';

  const handleSaveLiveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateLiveUrl) return;
    try {
      setUrlSaving(true);
      await onUpdateLiveUrl(project, urlInput.trim());
      setIsEditingUrl(false);
    } finally {
      setUrlSaving(false);
    }
  };

  return (
    <article
      className={`surface-card group relative flex h-full flex-col rounded-3xl transition-[transform,box-shadow,border-color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-e3 ${
        project.is_starred
          ? 'border-amber-300 ring-1 ring-amber-400/30'
          : project.is_hidden
            ? 'border-dashed border-ink-300 opacity-80'
            : ''
      }`}
    >
      {/* Pinned accent — a bar rather than a floating ribbon, which the
          card's own border radius used to clip. */}
      {project.is_starred && (
        <span
          className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge tone={statusTone} dot size="xs">
              {statusLabel}
            </Badge>
            <Badge tone="blue" size="xs">
              {project.project_type}
            </Badge>
            {project.is_starred && (
              <Badge tone="amber" size="xs">
                Pinned
              </Badge>
            )}
            {project.is_hidden && (
              <Badge tone="slate" size="xs">
                Hidden
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {onStarToggle && (
              <button
                type="button"
                onClick={() => onStarToggle(project)}
                aria-pressed={project.is_starred}
                aria-label={project.is_starred ? 'Unpin repository' : 'Pin repository to top'}
                title={project.is_starred ? 'Unpin' : 'Pin to top'}
                className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
                  project.is_starred
                    ? 'border-amber-300 bg-amber-400 text-black'
                    : 'border-ink-200 bg-white text-ink-400 hover:border-brand-blue-500/30 hover:bg-brand-blue-50 hover:text-brand-blue-600'
                }`}
              >
                <Star
                  className={`h-3.5 w-3.5 ${project.is_starred ? 'fill-black' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}

            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.name} on GitHub`}
                title="View on GitHub"
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-white text-ink-400 transition-colors hover:border-brand-blue-500/30 hover:bg-brand-blue-50 hover:text-brand-blue-600"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/projects/${project.id}`} className="block min-w-0">
          <h3 className="truncate text-[1.0625rem] font-extrabold tracking-tight text-ink-900 transition-colors group-hover:text-brand-blue-600">
            {project.name}
          </h3>
        </Link>

        {/* Description */}
        {project.description ? (
          <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-500">
            {project.description}
          </p>
        ) : (
          <p className="text-[0.8125rem] italic leading-relaxed text-ink-400">
            Repository ingested and synced.
          </p>
        )}

        {/* Language + task count */}
        <div className="flex items-center justify-between gap-2 font-mono text-[0.6875rem] text-ink-500">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className={`h-2 w-2 rounded-full ${languageColor}`} aria-hidden="true" />
            {project.primary_language ?? 'Codebase'}
          </span>
          <span className="num-tabular font-bold text-ink-700">
            {project.completed_features}/{project.total_features} tasks
          </span>
        </div>

        {/* Live deployment */}
        <div>
          {project.live_url ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1.5 font-mono text-[0.6875rem] font-bold text-emerald-700 transition-colors hover:text-emerald-900"
                title={project.live_url}
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="truncate">
                  {project.live_url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setUrlInput(project.live_url || '');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="shrink-0 cursor-pointer font-mono text-[0.625rem] font-bold text-emerald-700 underline-offset-2 hover:underline"
                title="Edit deployed URL"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-ink-400">
                <Radio className="h-3 w-3" aria-hidden="true" />
                No live deployment
              </span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="cursor-pointer font-mono text-[0.6875rem] font-bold text-brand-blue-600 transition-colors hover:text-brand-blue-700"
              >
                + Add Vercel link
              </button>
            </div>
          )}

          {isEditingUrl && (
            <form
              onSubmit={handleSaveLiveUrl}
              className="mt-2 flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 p-1.5"
            >
              <label htmlFor={`live-url-${project.id}`} className="sr-only">
                Deployment URL for {project.name}
              </label>
              <input
                id={`live-url-${project.id}`}
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.vercel.app"
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1 font-mono text-[0.75rem] text-ink-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue-500"
              />
              <button
                type="submit"
                disabled={urlSaving}
                aria-label="Save deployment URL"
                className="grid h-7 w-7 place-items-center rounded-lg bg-brand-blue-500 text-white transition-colors hover:bg-brand-blue-400 disabled:opacity-50"
              >
                {urlSaving ? (
                  <span className="text-[0.625rem]">…</span>
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                aria-label="Cancel editing deployment URL"
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {/* Target goal */}
        {project.goal && (
          <div className="rounded-xl border border-brand-blue-500/10 bg-brand-blue-50/70 px-3 py-2">
            <p className="line-clamp-2 text-[0.75rem] leading-relaxed text-ink-700">
              <span className="mr-1.5 font-mono text-[0.6875rem] font-bold text-brand-blue-600">
                Target
              </span>
              {project.goal}
            </p>
          </div>
        )}

        <div className="flex-1" />

        {/* Velocity */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[0.6875rem] font-semibold text-ink-500">
              Velocity
            </span>
            <span className="num-tabular font-mono text-[0.75rem] font-extrabold text-ink-900">
              {project.progress_percentage}%
            </span>
          </div>
          <ProgressBar
            value={project.progress_percentage}
            label={`${project.name} delivery velocity`}
            tone={project.progress_percentage === 100 ? 'lime' : 'brand'}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-ink-200/80 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {project.needs_review && onTriageClick ? (
            <button
              type="button"
              onClick={() => onTriageClick(project)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-brand-lime-400 px-3 py-1 font-mono text-[0.6875rem] font-bold text-black shadow-lime transition-colors hover:bg-brand-lime-300"
            >
              <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
              Triage
            </button>
          ) : (
            <Badge tone="emerald" size="xs">
              Optimized
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Menu
            label={`Actions for ${project.name}`}
            items={[
              ...(onMoveUp
                ? [
                    {
                      label: 'Move up',
                      icon: <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />,
                      onSelect: () => onMoveUp(project),
                      disabled: !canMoveUp,
                    },
                  ]
                : []),
              ...(onMoveDown
                ? [
                    {
                      label: 'Move down',
                      icon: <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />,
                      onSelect: () => onMoveDown(project),
                      disabled: !canMoveDown,
                    },
                  ]
                : []),
              {
                label: project.live_url ? 'Edit deployment URL' : 'Add deployment URL',
                icon: <Pencil className="h-3.5 w-3.5" aria-hidden="true" />,
                onSelect: () => {
                  setUrlInput(project.live_url || '');
                  setIsEditingUrl(true);
                },
              },
              ...(onHideToggle
                ? [
                    {
                      label: project.is_hidden ? 'Restore to dashboard' : 'Hide repository',
                      icon:
                        project.is_hidden ? (
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        ),
                      onSelect: () => onHideToggle(project),
                      tone: project.is_hidden ? ('default' as const) : ('danger' as const),
                    },
                  ]
                : []),
            ]}
          />

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-[0.75rem] font-extrabold text-brand-blue-600 transition-colors hover:text-brand-blue-700"
          >
            <span>Roadmap</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
