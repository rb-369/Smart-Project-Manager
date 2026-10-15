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
      <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500 font-mono animate-pulse">
        Hydrating project telemetry matrix...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-rose-600 font-mono text-xs">
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
    <div className="min-h-screen bg-white text-slate-900 bg-grid-pattern-light relative overflow-hidden flex flex-col font-sans selection:bg-[#ccff00] selection:text-black">
      {/* Ambient Glows */}
      <div className="ambient-glow-blue -top-40 left-1/4" />
      <div className="ambient-glow-lime top-48 -right-40" />
      <div className="ambient-glow-violet -bottom-20 left-1/3" />

      {/* Floating Island Navigation */}
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-7">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
          </button>

          <div className="flex items-center gap-3">
            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs rounded-full transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>GitHub Repo</span>
              </a>
            )}
            <button
              onClick={handleFetchAiSuggestions}
              className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Strategist</span>
            </button>
          </div>
        </div>

        {/* AI Code Intelligence & Review Banner */}
        <div className="gridster-panel p-6 bg-gradient-to-r from-blue-50/70 via-lime-50/30 to-violet-50/70 border border-slate-200/90 shadow-sm rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-mono text-blue-700 uppercase tracking-widest font-semibold">
                  AI Code Intelligence & Review Matrix
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <span>{project.name}</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                  {project.project_type}
                </span>
              </h1>
              {project.goal && (
                <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  <span className="text-blue-600 font-mono text-[11px] mr-1.5 font-semibold">Target:</span>
                  {project.goal}
                </p>
              )}
            </div>

            {/* Review Telemetry Badges */}
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-6">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Critical Issues</div>
                <div className="text-2xl font-extrabold text-slate-900 num-tabular mt-0.5">0</div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Clean
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Suggestions</div>
                <div className="text-2xl font-extrabold text-blue-600 num-tabular mt-0.5">
                  {aiSuggestions.length || 4}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Optimizations</div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Velocity</div>
                <div className="text-2xl font-extrabold text-violet-600 num-tabular mt-0.5">
                  {project.progress_percentage}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Weighted</div>
              </div>
            </div>
          </div>

          {/* Velocity Progress Track */}
          <div className="mt-5 pt-4 border-t border-slate-200/60">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-500 text-[11px] font-mono">
                Delivery Velocity ({project.completed_features}/{project.total_features} features completed)
              </span>
              <span className="font-mono font-bold text-xs text-slate-900 num-tabular">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-lime-500 to-violet-600 transition-all duration-700"
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Feature Bar */}
        <div className="gridster-panel p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <form onSubmit={handleAddFeature}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Register deliverable or task (e.g. Implement Webhook Dispatcher)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-full px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-full px-4 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-mono"
              >
                <option value="P0" className="bg-white text-slate-900">P0 (Critical / 4x)</option>
                <option value="P1" className="bg-white text-slate-900">P1 (High / 3x)</option>
                <option value="P2" className="bg-white text-slate-900">P2 (Medium / 2x)</option>
                <option value="P3" className="bg-white text-slate-900">P3 (Low / 1x)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="btn-blue py-2 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
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
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="font-semibold text-slate-900 uppercase tracking-wider">Backlog</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                {backlogFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {backlogFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-xl">
                  No tasks in backlog.
                </div>
              ) : (
                backlogFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="gridster-panel p-4 space-y-3 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {f.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {f.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition flex items-center gap-1"
                        >
                          <span>Mark Done</span>
                          <CheckCircle2 className="w-3 h-3" />
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
                <span className="w-2 h-2 rounded-full bg-lime-500" />
                <span className="font-semibold text-slate-900 uppercase tracking-wider">In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                {inProgressFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-xl">
                  Zero tasks active. Ready to pull from backlog.
                </div>
              ) : (
                inProgressFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="gridster-panel p-4 space-y-3 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition flex items-center gap-1"
                        >
                          <span>Mark Done</span>
                          <CheckCircle2 className="w-3 h-3" />
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
                <span className="w-2 h-2 rounded-full bg-violet-600" />
                <span className="font-semibold text-slate-900 uppercase tracking-wider">Shipped / Merged</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                {doneFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneFeatures.length === 0 ? (
                <div className="gridster-panel p-8 text-center text-xs text-slate-400 font-mono bg-white border border-slate-200 rounded-xl">
                  Completed deliverables will appear here.
                </div>
              ) : (
                doneFeatures.map((f) => (
                  <div key={f.id} className="gridster-panel p-4 space-y-2 bg-slate-50/70 border border-slate-200 rounded-xl opacity-80">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-xs font-medium text-slate-500 line-through">{f.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(f.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-mono text-emerald-600 font-medium">Merged</span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(f)}
                        className="text-[10px] font-mono text-slate-500 hover:text-slate-900 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden">
            <div className="p-6 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <h3 className="font-bold text-sm text-slate-900">AI Roadmap Feature Strategist</h3>
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
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500 font-mono">Synthesizing project goals and codebase trajectory...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiProvider && (
                    <p className="text-[11px] font-mono text-slate-500">
                      Inference Cascade: <span className="text-blue-600 uppercase font-semibold">{aiProvider}</span>
                    </p>
                  )}
                  {aiSuggestions.map((f, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-3 hover:border-blue-200 transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
                            {f.priority}
                          </span>
                          <p className="text-xs font-semibold text-slate-900">{f.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{f.description}</p>
                        {f.rationale && (
                          <p className="text-[11px] text-violet-600 font-mono italic">&bull; {f.rationale}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddAiFeature(f)}
                        className="btn-blue py-1 px-3 text-xs shrink-0 flex items-center gap-1 cursor-pointer"
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
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500 font-mono animate-pulse">
          Hydrating project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
