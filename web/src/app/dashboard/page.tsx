'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectSummary, FutureProject, ParsedConcept, ProjectType, FutureProjectPriority } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import { StaticLoader } from '@/components/StaticLoader';
import {
  GitBranch,
  Activity,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe,
  EyeOff,
  SlidersHorizontal,
  ArrowDownUp,
  Lightbulb,
  MessageSquareText,
  Plus,
  X,
  Loader2,
  Code,
  Trash2,
  Check
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
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveImportedConcept = async () => {
    if (!parsedPreview) return;
    try {
      await api.post('/future-projects', {
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch?.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack?.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: rawText.trim() || undefined,
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
    P0: { badge: 'rounded-full border border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'P0 IMMEDIATE' },
    P1: { badge: 'rounded-full border border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-amber-500', label: 'P1 UPCOMING' },
    P2: { badge: 'rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500', label: 'P2 BACKLOG' },
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#DFFF4F] text-black font-mono text-xs font-black px-4 py-3 border-2 border-black shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-20 space-y-6 relative z-10 flex-1">
        {/* Compact Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-neutral-200/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0047FF] animate-pulse inline-block" />
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">
                WORKSPACE TELEMETRY &bull; NODE ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 flex items-center gap-3">
              <span>MISSION CONTROL</span>
              {starredProjects.length > 0 && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-black text-black" />
                  <span>{starredProjects.length} PINNED</span>
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono text-neutral-700 bg-white border border-neutral-200/90 rounded-xl px-3 py-1.5 shadow-xs">
              ACTIVE: <strong className="text-[#0047FF] font-bold">{nonHiddenProjects.length}</strong> REPOS
              {hiddenProjects.length > 0 && (
                <span className="text-neutral-400 ml-1.5 font-normal">({hiddenProjects.length} hidden)</span>
              )}
            </span>
            <button
              onClick={() => setActiveTab('IDEAS')}
              className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/90 text-neutral-800 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>IDEAS BACKLOG: <strong className="text-neutral-900">{unpromotedIdeas.length}</strong></span>
            </button>
          </div>
        </div>

        {/* Bento Grid Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Bento Card 1: Production Deployed Telemetry (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0047FF] via-[#003de6] to-[#002fba] text-white p-6 flex flex-col justify-between relative overflow-hidden group shadow-xs hover:shadow-xl hover:shadow-blue-500/15 border border-blue-500/40 transition-all duration-300">
            {/* Ambient subtle glow ring */}
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-blue-100 flex items-center gap-1.5 font-bold">
                  <Globe className="w-4 h-4 text-[#DFFF4F]" />
                  PRODUCTION DEPLOYMENTS
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/40 text-[#DFFF4F] border border-white/20 font-bold uppercase tracking-wider backdrop-blur-xs">
                  VERCEL &bull; CLOUD
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-black tracking-tight text-white num-tabular">
                  {productionProjects.length}
                </span>
                <span className="text-xs font-mono text-blue-100 font-bold uppercase tracking-wider">
                  Live Deployed Apps
                </span>
              </div>

              <p className="text-xs text-blue-100/90 leading-relaxed font-sans mb-3.5">
                {productionProjects.length > 0
                  ? `${productionProjects.length} applications with verified public URLs, real-time health, and live launch buttons.`
                  : 'Add your live Vercel, Render, or custom deployment links to monitor live apps.'}
              </p>

              {/* Live Telemetry Mini Matrix */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold bg-black/20 backdrop-blur-xs p-2.5 rounded-xl border border-white/15">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  UPTIME: 99.9%
                </span>
                <span className="flex items-center gap-1.5 text-[#DFFF4F]">
                  <CheckCircle2 className="w-3 h-3 text-[#DFFF4F]" />
                  HEALTH: VERIFIED
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-mono mt-4 relative z-10">
              <button
                onClick={() => setActiveTab('PRODUCTION')}
                className="bg-[#DFFF4F] text-black px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-white hover:text-black transition-all cursor-pointer shadow-xs active:translate-y-0.5"
              >
                <span>VIEW APPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-blue-100 font-mono font-bold">{avgProgress}% AVG VELOCITY</span>
            </div>
          </div>

          {/* Bento Card 2: Velocity & Sprint Gauges (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white text-black border border-neutral-200/90 shadow-xs hover:shadow-lg hover:shadow-neutral-200/60 p-6 flex flex-col justify-between transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Activity className="w-4 h-4 text-[#0047FF]" />
                SPRINT VELOCITY &bull; QUALITY
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
                      className="text-neutral-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0047FF"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - avgProgress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-neutral-900 font-mono num-tabular">
                      {avgProgress}%
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase">Velocity</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-neutral-900 mt-2 font-mono uppercase tracking-wider">Sprint Velocity</span>
                <span className="text-[10px] font-mono text-neutral-500 font-medium">Weighted (4x/3x/2x/1x)</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="text-neutral-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - 0.89)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-neutral-900 font-mono num-tabular">89%</span>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase">Coverage</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-neutral-900 mt-2 font-mono uppercase tracking-wider">Test Coverage</span>
                <span className="text-[10px] font-mono text-neutral-500 font-medium">Unit &amp; AST Analysis</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-neutral-600 pt-3 border-t border-neutral-100 flex items-center justify-between font-semibold uppercase">
              <span>Completed: <strong className="text-neutral-900">{completedFeatures}</strong>/{totalFeatures}</span>
              <span className="text-[#0047FF] font-bold">{activeProjects.length} Active Repos</span>
            </div>
          </div>

          {/* Bento Card 3: AI Cascade Matrix & Triage (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-white text-black border border-neutral-200/90 shadow-xs hover:shadow-lg hover:shadow-neutral-200/60 p-6 flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Cpu className="w-4 h-4 text-[#0047FF]" />
                  AI CASCADE MATRIX
                </span>
                <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50 hover:bg-blue-50/40 border border-neutral-200/80 border-l-4 border-l-[#0047FF] transition-colors">
                  <span className="text-neutral-900 font-mono text-[11px] font-bold uppercase">Gemini 2.5 Flash</span>
                  <span className="text-[10px] font-mono text-[#0047FF] font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-xs">
                    Fast Primary
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50 hover:bg-purple-50/40 border border-neutral-200/80 border-l-4 border-l-purple-600 transition-colors">
                  <span className="text-neutral-900 font-mono text-[11px] font-bold uppercase">Llama 3.2 11B</span>
                  <span className="text-[10px] font-mono text-purple-700 font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-xs">
                    NVIDIA NIM
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50 hover:bg-emerald-50/40 border border-neutral-200/80 border-l-4 border-l-emerald-600 transition-colors">
                  <span className="text-neutral-900 font-mono text-[11px] font-bold uppercase">Concept Extractor</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-neutral-200 shadow-xs">
                    WhatsApp Ingest
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {needsReviewProjects.length > 0 ? (
                <button
                  onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                  className="w-full py-2.5 px-3.5 bg-[#FF5533] hover:bg-[#e64726] text-white rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:translate-y-0.5"
                >
                  <span className="flex items-center gap-1.5 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Triage Required</span>
                  </span>
                  <span className="bg-black/30 text-white px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                    {needsReviewProjects.length}
                  </span>
                </button>
              ) : (
                <div className="text-[11px] font-mono text-emerald-800 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ALL REPOSITORIES SYNCED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills, Search Bar, and Manual Sorting Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-neutral-200/90 shadow-xs overflow-x-auto max-w-full">
            {[
              { id: 'ALL' as DashboardTab, label: 'All Repos', count: nonHiddenProjects.length },
              { id: 'STARRED' as DashboardTab, label: '★ Starred', count: starredProjects.length },
              { id: 'PRODUCTION' as DashboardTab, label: '🚀 Production', count: productionProjects.length },
              { id: 'IDEAS' as DashboardTab, label: '💡 Project Ideas', count: unpromotedIdeas.length },
              { id: 'RESUME' as DashboardTab, label: 'Resume', count: nonHiddenProjects.filter((p) => p.project_type === 'RESUME').length },
              { id: 'COLLEGE' as DashboardTab, label: 'College', count: nonHiddenProjects.filter((p) => p.project_type === 'COLLEGE').length },
              { id: 'HIDDEN' as DashboardTab, label: 'Archive', count: hiddenProjects.length },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-bold shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100 font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-neutral-100 text-neutral-600 font-medium'
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
            {activeTab !== 'IDEAS' && (
              <div className="flex items-center gap-1.5 bg-white border border-neutral-200/90 rounded-xl px-3 py-1.5 shadow-xs text-xs font-mono">
                <ArrowDownUp className="w-3.5 h-3.5 text-[#0047FF]" />
                <span className="text-neutral-500 text-[11px] font-bold uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-neutral-900 font-bold uppercase outline-none cursor-pointer text-xs"
                >
                  <option value="DEFAULT">★ Starred First</option>
                  <option value="ORDER">Custom Priority Order</option>
                  <option value="PROGRESS">Velocity Progress %</option>
                  <option value="RECENT">Recently Updated</option>
                  <option value="NAME">Alphabetical (A-Z)</option>
                </select>
              </div>
            )}

            <div className="text-xs font-mono text-neutral-800 font-bold uppercase whitespace-nowrap bg-white px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-xs">
              {activeTab === 'IDEAS' ? (
                <>SHOWING <span className="text-[#0047FF] font-bold">{filteredIdeas.length}</span> FUTURE IDEAS</>
              ) : (
                <>SHOWING <span className="text-[#0047FF] font-bold">{filteredProjects.length}</span> REPOS</>
              )}
            </div>
          </div>
        </div>

        {/* Notice banner for Hidden tab */}
        {activeTab === 'HIDDEN' && (
          <div className="p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-xs text-neutral-800 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-neutral-500" />
              <span>
                These repositories are soft-hidden from active views. They remain intact on GitHub and can be restored anytime.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('ALL')}
              className="bg-neutral-900 text-white px-3.5 py-1.5 rounded-xl font-bold uppercase hover:bg-[#0047FF] transition cursor-pointer"
            >
              Back to Active Repos &rarr;
            </button>
          </div>
        )}

        {/* View Mode: IDEAS Backlog */}
        {activeTab === 'IDEAS' ? (
          <div className="space-y-6">
            {/* Quick Action Bar for Ideas Tab */}
            <div className="p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>FUTURE PROJECT IDEAS BACKLOG (NO REPOSITORY YET)</span>
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Unbuilt software concepts with priority rankings (P0 Immediate, P1 Upcoming, P2 Backlog).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    setShowImportModal(true);
                    setRawText('');
                    setParsedPreview(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#DFFF4F] text-black font-mono text-xs font-bold uppercase rounded-xl hover:bg-neutral-900 hover:text-white flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>Import from WhatsApp</span>
                </button>
                <Link
                  href="/ideas"
                  className="px-3.5 py-1.5 bg-neutral-50 text-neutral-800 border border-neutral-200/90 rounded-xl font-mono text-xs font-bold uppercase shadow-xs hover:bg-white transition flex items-center gap-1"
                >
                  <span>Radar Board</span>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                </Link>
              </div>
            </div>

            {/* Ideas Grid */}
            {filteredIdeas.length === 0 ? (
              <div className="bg-white text-black border border-neutral-200/90 rounded-2xl p-16 text-center space-y-3 shadow-xs">
                <Lightbulb className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">No future ideas queued</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed font-mono">
                  Have an idea on WhatsApp or voice notes? Click &quot;Import from WhatsApp&quot; to extract and prioritize it before building.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setRawText('');
                      setParsedPreview(null);
                    }}
                    className="px-4 py-2 bg-[#DFFF4F] text-black font-mono text-xs font-bold uppercase rounded-xl hover:bg-neutral-900 hover:text-white inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
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
                      className="bg-white text-black border border-neutral-200/90 rounded-2xl p-5 space-y-3.5 hover:-translate-y-1 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Row */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-neutral-900 text-white uppercase">
                              {idea.project_type}
                            </span>
                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase">
                              NO REPO YET
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="text-neutral-400 hover:text-[#FF5533] transition-colors p-1 cursor-pointer"
                            title="Delete idea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h2 className="font-bold text-lg text-neutral-900 leading-snug hover:text-[#0047FF] transition-colors">{idea.title}</h2>

                        {idea.elevator_pitch && (
                          <p className="text-xs text-neutral-600 mt-2 leading-relaxed font-normal">
                            {idea.elevator_pitch}
                          </p>
                        )}

                        {idea.notes && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-neutral-50 border-l-2 border-[#0047FF] border-r border-t border-b border-neutral-200/60 text-[11px] font-mono text-neutral-800 whitespace-pre-wrap max-h-28 overflow-y-auto">
                            <span className="font-bold text-neutral-900 block mb-0.5 uppercase">Notes &amp; Scope:</span>
                            {idea.notes}
                          </div>
                        )}

                        {idea.raw_message && (
                          <details className="mt-2 text-xs group">
                            <summary className="cursor-pointer font-mono text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 select-none font-semibold uppercase">
                              <MessageSquareText className="w-3 h-3 text-[#0047FF]" />
                              <span>View Original Message</span>
                            </summary>
                            <div className="mt-1.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] font-mono text-neutral-800 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                              {idea.raw_message}
                            </div>
                          </details>
                        )}
                      </div>

                      {idea.target_tech_stack && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-800 bg-neutral-50 p-2 rounded-xl border border-neutral-200/80">
                          <Code className="w-3.5 h-3.5 text-[#0047FF] shrink-0" />
                          <span className="font-bold truncate uppercase">{idea.target_tech_stack}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 uppercase flex items-center gap-1.5 ${pConfig.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                          {pConfig.label}
                        </span>

                        <button
                          onClick={() => handlePromoteIdea(idea.id, idea.title)}
                          className="px-3.5 py-1.5 bg-neutral-900 text-white hover:bg-[#0047FF] text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:translate-y-0.5"
                          title="Convert to active repository on Mission Control"
                        >
                          <span>START BUILDING</span>
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
                label="HYDRATING REPOSITORY TELEMETRY"
                sublabel="Syncing AST, MongoDB Atlas records, and incubator backlog..."
              />
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white text-black border border-neutral-200/90 rounded-2xl p-16 text-center space-y-3 shadow-xs">
                <GitBranch className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">
                  {activeTab === 'HIDDEN'
                    ? 'No hidden repositories'
                    : activeTab === 'STARRED'
                    ? 'No starred repositories yet'
                    : activeTab === 'PRODUCTION'
                    ? 'No production deployed repositories'
                    : 'No repositories found'}
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed font-mono">
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

      {/* Smart Concept / WhatsApp Text Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-black">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#DFFF4F] text-black rounded-xl shadow-xs">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-black uppercase tracking-tight">Import Concept from WhatsApp / Notes</h2>
                  <p className="text-[11px] text-neutral-600 font-mono">
                    AI smartly extracts title, pitch, tech stack, priority, and starter MVP scope.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="p-1 bg-[#FAF7EE] border border-neutral-300 hover:bg-black hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!parsedPreview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                    Paste WhatsApp Text or Voice Transcript
                  </label>
                  <textarea
                    rows={6}
                    autoFocus
                    placeholder="e.g. bro what if we build a bot that automatically tweets git commits using python and fastapi, top priority asap. We could add discord alerts too."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-neutral-300 focus:border-[#0047FF] focus:bg-white p-3.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition resize-none font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-[#FAF7EE] text-black border border-neutral-300 font-mono text-xs font-black uppercase hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtracting || !rawText.trim()}
                    onClick={handleExtractConcept}
                    className="px-5 py-2 bg-[#DFFF4F] text-black border border-black font-mono text-xs font-black uppercase shadow-sm hover:bg-black hover:text-[#DFFF4F] transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                    <span>{isExtracting ? 'Extracting Concept...' : 'AI Extract Concept'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF7EE] border border-neutral-300 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#DFFF4F] text-black border border-black font-black uppercase">
                      {parsedPreview.project_type} &bull; {parsedPreview.priority}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-600 font-bold uppercase">
                      AI Extracted Spec
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-black">{parsedPreview.title}</h3>
                    <p className="text-xs text-neutral-700 mt-1 leading-relaxed">{parsedPreview.elevator_pitch}</p>
                  </div>

                  {parsedPreview.target_tech_stack && (
                    <div className="text-[11px] font-mono text-black flex items-center gap-1.5 pt-1">
                      <Code className="w-3.5 h-3.5 text-[#0047FF]" />
                      <strong className="uppercase">Stack:</strong> {parsedPreview.target_tech_stack}
                    </div>
                  )}

                  {parsedPreview.starter_features && parsedPreview.starter_features.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200 space-y-1">
                      <span className="text-[10px] font-mono font-black uppercase text-black block">
                        Starter MVP Roadmap:
                      </span>
                      {parsedPreview.starter_features.map((feat, idx) => (
                        <div key={idx} className="text-xs text-neutral-800 flex items-center gap-1.5 font-mono">
                          <Check className="w-3 h-3 text-[#0047FF] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setParsedPreview(null)}
                    className="px-4 py-2 bg-[#FAF7EE] text-black border border-neutral-300 font-mono text-xs font-black uppercase hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Re-edit Raw Text
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveImportedConcept}
                    className="px-5 py-2 bg-[#DFFF4F] text-black border border-black font-mono text-xs font-black uppercase shadow-sm hover:bg-black hover:text-[#DFFF4F] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save to Ideas Radar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
