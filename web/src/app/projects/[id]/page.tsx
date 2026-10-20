'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectDetail, Feature, FeaturePriority, FeatureStatus, SuggestedFeature } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer } from '@/components/AppShell';
import { StaticLoader } from '@/components/StaticLoader';
import { FeatureCard } from '@/components/FeatureCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Check,
  Cpu,
  X,
  Star,
  Globe,
  EyeOff,
  RotateCcw,
  Loader2,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  {
    id: 'BACKLOG' as const,
    title: 'Backlog',
    hint: 'Not started',
    dot: 'bg-brand-blue-500',
  },
  {
    id: 'IN_PROGRESS' as const,
    title: 'In progress',
    hint: 'Actively building',
    dot: 'bg-brand-lime-400',
  },
  {
    id: 'DONE' as const,
    title: 'Shipped',
    hint: 'Merged and live',
    dot: 'bg-brand-violet-500',
  },
];

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New feature input state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<FeaturePriority>('P1');
  const [isAdding, setIsAdding] = useState(false);

  // AI Feature suggestions modal state
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedFeature[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Live URL and Project controls state
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [liveUrlInput, setLiveUrlInput] = useState('');
  const [liveUrlSaving, setLiveUrlSaving] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?next=/projects/${projectId}`);
    }
  }, [authLoading, isAuthenticated, projectId, router]);

  const fetchProject = async () => {
    if (!api.isAuthenticated()) return;
    try {
      setLoading(true);
      const res: any = await api.get(`/projects/${projectId}`);
      setProject(res);
      setLiveUrlInput(res.live_url || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!project) return;
    try {
      const updated = await api.toggleStarProject(project.id);
      setProject((prev) => (prev ? { ...prev, is_starred: updated.is_starred } : prev));
    } catch (err: any) {
      console.warn('Unable to toggle star:', err);
    }
  };

  const handleToggleHide = async () => {
    if (!project) return;
    try {
      const updated = await api.toggleHideProject(project.id);
      setProject((prev) => (prev ? { ...prev, is_hidden: updated.is_hidden } : prev));
    } catch (err: any) {
      console.warn('Unable to toggle hide:', err);
    }
  };

  const handleSaveLiveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setLiveUrlSaving(true);
      const updated = await api.updateProjectLiveUrl(project.id, liveUrlInput.trim());
      setProject((prev) => (prev ? { ...prev, live_url: updated.live_url } : prev));
      setIsEditingUrl(false);
    } catch (err: any) {
      console.warn('Unable to update live URL:', err);
    } finally {
      setLiveUrlSaving(false);
    }
  };

  useEffect(() => {
    if (projectId && isAuthenticated) fetchProject();
  }, [projectId, isAuthenticated, user]);

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await api.post(`/projects/${projectId}/features`, {
        title: newTitle.trim(),
        priority: newPriority,
        status: 'BACKLOG',
      });
      setNewTitle('');
      fetchProject();
    } catch (err: any) {
      console.warn('Unable to add feature:', err?.message || err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (feature: Feature) => {
    const nextStatus: FeatureStatus = feature.status === 'DONE' ? 'BACKLOG' : 'DONE';
    try {
      await api.patch(`/features/${feature.id}`, { status: nextStatus });
      fetchProject();
    } catch (err: any) {
      console.warn('Unable to toggle feature status:', err?.message || err);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      await api.delete(`/features/${featureId}`);
      fetchProject();
    } catch (err: any) {
      console.warn('Unable to delete feature:', err?.message || err);
    }
  };

  const handleFetchAiSuggestions = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res: any = await api.post(`/ai/suggest-features/${projectId}`);
      setAiSuggestions(res.features || []);
      setAiProvider(res.provider_used || 'ai');
    } catch (err: any) {
      console.warn('Unable to fetch AI suggestions:', err?.message || err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiFeature = async (s: SuggestedFeature) => {
    try {
      await api.post(`/projects/${projectId}/features`, {
        title: s.title,
        priority: s.priority,
        description: s.description,
        status: 'BACKLOG',
      });
      setAiSuggestions((prev) => prev.filter((item) => item.title !== s.title));
      fetchProject();
    } catch (err: any) {
      console.warn('Unable to add AI feature:', err?.message || err);
    }
  };

  if (loading) {
    return (
      <StaticLoader
        label="Decompiling Repository Blueprint"
        sublabel="Hydrating features, status physics, and milestone matrix..."
        fullScreen={true}
      />
    );
  }

  if (error || !project) {
    return (
      <div className="surface-canvas flex min-h-screen items-center justify-center p-8">
        <EmptyState
          icon={<X className="h-5 w-5" aria-hidden="true" />}
          title="This project could not be loaded"
          description={error || 'It may have been deleted, or the workspace API is unreachable.'}
          action={
            <Button size="sm" onClick={() => router.push('/dashboard')}>
              Back to command center
            </Button>
          }
        />
      </div>
    );
  }

  const features = project.features ?? [];
  const openFeatures = features.filter((f) => f.status !== 'DONE');
  const doneFeatures = features.filter((f) => f.status === 'DONE');
  const p0Open = openFeatures.filter((f) => f.priority === 'P0').length;

  const columnFeatures = (id: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') =>
    features.filter((f) =>
      id === 'BACKLOG' ? f.status === 'BACKLOG' || !f.status : f.status === id,
    );

  return (
    <AppShell>
      <Navbar />

      <PageContainer className="space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Command center
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStar}
              aria-pressed={project.is_starred}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold backdrop-blur-md transition-colors ${
                project.is_starred
                  ? 'border-amber-300 bg-amber-400 font-black text-black'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${project.is_starred ? 'fill-black' : ''}`}
                aria-hidden="true"
              />
              <span>{project.is_starred ? 'Pinned' : 'Pin'}</span>
            </button>

            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold text-emerald-200 backdrop-blur-md transition-colors hover:bg-emerald-500/30"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Launch app</span>
                <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
              </a>
            )}

            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>GitHub</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleToggleHide}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[0.6875rem] font-bold backdrop-blur-md transition-colors ${
                project.is_hidden
                  ? 'border-blue-400 bg-blue-600/30 text-blue-200'
                  : 'border-white/20 bg-white/10 text-white/70 hover:bg-rose-500/20 hover:text-rose-300'
              }`}
            >
              {project.is_hidden ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hide</span>
                </>
              )}
            </button>

            <Button
              size="sm"
              onClick={handleFetchAiSuggestions}
              iconLeft={<Cpu className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              AI strategist
            </Button>
          </div>
        </div>

        {/* Project header */}
        <section className="surface-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full bg-brand-blue-500 pulse-blue"
                  aria-hidden="true"
                />
                <span className="eyebrow text-brand-blue-600">
                  AI code intelligence &amp; review matrix
                </span>
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

              <h1 className="flex flex-wrap items-center gap-3 text-h1 font-extrabold tracking-tight text-ink-950">
                <span className="break-words">{project.name}</span>
                <Badge tone="blue" size="sm">
                  {project.project_type}
                </Badge>
              </h1>

              {/* Live URL */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {project.live_url ? (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[0.6875rem] font-bold text-emerald-800">
                    <Globe className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      <span className="max-w-[16rem] truncate">{project.live_url}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsEditingUrl(!isEditingUrl)}
                      className="ml-1 cursor-pointer text-[0.625rem] text-emerald-700 underline-offset-2 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(!isEditingUrl)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue-200 bg-brand-blue-50 px-3 py-1 font-mono text-[0.6875rem] font-bold text-brand-blue-700 transition-colors hover:bg-brand-blue-100"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>+ Add deployment URL</span>
                  </button>
                )}

                {isEditingUrl && (
                  <form
                    onSubmit={handleSaveLiveUrl}
                    className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 p-1"
                  >
                    <label htmlFor="project-live-url" className="sr-only">
                      Deployment URL for {project.name}
                    </label>
                    <input
                      id="project-live-url"
                      type="url"
                      value={liveUrlInput}
                      onChange={(e) => setLiveUrlInput(e.target.value)}
                      placeholder="https://my-app.vercel.app"
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1 font-mono text-[0.75rem] text-ink-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={liveUrlSaving}
                      aria-label="Save deployment URL"
                      className="grid h-7 w-7 place-items-center rounded-lg bg-brand-blue-500 text-white transition-colors hover:bg-brand-blue-400 disabled:opacity-50"
                    >
                      {liveUrlSaving ? (
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

              {project.goal && (
                <p className="mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-600">
                  <span className="mr-1.5 font-mono text-[0.6875rem] font-bold text-brand-blue-600">
                    Target
                  </span>
                  {project.goal}
                </p>
              )}
            </div>

            {/* Real metrics */}
            <dl className="grid shrink-0 grid-cols-3 gap-4 border-t border-ink-200/80 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <div>
                <dt className="eyebrow text-ink-400">Open tasks</dt>
                <dd className="num-tabular mt-0.5 text-2xl font-black text-ink-950">
                  {openFeatures.length}
                </dd>
                <dd className="mt-0.5 font-mono text-[0.625rem] text-ink-500">
                  {p0Open} critical
                </dd>
              </div>

              <div>
                <dt className="eyebrow text-ink-400">Shipped</dt>
                <dd className="num-tabular mt-0.5 text-2xl font-black text-brand-blue-600">
                  {doneFeatures.length}
                </dd>
                <dd className="mt-0.5 font-mono text-[0.625rem] text-ink-500">
                  of {features.length} total
                </dd>
              </div>

              <div>
                <dt className="eyebrow text-ink-400">Velocity</dt>
                <dd className="num-tabular mt-0.5 text-2xl font-black text-brand-violet-600">
                  {project.progress_percentage}%
                </dd>
                <dd className="mt-0.5 font-mono text-[0.625rem] text-ink-500">weighted</dd>
              </div>
            </dl>
          </div>

          {/* Velocity bar */}
          <div className="mt-6 border-t border-ink-200/80 pt-4">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[0.6875rem]">
              <span className="font-bold text-ink-500">
                Delivery velocity ({project.completed_features}/{project.total_features} features
                completed)
              </span>
              <span className="num-tabular font-extrabold text-ink-900">
                {project.progress_percentage}%
              </span>
            </div>
            <ProgressBar
              value={project.progress_percentage}
              tone="violet"
              label={`Delivery velocity for ${project.name}`}
            />
          </div>
        </section>

        {/* Quick add */}
        <section className="surface-card rounded-2xl p-4">
          <form onSubmit={handleAddFeature}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="new-feature-title" className="sr-only">
                New task title
              </label>
              <input
                id="new-feature-title"
                type="text"
                placeholder="Register a deliverable (e.g. Implement webhook dispatcher)…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="min-w-0 flex-1 rounded-full border border-brand-blue-500/15 bg-brand-blue-50/60 px-4 py-2.5 text-[0.8125rem] text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              />
              <label htmlFor="new-feature-priority" className="sr-only">
                Task priority
              </label>
              <select
                id="new-feature-priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="cursor-pointer rounded-full border border-brand-blue-500/15 bg-brand-blue-50/60 px-4 py-2.5 font-mono text-[0.75rem] font-bold text-ink-800 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              >
                <option value="P0">P0 — critical (4×)</option>
                <option value="P1">P1 — high (3×)</option>
                <option value="P2">P2 — medium (2×)</option>
                <option value="P3">P3 — low (1×)</option>
              </select>
              <Button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                loading={isAdding}
                iconLeft={<Plus className="h-4 w-4" aria-hidden="true" />}
                className="shrink-0"
              >
                Add task
              </Button>
            </div>
          </form>
        </section>

        {/* Kanban */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {KANBAN_COLUMNS.map((column) => {
            const columnItems = columnFeatures(column.id);
            return (
              <section key={column.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/12 bg-ink-950/25 px-3.5 py-2.5 backdrop-blur-md">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${column.dot}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[0.6875rem] font-black uppercase tracking-wider text-white">
                        {column.title}
                      </div>
                      <div className="font-mono text-[0.625rem] text-white/50">
                        {column.hint}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[0.625rem] font-black text-white">
                    {columnItems.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-8 text-center font-mono text-[0.6875rem] text-white/50 backdrop-blur-md">
                      {column.id === 'BACKLOG'
                        ? 'Nothing queued yet.'
                        : column.id === 'IN_PROGRESS'
                          ? 'No task in progress. Pull one from the backlog.'
                          : 'Shipped tasks will land here.'}
                    </div>
                  ) : (
                    columnItems.map((f) => (
                      <FeatureCard
                        key={f.id}
                        feature={f}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteFeature}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </PageContainer>

      {/* AI suggestions */}
      <Modal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI roadmap strategist"
        description="Suggested features derived from this project's goal and codebase trajectory."
        icon={<Cpu className="h-4 w-4" aria-hidden="true" />}
        size="lg"
      >
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <Loader2 className="mb-1 h-7 w-7 animate-spin text-brand-blue-500" aria-hidden="true" />
            <p className="font-mono text-[0.75rem] text-ink-600">
              Synthesizing project goals and codebase trajectory…
            </p>
          </div>
        ) : aiSuggestions.length === 0 ? (
          <EmptyState
            icon={<Cpu className="h-5 w-5" aria-hidden="true" />}
            title="No suggestions returned"
            description="The AI engine could not find a strong candidate for this repository right now."
          />
        ) : (
          <div className="space-y-3">
            {aiProvider && (
              <p className="font-mono text-[0.6875rem] font-bold text-ink-500">
                Inference cascade:{' '}
                <span className="uppercase text-brand-blue-600">{aiProvider}</span>
              </p>
            )}
            <ul className="space-y-3">
              {aiSuggestions.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3.5 transition-colors hover:border-brand-blue-500/30"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={f.priority} size="xs" />
                      <span className="text-[0.8125rem] font-extrabold text-ink-900">
                        {f.title}
                      </span>
                    </div>
                    <p className="text-[0.75rem] leading-relaxed text-ink-600">{f.description}</p>
                    {f.rationale && (
                      <p className="font-mono text-[0.6875rem] italic text-brand-violet-600">
                        {f.rationale}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddAiFeature(f)}
                    iconLeft={<Plus className="h-3 w-3" aria-hidden="true" />}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <StaticLoader
          label="Hydrating Project Matrix"
          sublabel="Connecting to isolated workspace telemetry..."
          fullScreen={true}
        />
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
