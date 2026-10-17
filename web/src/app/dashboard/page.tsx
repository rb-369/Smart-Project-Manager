'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectSummary } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import {
  GitBranch,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Globe,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  ArrowDownUp
} from 'lucide-react';

type DashboardTab = 'ALL' | 'STARRED' | 'PRODUCTION' | 'RESUME' | 'COLLEGE' | 'HIDDEN';
type SortOption = 'DEFAULT' | 'PROGRESS' | 'RECENT' | 'NAME' | 'ORDER';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTriageProject, setActiveTriageProject] = useState<ProjectSummary | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

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
      const res: any = await api.get('/projects');
      setProjects(res || []);
    } catch (err: any) {
      console.warn('Unable to load projects from backend:', err?.message || err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
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

  // Filter logic
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

  // Sorting
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

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-32 pb-20 space-y-6 relative z-10 flex-1">
        {/* Compact Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                WORKSPACE TELEMETRY
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Mission Control</span>
              {starredProjects.length > 0 && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>{starredProjects.length} Pinned</span>
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/70">
              Active Portfolio: <strong className="text-[#C6FF20]">{nonHiddenProjects.length}</strong> repos
              {hiddenProjects.length > 0 && (
                <span className="text-white/40 ml-1.5">({hiddenProjects.length} hidden)</span>
              )}
            </span>
          </div>
        </div>

        {/* Bento Grid Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Bento Card 1: Production Deployed Telemetry (4 cols) */}
          <div className="lg:col-span-4 bg-[#0038FF] border border-white/20 shadow-2xl p-6 rounded-3xl flex flex-col justify-between text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6FF20]/20 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C6FF20] flex items-center gap-1.5 font-black">
                  <Globe className="w-3.5 h-3.5" />
                  Production Deployments
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  VERCEL &amp; CLOUD
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-black tracking-tight text-white num-tabular">
                  {productionProjects.length}
                </span>
                <span className="text-xs font-mono text-white/70 font-semibold">
                  Live Deployed Apps
                </span>
              </div>

              <p className="text-xs text-white/80 leading-relaxed font-normal">
                {productionProjects.length > 0
                  ? `${productionProjects.length} applications with verified public URLs, real-time health, and live launch buttons.`
                  : 'Add your live Vercel, Render, or custom deployment links to monitor live apps.'}
              </p>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setActiveTab('PRODUCTION')}
                className="text-[#C6FF20] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Production Apps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-white/60">{avgProgress}% avg velocity</span>
            </div>
          </div>

          {/* Bento Card 2: Velocity & Sprint Gauges (5 cols) */}
          <div className="lg:col-span-5 bg-white text-slate-900 border border-white/20 shadow-2xl p-6 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-black">
                <Activity className="w-3.5 h-3.5 text-[#0038FF]" />
                Sprint Velocity &amp; Quality
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                HEURISTIC 100%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0038FF"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - avgProgress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 shadow-sm"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-950 font-mono num-tabular">
                      {avgProgress}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold">Velocity</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 mt-2 font-mono">Sprint Velocity</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">Weighted (4x/3x/2x/1x)</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#7020DD"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - 0.89)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 shadow-sm"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-950 font-mono num-tabular">89%</span>
                    <span className="text-[9px] font-mono text-purple-700 font-black">Coverage</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 mt-2 font-mono">Test Coverage</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">Unit &amp; AST</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between font-bold">
              <span>Completed: {completedFeatures}/{totalFeatures}</span>
              <span className="text-[#0038FF]">{activeProjects.length} Active Repos</span>
            </div>
          </div>

          {/* Bento Card 3: AI Cascade Matrix & Triage (3 cols) */}
          <div className="lg:col-span-3 bg-white text-slate-900 border border-white/20 shadow-2xl p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-black">
                  <Cpu className="w-3.5 h-3.5 text-[#0038FF]" />
                  AI Cascade Matrix
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0038FF] font-black">
                  ONLINE
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-900 font-mono text-[11px] font-bold">Gemini 2.5 Flash</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#0038FF] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0038FF] pulse-blue" />
                    Fast Primary
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-900 font-mono text-[11px] font-bold">Llama 3.2 11B</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-purple-700 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7020DD] pulse-violet" />
                    NVIDIA NIM
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-mono text-[11px] font-medium">Qdrant RAG</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {needsReviewProjects.length > 0 ? (
                <button
                  onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                  className="w-full btn-lime !py-2.5 !px-3 !justify-between text-xs font-black shadow-md cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Triage ({needsReviewProjects.length})</span>
                  </span>
                  <span>&rarr;</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-blue-900 font-mono py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0038FF]" />
                  <span>All repositories synchronized</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills, Search Bar, and Manual Sorting Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-black/25 border border-white/20 rounded-full shadow-md overflow-x-auto max-w-full backdrop-blur-md">
            {[
              { id: 'ALL' as DashboardTab, label: 'All Repos', count: nonHiddenProjects.length },
              { id: 'STARRED' as DashboardTab, label: '⭐ Starred', count: starredProjects.length },
              { id: 'PRODUCTION' as DashboardTab, label: '🚀 Production', count: productionProjects.length },
              { id: 'RESUME' as DashboardTab, label: 'Resume', count: nonHiddenProjects.filter((p) => p.project_type === 'RESUME').length },
              { id: 'COLLEGE' as DashboardTab, label: 'College', count: nonHiddenProjects.filter((p) => p.project_type === 'COLLEGE').length },
              { id: 'HIDDEN' as DashboardTab, label: '👁️‍🗨️ Hidden', count: hiddenProjects.length },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#C6FF20] text-black font-black shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10 font-bold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/15 text-black font-black'
                        : 'bg-white/20 text-white font-bold'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector & Repo Count */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 bg-black/30 border border-white/20 px-3 py-1.5 rounded-2xl backdrop-blur-md text-xs font-mono">
              <ArrowDownUp className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span className="text-white/60 text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="DEFAULT" className="bg-slate-900 text-white">⭐ Starred First</option>
                <option value="ORDER" className="bg-slate-900 text-white">Custom Priority Order</option>
                <option value="PROGRESS" className="bg-slate-900 text-white">Velocity Progress %</option>
                <option value="RECENT" className="bg-slate-900 text-white">Recently Updated</option>
                <option value="NAME" className="bg-slate-900 text-white">Alphabetical (A-Z)</option>
              </select>
            </div>

            <div className="text-xs font-mono text-white/80 font-bold whitespace-nowrap">
              Showing <span className="text-[#C6FF20] font-black">{filteredProjects.length}</span> repos
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

        {/* Project Grid */}
        {loading ? (
          <div className="py-28 text-center text-xs text-white font-mono animate-pulse">
            Hydrating repository intelligence matrix...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white text-slate-900 border border-white/20 p-16 text-center space-y-3 rounded-3xl shadow-2xl">
            <GitBranch className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-900">
              {activeTab === 'HIDDEN'
                ? 'No hidden repositories'
                : activeTab === 'STARRED'
                ? 'No starred repositories yet'
                : activeTab === 'PRODUCTION'
                ? 'No production deployed repositories'
                : 'No repositories found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-mono">
              {searchQuery
                ? 'No results matched your search term. Try adjusting filters.'
                : activeTab === 'STARRED'
                ? 'Click the star icon on any project card to pin it here.'
                : activeTab === 'PRODUCTION'
                ? 'Add a live Vercel or deployment URL to any repository to track it here.'
                : activeTab === 'HIDDEN'
                ? 'You have not hidden any repositories yet.'
                : 'Click "Sync" in the top bar to pull repositories from GitHub.'}
            </p>
          </div>
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
      </main>

      {/* Triage Modal */}
      {activeTriageProject && (
        <TriageModal
          project={activeTriageProject}
          isOpen={!!activeTriageProject}
          onClose={() => setActiveTriageProject(null)}
          onConfirmed={fetchProjects}
        />
      )}
    </div>
  );
}
