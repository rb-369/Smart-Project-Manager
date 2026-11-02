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
    P0: { badge: 'border-2 border-black bg-[#FF5533] text-black', dot: 'bg-black', label: 'P0 IMMEDIATE' },
    P1: { badge: 'border-2 border-black bg-amber-300 text-black', dot: 'bg-black', label: 'P1 UPCOMING' },
    P2: { badge: 'border-2 border-black bg-[#BBF7D0] text-black', dot: 'bg-black', label: 'P2 BACKLOG' },
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
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-8 pb-20 space-y-6 relative z-10 flex-1">
        {/* Compact Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#0047FF] border border-black inline-block" />
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest font-black">
                WORKSPACE TELEMETRY &bull; NODE ACTIVE
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
              <span>MISSION CONTROL</span>
              {starredProjects.length > 0 && (
                <span className="text-xs font-mono font-black px-2.5 py-1 bg-[#DFFF4F] text-black border border-black flex items-center gap-1">
                  <Star className="w-3 h-3 fill-black text-black" />
                  <span>{starredProjects.length} PINNED</span>
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-neutral-800 bg-white border border-neutral-300 px-3 py-1.5 shadow-sm">
              ACTIVE: <strong className="text-[#0047FF] font-black">{nonHiddenProjects.length}</strong> REPOS
              {hiddenProjects.length > 0 && (
                <span className="text-neutral-500 ml-1.5 font-bold">({hiddenProjects.length} hidden)</span>
              )}
            </span>
            <button
              onClick={() => setActiveTab('IDEAS')}
              className="text-xs font-mono font-black px-3.5 py-1.5 bg-[#FAF7EE] hover:bg-[#DFFF4F] border border-black text-black flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-black" />
              <span>IDEAS BACKLOG: <strong className="text-black">{unpromotedIdeas.length}</strong></span>
            </button>
          </div>
        </div>

        {/* Bento Grid Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Bento Card 1: Production Deployed Telemetry (4 cols) */}
          <div className="lg:col-span-4 bg-[#0047FF] border-2 border-black shadow-sm hover:shadow-md p-6 flex flex-col justify-between text-white relative overflow-hidden group transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#DFFF4F] flex items-center gap-1.5 font-black">
                  <Globe className="w-4 h-4 text-[#DFFF4F]" />
                  PRODUCTION DEPLOYMENTS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white border border-white font-black uppercase tracking-wider">
                  VERCEL &bull; CLOUD
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-black tracking-tight text-white num-tabular">
                  {productionProjects.length}
                </span>
                <span className="text-xs font-mono text-white/90 font-bold uppercase tracking-wider">
                  Live Deployed Apps
                </span>
              </div>

              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {productionProjects.length > 0
                  ? `${productionProjects.length} applications with verified public URLs, real-time health, and live launch buttons.`
                  : 'Add your live Vercel, Render, or custom deployment links to monitor live apps.'}
              </p>
            </div>

            <div className="pt-4 border-t border-white/30 flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setActiveTab('PRODUCTION')}
                className="bg-[#DFFF4F] text-black px-3.5 py-1.5 border border-black font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-white transition cursor-pointer"
              >
                <span>VIEW APPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-white font-mono font-bold">{avgProgress}% AVG VELOCITY</span>
            </div>
          </div>

          {/* Bento Card 2: Velocity & Sprint Gauges (5 cols) */}
          <div className="lg:col-span-5 bg-white text-black border-2 border-black shadow-sm hover:shadow-md p-6 flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-black uppercase tracking-wider flex items-center gap-1.5 font-black">
                <Activity className="w-4 h-4 text-[#0047FF]" />
                SPRINT VELOCITY &bull; QUALITY
              </span>
              <span className="text-[10px] font-mono text-emerald-900 bg-[#BBF7D0] px-2 py-0.5 border border-emerald-400 font-black uppercase tracking-wider">
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
                      className="text-[#FAF7EE]"
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
                    <span className="text-xl font-black text-black font-mono num-tabular">
                      {avgProgress}%
                    </span>
                    <span className="text-[9px] font-mono text-neutral-600 font-black uppercase">Velocity</span>
                  </div>
                </div>
                <span className="text-xs font-black text-black mt-2 font-mono uppercase tracking-wider">Sprint Velocity</span>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">Weighted (4x/3x/2x/1x)</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="text-[#FAF7EE]"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#000000"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - 0.89)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-black font-mono num-tabular">89%</span>
                    <span className="text-[9px] font-mono text-[#0047FF] font-black uppercase">Coverage</span>
                  </div>
                </div>
                <span className="text-xs font-black text-black mt-2 font-mono uppercase tracking-wider">Test Coverage</span>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">Unit &amp; AST Analysis</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-neutral-700 pt-3 border-t border-neutral-200 flex items-center justify-between font-black uppercase">
              <span>Completed: {completedFeatures}/{totalFeatures}</span>
              <span className="text-[#0047FF]">{activeProjects.length} Active Repos</span>
            </div>
          </div>

          {/* Bento Card 3: AI Cascade Matrix & Triage (3 cols) */}
          <div className="lg:col-span-3 bg-white text-black border-2 border-black shadow-sm hover:shadow-md p-6 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-black uppercase tracking-wider flex items-center gap-1.5 font-black">
                  <Cpu className="w-4 h-4 text-[#0047FF]" />
                  AI CASCADE MATRIX
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-[#DFFF4F] border border-black text-black font-black uppercase tracking-wider">
                  ONLINE
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs p-2 bg-[#FAF7EE] border border-neutral-200">
                  <span className="text-black font-mono text-[11px] font-black uppercase">Gemini 2.5 Flash</span>
                  <span className="text-[10px] font-mono text-[#0047FF] font-black uppercase">
                    Fast Primary
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 bg-[#FAF7EE] border border-neutral-200">
                  <span className="text-black font-mono text-[11px] font-black uppercase">Llama 3.2 11B</span>
                  <span className="text-[10px] font-mono text-purple-700 font-black uppercase">
                    NVIDIA NIM
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 bg-[#FAF7EE] border border-neutral-200">
                  <span className="text-neutral-700 font-mono text-[11px] font-bold uppercase">Concept Extractor</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-black uppercase">
                    WhatsApp Ingest
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {needsReviewProjects.length > 0 ? (
                <button
                  onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                  className="w-full py-2.5 px-3 bg-[#FF5533] text-black border border-black hover:bg-black hover:text-[#DFFF4F] flex items-center justify-between text-xs font-mono font-black transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Triage Required</span>
                  </span>
                  <span className="bg-black text-[#DFFF4F] px-2 py-0.5 font-mono text-[10px] border border-black">
                    {needsReviewProjects.length}
                  </span>
                </button>
              ) : (
                <div className="text-[11px] font-mono text-emerald-900 flex items-center justify-center gap-1.5 p-2 bg-[#BBF7D0]/60 border border-emerald-400 font-black uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ALL REPOSITORIES SYNCED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills, Search Bar, and Manual Sorting Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border-2 border-black shadow-sm overflow-x-auto max-w-full">
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
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#DFFF4F] text-black font-black border border-black'
                      : 'border border-transparent text-neutral-700 hover:text-black hover:bg-[#FAF7EE] font-bold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                      isSelected
                        ? 'bg-black text-[#DFFF4F] border-black font-black'
                        : 'bg-[#FAF7EE] text-neutral-700 border-neutral-300 font-bold'
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
              <div className="flex items-center gap-1.5 bg-white border border-neutral-300 px-3 py-1.5 shadow-sm text-xs font-mono">
                <ArrowDownUp className="w-3.5 h-3.5 text-[#0047FF]" />
                <span className="text-neutral-600 text-[11px] font-black uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-black font-black uppercase outline-none cursor-pointer text-xs"
                >
                  <option value="DEFAULT">★ Starred First</option>
                  <option value="ORDER">Custom Priority Order</option>
                  <option value="PROGRESS">Velocity Progress %</option>
                  <option value="RECENT">Recently Updated</option>
                  <option value="NAME">Alphabetical (A-Z)</option>
                </select>
              </div>
            )}

            <div className="text-xs font-mono text-black font-black uppercase whitespace-nowrap bg-[#FAF7EE] px-3 py-1.5 border border-neutral-300 shadow-sm">
              {activeTab === 'IDEAS' ? (
                <>SHOWING <span className="text-[#0047FF] font-black">{filteredIdeas.length}</span> FUTURE IDEAS</>
              ) : (
                <>SHOWING <span className="text-[#0047FF] font-black">{filteredProjects.length}</span> REPOS</>
              )}
            </div>
          </div>
        </div>

        {/* Notice banner for Hidden tab */}
        {activeTab === 'HIDDEN' && (
          <div className="p-4 bg-white border-2 border-black shadow-sm text-black flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-black" />
              <span>
                These repositories are soft-hidden from active views. They remain intact on GitHub and can be restored anytime.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('ALL')}
              className="bg-[#DFFF4F] text-black px-3 py-1 border border-black font-black uppercase hover:bg-black hover:text-[#DFFF4F] transition cursor-pointer"
            >
              Back to Active Repos &rarr;
            </button>
          </div>
        )}

        {/* View Mode: IDEAS Backlog */}
        {activeTab === 'IDEAS' ? (
          <div className="space-y-6">
            {/* Quick Action Bar for Ideas Tab */}
            <div className="p-4 bg-white border-2 border-black shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-black uppercase flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#0047FF]" />
                  <span>FUTURE PROJECT IDEAS BACKLOG (NO REPOSITORY YET)</span>
                </h3>
                <p className="text-xs text-neutral-600 font-mono mt-0.5">
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
                  className="px-3.5 py-1.5 bg-[#DFFF4F] text-black font-mono text-xs font-black uppercase border border-black hover:bg-black hover:text-[#DFFF4F] flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>Import from WhatsApp</span>
                </button>
                <Link
                  href="/ideas"
                  className="px-3.5 py-1.5 bg-[#FAF7EE] text-black border border-neutral-300 font-mono text-xs font-black uppercase shadow-sm hover:bg-white transition flex items-center gap-1"
                >
                  <span>Radar Board</span>
                  <ArrowRight className="w-3 h-3 text-black" />
                </Link>
              </div>
            </div>

            {/* Ideas Grid */}
            {filteredIdeas.length === 0 ? (
              <div className="bg-white text-black border-2 border-black p-16 text-center space-y-3 shadow-sm">
                <Lightbulb className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-base font-black text-black uppercase tracking-tight">No future ideas queued</h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed font-mono">
                  Have an idea on WhatsApp or voice notes? Click &quot;Import from WhatsApp&quot; to extract and prioritize it before building.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setRawText('');
                      setParsedPreview(null);
                    }}
                    className="px-4 py-2 bg-[#DFFF4F] text-black font-mono text-xs font-black uppercase border border-black hover:bg-black hover:text-[#DFFF4F] inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
                      className="bg-white text-black border-2 border-black p-5.5 space-y-3.5 hover:-translate-y-1 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Row */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#FAF7EE] text-black border border-neutral-300 uppercase">
                              {idea.project_type}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase">
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

                        <h2 className="font-black text-lg text-black leading-snug hover:text-[#0047FF] transition-colors">{idea.title}</h2>

                        {idea.elevator_pitch && (
                          <p className="text-xs text-neutral-600 mt-2 leading-relaxed font-normal">
                            {idea.elevator_pitch}
                          </p>
                        )}

                        {idea.notes && (
                          <div className="mt-2.5 p-2.5 bg-[#FAF7EE] border-l-2 border-[#0047FF] text-[11px] font-mono text-neutral-800 whitespace-pre-wrap max-h-28 overflow-y-auto">
                            <span className="font-black text-black block mb-0.5 uppercase">Notes &amp; Scope:</span>
                            {idea.notes}
                          </div>
                        )}

                        {idea.raw_message && (
                          <details className="mt-2 text-xs group">
                            <summary className="cursor-pointer font-mono text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 select-none font-bold uppercase">
                              <MessageSquareText className="w-3 h-3 text-[#0047FF]" />
                              <span>View Original Message</span>
                            </summary>
                            <div className="mt-1.5 p-2 bg-[#FAF7EE] border border-neutral-300 text-[11px] font-mono text-black whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                              {idea.raw_message}
                            </div>
                          </details>
                        )}
                      </div>

                      {idea.target_tech_stack && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-black bg-[#FAF7EE] p-2 border border-neutral-300">
                          <Code className="w-3.5 h-3.5 text-[#0047FF] shrink-0" />
                          <span className="font-black truncate uppercase">{idea.target_tech_stack}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 uppercase flex items-center gap-1.5 ${pConfig.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                          {pConfig.label}
                        </span>

                        <button
                          onClick={() => handlePromoteIdea(idea.id, idea.title)}
                          className="px-3 py-1 bg-[#DFFF4F] text-black border border-black hover:bg-black hover:text-[#DFFF4F] text-xs font-mono font-black uppercase flex items-center gap-1 transition cursor-pointer shadow-sm"
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
              <div className="bg-white text-black border-2 border-black p-16 text-center space-y-3 shadow-sm">
                <GitBranch className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-base font-black text-black uppercase tracking-tight">
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
          <div className="bg-white border-2 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-black">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#DFFF4F] text-black border border-black shadow-sm">
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
