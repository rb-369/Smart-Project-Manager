'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectDetail, Feature, FeaturePriority, FeatureStatus, SuggestedFeature } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Trash2,
  Loader2,
  Cpu,
  Target,
  X,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  MoreVertical
} from 'lucide-react';

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New feature input state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<FeaturePriority>('P1');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // AI Feature suggestions modal state
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedFeature[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/projects/${projectId}`);
      setProject(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await api.post(`/projects/${projectId}/features`, {
        title: newTitle.trim(),
        priority: newPriority,
        description: newDescription.trim() || undefined,
        status: 'BACKLOG',
      });
      setNewTitle('');
      setNewDescription('');
      fetchProject();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (feature: Feature) => {
    const nextStatus: FeatureStatus = feature.status === 'DONE' ? 'BACKLOG' : 'DONE';
    try {
      await api.patch(`/features/${feature.id}`, { status: nextStatus });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      await api.delete(`/features/${featureId}`);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchAiSuggestions = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res: any = await api.post(`/ai/suggest-features/${projectId}`);
      setAiSuggestions(res.features || []);
      setAiProvider(res.provider_used || 'ai');
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-grid flex items-center justify-center text-xs text-white font-mono animate-pulse">
        Hydrating project telemetry matrix...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-blue-grid p-8 text-center text-rose-300 font-mono text-xs flex items-center justify-center">
        {error || 'Project not found.'}
      </div>
    );
  }

  const priorityBadges: Record<string, { label: string; bg: string; dot: string }> = {
    P0: { label: 'CRITICAL', bg: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
    P1: { label: 'HIGH', bg: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
    P2: { label: 'MEDIUM', bg: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-600' },
    P3: { label: 'LOW', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  };

  // Group features into Kanban categories
  const backlogFeatures = project.features.filter((f) => f.status === 'BACKLOG' || !f.status);
  const inProgressFeatures = project.features.filter((f) => f.status === 'IN_PROGRESS');
  const doneFeatures = project.features.filter((f) => f.status === 'DONE');

  const tickerItems = [
    `⚡ ${project.name.toUpperCase()} // LIVE REPOSITORY`,
    `⚡ VELOCITY: ${project.progress_percentage}%`,
    `⚡ ${project.completed_features}/${project.total_features} TASKS MERGED`,
    `⚡ MULTI-TIER AI INFERENCE ACTIVE`,
    `⚡ ZERO LAG MILESTONE DELIVERY`
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#C6FF20] selection:text-black">
      
      {/* ====================================================================
          1. TOP HERO: ELECTRIC BLUE BLUEPRINT GRID (Matching Landing Page)
          ==================================================================== */}
      <section className="bg-blue-grid text-white pt-6 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Ambient Vignettes on Blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Island Navigation Header */}
        <Navbar />

        {/* Main Header Container */}
        <div className="max-w-6xl mx-auto relative z-10 pt-20 pb-6 space-y-6">
          
          {/* Breadcrumb Navigation & Top Actions */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs font-mono font-bold text-white/80 hover:text-white transition-colors cursor-pointer bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
            </button>

            <div className="flex items-center gap-3">
              {project.html_url && (
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-mono font-bold border border-white/25 bg-white/10 hover:bg-white/20 text-white rounded-full transition backdrop-blur-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub Repo</span>
                </a>
              )}
              <button
                onClick={handleFetchAiSuggestions}
                className="btn-lime !py-1.5 !px-4 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>AI Strategist</span>
              </button>
            </div>
          </div>

          {/* Project Identity & Telemetry Strip */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
                  <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                    AI CODE INTELLIGENCE &amp; REVIEW MATRIX
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
                  <span>{project.name}</span>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 font-bold">
                    {project.project_type}
                  </span>
                </h1>

                {project.goal && (
                  <p className="text-xs sm:text-sm text-white/90 mt-2 max-w-2xl leading-relaxed font-normal">
                    <span className="text-[#C6FF20] font-mono text-xs mr-1.5 font-bold">Target:</span>
                    {project.goal}
                  </p>
                )}
              </div>

              {/* Review Telemetry Badges */}
              <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
                <div>
                  <div className="text-[10px] font-mono text-white/70 uppercase font-bold">Critical Issues</div>
                  <div className="text-2xl font-black text-white num-tabular mt-0.5">0</div>
                  <div className="text-[10px] text-[#C6FF20] font-mono font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20]" />
                    Clean
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-white/70 uppercase font-bold">Suggestions</div>
                  <div className="text-2xl font-black text-white num-tabular mt-0.5">
                    {aiSuggestions.length || 4}
                  </div>
                  <div className="text-[10px] text-white/70 font-mono mt-0.5">Optimizations</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-white/70 uppercase font-bold">Velocity</div>
                  <div className="text-2xl font-black text-[#C6FF20] num-tabular mt-0.5">
                    {project.progress_percentage}%
                  </div>
                  <div className="text-[10px] text-white/70 font-mono mt-0.5">Weighted</div>
                </div>
              </div>
            </div>

            {/* Velocity Progress Track */}
            <div className="mt-6 pt-4 border-t border-white/15">
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span className="text-white/80 text-[11px]">
                  Delivery Velocity ({project.completed_features}/{project.total_features} features completed)
                </span>
                <span className="font-bold text-xs text-[#C6FF20] num-tabular">
                  {project.progress_percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C6FF20] to-[#0038FF] transition-all duration-700 shadow-md"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          2. ACID LIME TICKER MARQUEE TAPE
          ==================================================================== */}
      <div className="w-full bg-[#C6FF20] text-black font-mono font-black text-xs sm:text-sm uppercase py-3 tracking-wider border-y-2 border-black/15 overflow-hidden select-none relative z-30 shadow-lg">
        <div className="animate-marquee gap-8">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 font-bold text-lg">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. CLEAN BRIGHT WHITE CURVED SHEET (Kanban Workspace)
          ==================================================================== */}
      <main className="bg-white text-slate-900 rounded-t-[44px] sm:rounded-t-[60px] -mt-6 relative z-20 shadow-2xl pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        
        {/* Quick Add Feature Bar */}
        <div className="gridster-panel p-4 bg-white border border-slate-200/90 shadow-md rounded-2xl">
          <form onSubmit={handleAddFeature}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Register deliverable or task (e.g. Implement Webhook Dispatcher)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner font-normal"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-full px-4 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-mono font-bold"
              >
                <option value="P0" className="bg-white text-slate-900">P0 (Critical / 4x)</option>
                <option value="P1" className="bg-white text-slate-900">P1 (High / 3x)</option>
                <option value="P2" className="bg-white text-slate-900">P2 (Medium / 2x)</option>
                <option value="P3" className="bg-white text-slate-900">P3 (Low / 1x)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="btn-lime !py-2.5 !px-6 text-xs font-black rounded-full flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </form>
        </div>

        {/* KANBAN COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: BACKLOG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0038FF]" />
                <span className="font-black text-slate-950 uppercase tracking-wider">Backlog</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black font-mono">
                {backlogFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {backlogFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-2xl">
                  No tasks in backlog.
                </div>
              ) : (
                backlogFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="gridster-panel p-4 space-y-3 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black text-slate-900 leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {f.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {f.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-[#0038FF] hover:underline cursor-pointer font-bold transition flex items-center gap-1"
                        >
                          <span>Mark Done</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF20]" />
                <span className="font-black text-slate-950 uppercase tracking-wider">In Progress</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black font-mono">
                {inProgressFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-2xl">
                  Zero tasks active. Ready to pull from backlog.
                </div>
              ) : (
                inProgressFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="gridster-panel p-4 space-y-3 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black text-slate-900 leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-[#0038FF] hover:underline cursor-pointer font-bold transition flex items-center gap-1"
                        >
                          <span>Mark Done</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: DONE / SHIPPED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7020DD]" />
                <span className="font-black text-slate-950 uppercase tracking-wider">Shipped / Merged</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black font-mono">
                {doneFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-2xl">
                  Completed deliverables will appear here.
                </div>
              ) : (
                doneFeatures.map((f) => (
                  <div key={f.id} className="gridster-panel p-4 space-y-2 bg-slate-50 border border-slate-200 rounded-2xl opacity-80">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-xs font-bold text-slate-500 line-through">{f.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(f.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-mono text-emerald-600 font-black">MERGED</span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(f)}
                        className="text-[10px] font-mono text-slate-500 hover:text-slate-900 transition cursor-pointer font-bold"
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* AI Feature Suggestions Holographic Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden">
            <div className="p-6 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0038FF]" />
                  <h3 className="font-black text-sm text-slate-900 uppercase">AI Roadmap Feature Strategist</h3>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiLoading ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0038FF] mb-2" />
                  <p className="text-xs text-slate-500 font-mono">Synthesizing project goals and codebase trajectory...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiProvider && (
                    <p className="text-[11px] font-mono text-slate-500 font-bold">
                      Inference Cascade: <span className="text-[#0038FF] uppercase">{aiProvider}</span>
                    </p>
                  )}
                  {aiSuggestions.map((f, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-3 hover:border-[#0038FF] transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-[#0038FF]">
                            {f.priority}
                          </span>
                          <p className="text-xs font-black text-slate-900">{f.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">{f.description}</p>
                        {f.rationale && (
                          <p className="text-[11px] text-purple-700 font-mono italic">&bull; {f.rationale}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddAiFeature(f)}
                        className="btn-lime !py-1 !px-3 text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-blue-grid flex items-center justify-center text-xs text-white font-mono animate-pulse">
          Hydrating project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
