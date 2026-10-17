'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  const { user, loading: authLoading, isAuthenticated } = useAuth();

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
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
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
        description: newDescription.trim() || undefined,
        status: 'BACKLOG',
      });
      setNewTitle('');
      setNewDescription('');
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

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Content: Full Blue Page with Compact Functional Header */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-32 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-1">
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

        {/* Project Header Card (Clean White Panel on Full Blue Canvas) */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-6 sm:p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0038FF] pulse-blue" />
                <span className="text-[11px] font-mono text-[#0038FF] uppercase tracking-widest font-black">
                  AI CODE INTELLIGENCE &amp; REVIEW MATRIX
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight flex items-center gap-3 flex-wrap">
                <span>{project.name}</span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  {project.project_type}
                </span>
              </h1>

              {project.goal && (
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed font-normal">
                  <span className="text-[#0038FF] font-mono text-xs mr-1.5 font-bold">Target:</span>
                  {project.goal}
                </p>
              )}
            </div>

            {/* Review Telemetry Badges */}
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Critical Issues</div>
                <div className="text-2xl font-black text-slate-950 num-tabular mt-0.5">0</div>
                <div className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Clean
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Suggestions</div>
                <div className="text-2xl font-black text-[#0038FF] num-tabular mt-0.5">
                  {aiSuggestions.length || 4}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Optimizations</div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Velocity</div>
                <div className="text-2xl font-black text-[#7020DD] num-tabular mt-0.5">
                  {project.progress_percentage}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Weighted</div>
              </div>
            </div>
          </div>

          {/* Velocity Progress Track */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-slate-500 text-[11px] font-bold">
                Delivery Velocity ({project.completed_features}/{project.total_features} features completed)
              </span>
              <span className="font-bold text-xs text-slate-950 num-tabular">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0038FF] via-lime-500 to-[#7020DD] transition-all duration-700 shadow-md"
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Feature Bar */}
        <div className="bg-white text-slate-900 border border-white/20 shadow-2xl p-4 rounded-2xl">
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
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF20] pulse-lime" />
                <span className="font-black text-white uppercase tracking-wider">Backlog</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-black font-mono">
                {backlogFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {backlogFeatures.length === 0 ? (
                <div className="bg-white/10 border border-white/15 p-8 text-center text-xs text-white/60 font-mono rounded-2xl backdrop-blur-md">
                  No tasks in backlog.
                </div>
              ) : (
                backlogFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="bg-white text-slate-900 border border-white/20 shadow-xl p-4 space-y-3 hover:translate-y-[-2px] transition-all rounded-2xl">
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
                <span className="font-black text-white uppercase tracking-wider">In Progress</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-black font-mono">
                {inProgressFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressFeatures.length === 0 ? (
                <div className="bg-white/10 border border-white/15 p-8 text-center text-xs text-white/60 font-mono rounded-2xl backdrop-blur-md">
                  Zero tasks active. Ready to pull from backlog.
                </div>
              ) : (
                inProgressFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="bg-white text-slate-900 border border-white/20 shadow-xl p-4 space-y-3 hover:translate-y-[-2px] transition-all rounded-2xl">
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
                <span className="w-2.5 h-2.5 rounded-full bg-purple-300" />
                <span className="font-black text-white uppercase tracking-wider">Shipped / Merged</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-black font-mono">
                {doneFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneFeatures.length === 0 ? (
                <div className="bg-white/10 border border-white/15 p-8 text-center text-xs text-white/60 font-mono rounded-2xl backdrop-blur-md">
                  Completed deliverables will appear here.
                </div>
              ) : (
                doneFeatures.map((f) => (
                  <div key={f.id} className="bg-white/90 text-slate-900 border border-white/20 shadow-md p-4 space-y-2 rounded-2xl opacity-90">
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

      {/* AI Feature Suggestions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
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
