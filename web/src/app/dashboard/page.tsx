'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectSummary, FutureProject } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer, PageHeader } from '@/components/AppShell';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { IdeaCard } from '@/components/IdeaCard';
import { ConceptImportModal } from '@/components/ConceptImportModal';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import { StaticLoader } from '@/components/StaticLoader';
import {
  GitBranch,
  Activity,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Globe,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  ArrowDownUp,
  Lightbulb,
  MessageSquareText,
  Plus,
  X,
  Loader2,
  Code,
  Trash2,
  Check,
  LayoutDashboard,
  AlertCircle
} from 'lucide-react';

type DashboardTab = 'ALL' | 'STARRED' | 'PRODUCTION' | 'IDEAS' | 'RESUME' | 'COLLEGE' | 'HIDDEN';
type SortOption = 'DEFAULT' | 'PROGRESS' | 'RECENT' | 'NAME' | 'ORDER';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [ideas, setIdeas] = useState<FutureProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTriageProject, setActiveTriageProject] = useState<ProjectSummary | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Smart WhatsApp import modal state on Dashboard
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchProjects = async () => {
    if (!api.isAuthenticated()) return;
    try {
      setLoading(true);
      setBackendOffline(false);
      const [projRes, ideasRes]: [any, any] = await Promise.all([
        api.get('/projects'),
        api.get('/future-projects').catch(() => []),
      ]);
      setProjects(projRes || []);
      setIdeas(ideasRes || []);
    } catch (err: any) {
      console.warn('Unable to load projects from backend:', err?.message || err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeas = async () => {
    if (!api.isAuthenticated()) return;
    try {
      const res: any = await api.get('/future-projects');
      setIdeas(res || []);
    } catch (err) {
      console.warn('Unable to load ideas:', err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res: any = await api.post('/github/sync');
      const count = res?.new_repos_imported || 0;
      showToast(count > 0 ? `Imported ${count} new repositor${count === 1 ? 'y' : 'ies'}.` : 'Already up to date.');
      await fetchProjects();
    } catch (err: any) {
      showToast(err?.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, user]);

  // Statistics
  const nonHiddenProjects = projects.filter((p) => !p.is_hidden);
  const starredProjects = nonHiddenProjects.filter((p) => p.is_starred);
  const productionProjects = nonHiddenProjects.filter(
    (p) => p.live_url || p.project_type === 'PRODUCTION'
  );
  const hiddenProjects = projects.filter((p) => p.is_hidden);
  const needsReviewProjects = nonHiddenProjects.filter((p) => p.needs_review);
  const activeProjects = nonHiddenProjects.filter((p) => p.status === 'IN_PROGRESS');
  const unpromotedIdeas = ideas.filter((i) => i.status !== 'PROMOTED');

  const avgProgress = nonHiddenProjects.length
    ? Math.round(
        nonHiddenProjects.reduce((acc, p) => acc + p.progress_percentage, 0) /
          nonHiddenProjects.length
      )
    : 0;

  const totalFeatures = nonHiddenProjects.reduce((acc, p) => acc + p.total_features, 0);
  const completedFeatures = nonHiddenProjects.reduce((acc, p) => acc + p.completed_features, 0);

  // Handlers for Star, Hide, Live URL, and Reorder
  const handleToggleStar = async (project: ProjectSummary) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, is_starred: !p.is_starred } : p))
    );
    try {
      const updated = await api.toggleStarProject(project.id);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch (err) {
      console.error('Failed to toggle star:', err);
      fetchProjects();
    }
  };

  const handleToggleHide = async (project: ProjectSummary) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, is_hidden: !p.is_hidden } : p))
    );
    try {
      const updated = await api.toggleHideProject(project.id);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch (err) {
      console.error('Failed to toggle hide:', err);
      fetchProjects();
    }
  };

  const handleUpdateLiveUrl = async (project: ProjectSummary, url: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, live_url: url } : p))
    );
    try {
      const updated = await api.updateProjectLiveUrl(project.id, url);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch (err) {
      console.error('Failed to update live url:', err);
      fetchProjects();
    }
  };

  const handleMoveUp = async (project: ProjectSummary) => {
    const index = filteredProjects.findIndex((p) => p.id === project.id);
    if (index <= 0) return;

    const newOrder = [...filteredProjects];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    const batchItems = newOrder.map((p, i) => ({ id: p.id, order_index: i }));

    // Optimistic update
    setProjects((prev) => {
      const map = new Map(batchItems.map((b) => [b.id, b.order_index]));
      return prev.map((p) => (map.has(p.id) ? { ...p, order_index: map.get(p.id)! } : p));
    });

    try {
      await api.reorderProjects(batchItems);
    } catch (err) {
      console.error('Failed to reorder projects:', err);
      fetchProjects();
    }
  };

  const handleMoveDown = async (project: ProjectSummary) => {
    const index = filteredProjects.findIndex((p) => p.id === project.id);
    if (index < 0 || index >= filteredProjects.length - 1) return;

    const newOrder = [...filteredProjects];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    const batchItems = newOrder.map((p, i) => ({ id: p.id, order_index: i }));

    // Optimistic update
    setProjects((prev) => {
      const map = new Map(batchItems.map((b) => [b.id, b.order_index]));
      return prev.map((p) => (map.has(p.id) ? { ...p, order_index: map.get(p.id)! } : p));
    });

    try {
      await api.reorderProjects(batchItems);
    } catch (err) {
      console.error('Failed to reorder projects:', err);
      fetchProjects();
    }
  };

  // Promote Idea into Active Project
  const handlePromoteIdea = async (id: string, ideaTitle: string) => {
    try {
      await api.post(`/future-projects/${id}/promote`);
      showToast(`🚀 "${ideaTitle}" promoted to Active Projects!`);
      fetchProjects();
    } catch (err) {
      console.warn('Unable to promote idea:', err);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await api.delete(`/future-projects/${id}`);
      fetchIdeas();
    } catch (err) {
      console.warn('Unable to delete idea:', err);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Filter logic for projects
  let baseList = projects;
  if (activeTab === 'HIDDEN') {
    baseList = hiddenProjects;
  } else if (activeTab === 'STARRED') {
    baseList = starredProjects;
  } else if (activeTab === 'PRODUCTION') {
    baseList = productionProjects;
  } else if (activeTab === 'RESUME') {
    baseList = nonHiddenProjects.filter((p) => p.project_type === 'RESUME');
  } else if (activeTab === 'COLLEGE') {
    baseList = nonHiddenProjects.filter((p) => p.project_type === 'COLLEGE');
  } else {
    baseList = nonHiddenProjects;
  }

  // Search filtering
  let searched = baseList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.primary_language && p.primary_language.toLowerCase().includes(query)) ||
      (p.live_url && p.live_url.toLowerCase().includes(query))
    );
  });

  // Sorting for active projects
  const filteredProjects = [...searched].sort((a, b) => {
    if (sortBy === 'PROGRESS') {
      return b.progress_percentage - a.progress_percentage;
    }
    if (sortBy === 'RECENT') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortBy === 'NAME') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'ORDER') {
      return (a.order_index || 0) - (b.order_index || 0);
    }
    // DEFAULT: Starred always on top, then order_index, then updated_at
    if (a.is_starred !== b.is_starred) {
      return a.is_starred ? -1 : 1;
    }
    if ((a.order_index || 0) !== (b.order_index || 0)) {
      return (a.order_index || 0) - (b.order_index || 0);
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Filter ideas if activeTab === 'IDEAS'
  const filteredIdeas = unpromotedIdeas.filter((idea) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      idea.title.toLowerCase().includes(q) ||
      (idea.elevator_pitch && idea.elevator_pitch.toLowerCase().includes(q)) ||
      (idea.target_tech_stack && idea.target_tech_stack.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    const prioScore = { P0: 0, P1: 1, P2: 2 };
    return prioScore[a.priority] - prioScore[b.priority];
  });

  return (
    <AppShell>
      {/* Floating Island Navigation Header */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed right-4 top-20 z-[60] sm:right-6">
          <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      {/* Main Content */}
      <PageContainer className="space-y-6">
        {backendOffline && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50/95 px-4 py-3 font-mono text-[0.75rem] text-amber-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              The workspace API is unreachable, so these numbers may be out of date. Your
              repositories are still safe — reconnect to resync.
            </span>
          </div>
        )}

        {/* Header */}
        <PageHeader
          eyebrow={
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-lime-300">
              Workspace telemetry
            </span>
          }
          title={
            <span className="flex flex-wrap items-center gap-3">
              Command Center
              {starredProjects.length > 0 && (
                <Badge tone="amber" size="sm">
                  {starredProjects.length} pinned
                </Badge>
              )}
            </span>
          }
          description={`${nonHiddenProjects.length} active ${nonHiddenProjects.length === 1 ? 'repository' : 'repositories'}${hiddenProjects.length > 0 ? `, ${hiddenProjects.length} hidden` : ''}. Everything here is scoped to your own tenant.`}
          actions={
            <>
              <span className="font-mono text-[0.6875rem] text-white/70">
                Average velocity{' '}
                <strong className="font-black text-brand-lime-300">{avgProgress}%</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('IDEAS')}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                iconLeft={<Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Backlog {unpromotedIdeas.length}
              </Button>
            </>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
          {/* Production deployments — deep panel so it separates from the canvas */}
          <div className="gridster-panel-deep relative flex flex-col justify-between overflow-hidden p-6 lg:col-span-4">
            <div
              className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-brand-lime-400/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-black uppercase tracking-[0.1em] text-brand-lime-300">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  Production
                </span>
                <Badge tone="lime" size="xs">
                  Live
                </Badge>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="num-tabular text-5xl font-black tracking-tight text-white">
                  {productionProjects.length}
                </span>
                <span className="font-mono text-[0.6875rem] text-white/70">
                  live {productionProjects.length === 1 ? 'app' : 'apps'}
                </span>
              </div>

              <p className="mt-3 text-[0.8125rem] leading-relaxed text-white/80">
                {productionProjects.length > 0
                  ? 'Repositories with a verified public URL, launchable straight from the card.'
                  : 'Add a Vercel, Render or custom deployment link to any repository to track it here.'}
              </p>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-white/20 pt-4 font-mono text-[0.6875rem]">
              <button
                type="button"
                onClick={() => setActiveTab('PRODUCTION')}
                className="flex cursor-pointer items-center gap-1 font-bold text-brand-lime-300 hover:underline"
              >
                <span>View production apps</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="text-white/60">{avgProgress}% avg</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="surface-card flex flex-col justify-between p-6 lg:col-span-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-black uppercase tracking-[0.1em] text-ink-800">
                <Activity className="h-3.5 w-3.5 text-brand-blue-600" aria-hidden="true" />
                Sprint velocity
              </span>
              <Badge tone="emerald" size="xs">
                {completedFeatures}/{totalFeatures} shipped
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3">
              <div className="flex flex-col items-center text-center">
                <ProgressRing
                  value={avgProgress}
                  size={96}
                  label={`Average delivery velocity ${avgProgress} percent`}
                >
                  <span className="num-tabular font-mono text-xl font-black leading-none text-ink-900">
                    {avgProgress}%
                  </span>
                </ProgressRing>
                <span className="mt-2 font-mono text-[0.6875rem] font-bold text-ink-900">
                  Weighted progress
                </span>
                <span className="font-mono text-[0.625rem] text-ink-500">4× / 3× / 2× / 1×</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <ProgressRing
                  value={activeProjects.length ? 100 : 0}
                  size={96}
                  progressClassName="text-brand-lime-500"
                  label={`${activeProjects.length} active repositories`}
                >
                  <span className="num-tabular font-mono text-xl font-black leading-none text-ink-900">
                    {activeProjects.length}
                  </span>
                </ProgressRing>
                <span className="mt-2 font-mono text-[0.6875rem] font-bold text-ink-900">
                  Repos in progress
                </span>
                <span className="font-mono text-[0.625rem] text-ink-500">of {nonHiddenProjects.length} tracked</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-ink-200/80 pt-3 font-mono text-[0.6875rem] font-bold text-ink-500">
              <span>
                Completed {completedFeatures} of {totalFeatures} features
              </span>
              <span className="text-brand-blue-600">{activeProjects.length} active</span>
            </div>
          </div>

          {/* AI cascade */}
          <div className="surface-card flex flex-col justify-between p-6 lg:col-span-3">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-black uppercase tracking-[0.1em] text-ink-800">
                  <Cpu className="h-3.5 w-3.5 text-brand-violet-600" aria-hidden="true" />
                  AI council
                </span>
                <Badge tone="blue" size="xs">
                  Online
                </Badge>
              </div>

              <ul className="space-y-2">
                {[
                  { name: 'Gemini 2.5 Flash', role: 'Fast primary', dot: 'bg-brand-blue-500' },
                  { name: 'Llama 3.2 11B', role: 'NVIDIA NIM', dot: 'bg-brand-violet-500' },
                  { name: 'Concept extractor', role: 'WhatsApp ingest', dot: 'bg-emerald-500' },
                ].map((agent) => (
                  <li
                    key={agent.name}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink-200/80 bg-ink-50 px-2.5 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate font-mono text-[0.625rem] font-bold text-ink-700">
                        {agent.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.5625rem] text-ink-400">
                      {agent.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              {needsReviewProjects.length > 0 ? (
                <Button
                  size="sm"
                  fullWidth
                  onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                  iconLeft={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />}
                >
                  Triage {needsReviewProjects.length} repos
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-200/80 bg-ink-50 p-2.5 font-mono text-[0.625rem] font-bold text-ink-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-600" aria-hidden="true" />
                  <span>All repositories synchronized</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills, Search Bar, and Manual Sorting Selector */}
        <div className="flex flex-col items-start justify-between gap-4 pt-2 lg:flex-row lg:items-center">
          {/* Segmented Filter Tabs */}
          <SegmentedControl
            ariaLabel="Filter repositories"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              {
                id: 'ALL' as DashboardTab,
                label: 'All Repos',
                count: nonHiddenProjects.length,
                icon: <LayoutDashboard className="h-3 w-3" aria-hidden="true" />,
              },
              {
                id: 'STARRED' as DashboardTab,
                label: 'Starred',
                count: starredProjects.length,
                icon: <Star className="h-3 w-3" aria-hidden="true" />,
              },
              {
                id: 'PRODUCTION' as DashboardTab,
                label: 'Production',
                count: productionProjects.length,
                icon: <Globe className="h-3 w-3" aria-hidden="true" />,
              },
              {
                id: 'IDEAS' as DashboardTab,
                label: 'Ideas',
                count: unpromotedIdeas.length,
                icon: <Lightbulb className="h-3 w-3" aria-hidden="true" />,
              },
              {
                id: 'RESUME' as DashboardTab,
                label: 'Resume',
                count: nonHiddenProjects.filter((p) => p.project_type === 'RESUME').length,
              },
              {
                id: 'COLLEGE' as DashboardTab,
                label: 'College',
                count: nonHiddenProjects.filter((p) => p.project_type === 'COLLEGE').length,
              },
              {
                id: 'HIDDEN' as DashboardTab,
                label: 'Hidden',
                count: hiddenProjects.length,
                icon: <EyeOff className="h-3 w-3" aria-hidden="true" />,
              },
            ]}
          />

          {/* Sort Selector & Repo Count */}
          <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
            {activeTab !== 'IDEAS' && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/25 px-3 py-1.5 font-mono text-xs backdrop-blur-md">
                <ArrowDownUp className="h-3.5 w-3.5 text-[#C6FF20]" aria-hidden="true" />
                <label htmlFor="dashboard-sort" className="text-[0.6875rem] text-white/60">
                  Sort:
                </label>
                <select
                  id="dashboard-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="cursor-pointer bg-transparent text-xs font-bold text-white outline-none [&>option]:bg-ink-900 [&>option]:text-white"
                >
                  <option value="DEFAULT">Starred First</option>
                  <option value="ORDER">Custom Priority Order</option>
                  <option value="PROGRESS">Velocity Progress %</option>
                  <option value="RECENT">Recently Updated</option>
                  <option value="NAME">Alphabetical (A-Z)</option>
                </select>
              </div>
            )}

            <div className="text-xs font-mono text-white/80 font-bold whitespace-nowrap">
              {activeTab === 'IDEAS' ? (
                <>Showing <span className="text-[#C6FF20] font-black">{filteredIdeas.length}</span> future ideas</>
              ) : (
                <>Showing <span className="text-[#C6FF20] font-black">{filteredProjects.length}</span> repos</>
              )}
            </div>
          </div>
        </div>

        {/* Notice banner for Hidden tab */}
        {activeTab === 'HIDDEN' && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span>
                These repositories are soft-hidden from your active views. They remain intact on GitHub and can be restored anytime.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('ALL')}
              className="text-[#C6FF20] hover:underline font-bold whitespace-nowrap cursor-pointer"
            >
              Back to Active Repos &rarr;
            </button>
          </div>
        )}

        {/* View Mode: IDEAS Backlog */}
        {activeTab === 'IDEAS' ? (
          <div className="space-y-6">
            {/* Quick Action Bar for Ideas Tab */}
            <div className="p-4 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#C6FF20]" />
                  <span>Future Project Ideas Backlog (No Repository Yet)</span>
                </h3>
                <p className="text-xs text-white/70 font-mono mt-0.5">
                  Unbuilt software concepts with priority rankings (P0 Next Immediate, P1 Upcoming, P2 Backlog).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn-lime !py-1.5 !px-3.5 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-black" />
                  <span>Import from WhatsApp</span>
                </button>
                <Link
                  href="/ideas"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Full Radar Board</span>
                  <ArrowRight className="w-3 h-3 text-[#C6FF20]" />
                </Link>
              </div>
            </div>

            {/* Ideas Grid */}
            {filteredIdeas.length === 0 ? (
              <EmptyState
                icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />}
                title="No future ideas queued"
                description="Have an idea on WhatsApp or in voice notes? Import it and DevCommand will extract, prioritise and structure it before you build."
                action={
                  <Button
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                    iconLeft={<MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Import a concept
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onPromote={handlePromoteIdea}
                    onDelete={handleDeleteIdea}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* View Mode: Active Repositories */
          <>
            {loading ? (
              <StaticLoader
                fullScreen={false}
                label="Hydrating Repository Telemetry"
                sublabel="Syncing AST, MongoDB Atlas records, and incubator backlog..."
              />
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<GitBranch className="h-5 w-5" aria-hidden="true" />}
                title={
                  activeTab === 'HIDDEN'
                    ? 'No hidden repositories'
                    : activeTab === 'STARRED'
                      ? 'Nothing pinned yet'
                      : activeTab === 'PRODUCTION'
                        ? 'No production deployments yet'
                        : 'No repositories found'
                }
                description={
                  searchQuery
                    ? 'No results matched your search term. Try a different filter or clear the search.'
                    : activeTab === 'STARRED'
                      ? 'Pin a repository with the star icon and it will show up here.'
                      : activeTab === 'PRODUCTION'
                        ? 'Add a live Vercel or deployment URL to any repository to track it here.'
                        : activeTab === 'HIDDEN'
                          ? 'You have not hidden any repositories yet.'
                          : 'Hit Sync in the top bar to pull your repositories from GitHub.'
                }
                action={
                  searchQuery ? null : activeTab === 'ALL' ? (
                    <Button size="sm" onClick={handleSync} loading={isSyncing}>
                      Sync from GitHub
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((p, idx) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onTriageClick={(proj) => setActiveTriageProject(proj)}
                    onStarToggle={handleToggleStar}
                    onHideToggle={handleToggleHide}
                    onUpdateLiveUrl={handleUpdateLiveUrl}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < filteredProjects.length - 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageContainer>

      {/* Triage Modal */}
      {activeTriageProject && (
        <TriageModal
          project={activeTriageProject}
          isOpen={!!activeTriageProject}
          onClose={() => setActiveTriageProject(null)}
          onConfirmed={fetchProjects}
        />
      )}

      {/* Smart Concept / WhatsApp Text Import Modal */}
      <ConceptImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSaved={fetchIdeas}
        onNotify={showToast}
      />
    </AppShell>
  );
}
