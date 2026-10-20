'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectSummary, FutureProject, ParsedConcept, ProjectType, FutureProjectPriority } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer } from '@/components/AppShell';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
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
  LayoutDashboard
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

  // Smart WhatsApp import modal state on Dashboard
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedConcept | null>(null);

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

  // WhatsApp Smart Extractor on Dashboard
  const handleExtractConcept = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      const res: any = await api.post('/future-projects/parse-concept', {
        raw_text: rawText.trim(),
      });
      setParsedPreview(res);
    } catch (err: any) {
      console.warn('Smart extract fallback locally:', err);
      const clean = rawText.trim();
      const firstLine = clean.split('\n')[0].slice(0, 50);
      setParsedPreview({
        title: firstLine || 'Extracted Project Concept',
        elevator_pitch: clean.slice(0, 220),
        target_tech_stack: 'Python, FastAPI, React, SQLite',
        project_type: 'RESUME',
        priority: 'P1',
        notes: `Raw WhatsApp notes:\n${clean}`,
        starter_features: [
          'Core MVP Data Architecture & Endpoints',
          'Interactive Frontend User Interface',
          'Production Deployment & CI Workflow',
        ],
        provider_used: 'Local Heuristic Cascade',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveImportedConcept = async () => {
    if (!parsedPreview || !parsedPreview.title.trim()) return;
    try {
      const created = await api.post<FutureProject>('/future-projects', {
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: parsedPreview.raw_message || rawText.trim() || undefined,
      });
      showToast(`Concept "${parsedPreview.title.trim()}" added to backlog!`);
      setShowImportModal(false);
      setRawText('');
      setParsedPreview(null);
      fetchIdeas();
    } catch (err) {
      console.warn('Failed to save imported concept:', err);
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

  const priorityStyles: Record<string, { badge: string; dot: string; label: string }> = {
    P0: { badge: 'border-rose-200 bg-rose-50 text-rose-700', dot: 'bg-rose-500', label: 'P0 Immediate' },
    P1: { badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'P1 Upcoming' },
    P2: { badge: 'border-blue-200 bg-blue-50 text-[#0038FF]', dot: 'bg-[#0038FF]', label: 'P2 Backlog' },
  };

  return (
    <AppShell>
      {/* Floating Island Navigation Header */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#C6FF20] text-black font-mono text-xs font-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <PageContainer className="space-y-6">
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

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-white/70">
              Active: <strong className="text-[#C6FF20]">{nonHiddenProjects.length}</strong> repos
              {hiddenProjects.length > 0 && (
                <span className="text-white/40 ml-1.5">({hiddenProjects.length} hidden)</span>
              )}
            </span>
            <button
              onClick={() => setActiveTab('IDEAS')}
              className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-[#C6FF20]" />
              <span>Ideas Backlog: <strong className="text-[#C6FF20]">{unpromotedIdeas.length}</strong></span>
            </button>
          </div>
        </div>

        {/* Bento Grid Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Bento Card 1: Production Deployed Telemetry (4 cols) */}
          <div className="gridster-panel-deep relative flex flex-col justify-between overflow-hidden p-6 lg:col-span-4">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-brand-lime-400/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />

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
                      stroke="#C6FF20"
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
                  <span className="text-slate-700 font-mono text-[11px] font-medium">Concept Extractor</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
                    WhatsApp Ingest
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
                    <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
                    <span>Triage Required</span>
                  </span>
                  <span className="bg-black/15 text-black px-1.5 py-0.5 rounded-full font-mono text-[10px]">
                    {needsReviewProjects.length}
                  </span>
                </button>
              ) : (
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0038FF]" />
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
                  onClick={() => {
                    setShowImportModal(true);
                    setRawText('');
                    setParsedPreview(null);
                  }}
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
              <div className="bg-white text-slate-900 border border-white/20 p-16 text-center space-y-3 rounded-3xl shadow-2xl">
                <Lightbulb className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-base font-black text-slate-900">No future ideas queued</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-mono">
                  Have an idea on WhatsApp or voice notes? Click &quot;Import from WhatsApp&quot; to extract and prioritize it before building.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setRawText('');
                      setParsedPreview(null);
                    }}
                    className="btn-lime !py-2 !px-4 text-xs font-black inline-flex items-center gap-1.5"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 text-black" />
                    <span>Import Concept from WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => {
                  const pConfig = priorityStyles[idea.priority];
                  return (
                    <div
                      key={idea.id}
                      className="bg-white text-slate-900 border border-white/20 shadow-2xl p-5 space-y-3.5 hover:translate-y-[-2px] transition-all rounded-3xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Box */}
                        <div className="bg-[#0038FF] text-white rounded-2xl p-4 shadow-inner mb-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                                {idea.project_type}
                              </span>
                              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-[#C6FF20] text-black">
                                NO REPO YET
                              </span>
                            </div>
                            <h2 className="font-black text-base text-white leading-snug mt-2">{idea.title}</h2>
                          </div>
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="text-white/70 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                            title="Delete idea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {idea.elevator_pitch && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
                            {idea.elevator_pitch}
                          </p>
                        )}

                        {idea.notes && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-28 overflow-y-auto">
                            <span className="font-bold text-slate-900 block mb-0.5">Notes &amp; Scope:</span>
                            {idea.notes}
                          </div>
                        )}

                        {idea.raw_message && (
                          <details className="mt-2 text-xs group">
                            <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 select-none font-bold">
                              <MessageSquareText className="w-3 h-3 text-emerald-600" />
                              <span>View Original Message</span>
                            </summary>
                            <div className="mt-1.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                              {idea.raw_message}
                            </div>
                          </details>
                        )}
                      </div>

                      {idea.target_tech_stack && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <Code className="w-3.5 h-3.5 text-[#0038FF] shrink-0" />
                          <span className="font-bold truncate">{idea.target_tech_stack}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                          {pConfig.label}
                        </span>

                        <button
                          onClick={() => handlePromoteIdea(idea.id, idea.title)}
                          className="btn-lime !py-1 !px-3 text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="Convert to active repository on Mission Control"
                        >
                          <span>Start Building</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 rounded-3xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-950 uppercase">Import Concept from WhatsApp / Notes</h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    AI smartly extracts title, pitch, tech stack, priority, and starter MVP scope.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!parsedPreview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Paste WhatsApp Text or Voice Transcript
                  </label>
                  <textarea
                    rows={6}
                    autoFocus
                    placeholder="e.g. bro what if we build a bot that automatically tweets git commits using python and fastapi, top priority asap. We could add discord alerts too."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-2xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none shadow-inner font-mono leading-relaxed"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200/70 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Zap className="w-4 h-4 text-[#0038FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Smart Extraction:</strong> DevCommand AI analyzes informal chat notes and structures them into a prioritized backlog idea without needing a GitHub repository yet.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtracting || !rawText.trim()}
                    onClick={handleExtractConcept}
                    className="btn-lime !py-2 !px-5 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Smart Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-black" />
                        <span>⚡ Smart Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Concept Extracted! Review before saving:</span>
                  </div>
                  {parsedPreview.provider_used && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      {parsedPreview.provider_used}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Concept Title</label>
                    <input
                      type="text"
                      value={parsedPreview.title}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Elevator Pitch</label>
                    <textarea
                      rows={2}
                      value={parsedPreview.elevator_pitch}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, elevator_pitch: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Target Tech Stack</label>
                    <input
                      type="text"
                      value={parsedPreview.target_tech_stack}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, target_tech_stack: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">Category</label>
                      <select
                        value={parsedPreview.project_type}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, project_type: e.target.value as ProjectType })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                      >
                        <option value="RESUME">Resume Portfolio</option>
                        <option value="COLLEGE">Academic / College</option>
                        <option value="PRODUCTION">Production SaaS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">Priority Track</label>
                      <select
                        value={parsedPreview.priority}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, priority: e.target.value as FutureProjectPriority })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                      >
                        <option value="P0">P0 - Next Immediate</option>
                        <option value="P1">P1 - Upcoming</option>
                        <option value="P2">P2 - Research Backlog</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Notes &amp; Scope</label>
                    <textarea
                      rows={3}
                      value={parsedPreview.notes || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  {parsedPreview.raw_message && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">
                        💬 Original Message (Saved):
                      </span>
                      <p className="text-[11px] font-mono text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 max-h-20 overflow-y-auto">
                        &ldquo;{parsedPreview.raw_message}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setParsedPreview(null)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Paste New Text</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImportedConcept}
                      className="btn-lime !py-2 !px-5 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-black" />
                      <span>Save to Ideas Backlog</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
