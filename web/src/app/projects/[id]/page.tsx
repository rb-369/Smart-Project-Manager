'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectDetail, Feature, FeaturePriority, FeatureStatus, SuggestedFeature } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
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
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-xs text-[#94a3b8] font-mono animate-pulse">
        Hydrating project telemetry...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#08090d] p-8 text-center text-rose-400 font-mono text-xs">
        {error || 'Project not found.'}
      </div>
    );
  }

  const priorityStyles: Record<string, string> = {
    P0: 'bg-rose-500/10 text-rose-400 border-rose-500/30 glow-rose',
    P1: 'bg-amber-500/10 text-amber-400 border-amber-500/30 glow-amber',
    P2: 'bg-sky-500/10 text-sky-400 border-sky-500/30 glow-blue',
    P3: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
          </button>

          {/* Project Header Bento Box */}
          <div className="bento-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#a5b4fc] border border-white/[0.08]">
                    {project.project_type}
                  </span>
                  <span className="text-xs text-[#94a3b8] flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                {project.description && (
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed max-w-2xl">{project.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {project.html_url && (
                  <a
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#cbd5e1] border border-white/[0.08] transition shadow-inner"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Repository
                  </a>
                )}
                <button
                  onClick={handleFetchAiSuggestions}
                  className="bento-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> AI Strategist
                </button>
              </div>
            </div>

            {/* Target Goal Banner */}
            {project.goal && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">Target Objective</p>
                  <p className="text-xs text-[#e2e8f0] mt-0.5 font-medium leading-relaxed">{project.goal}</p>
                </div>
              </div>
            )}

            {/* Precision Weighted Progress Meter */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#94a3b8]">
                  Priority-Weighted Progress ({project.completed_features}/{project.total_features} features completed)
                </span>
                <span className="font-mono font-bold text-sm text-[#f8fafc] num-tabular">
                  {project.progress_percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#171a27] rounded-full overflow-hidden p-px">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.progress_percentage === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 glow-emerald'
                      : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                  }`}
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Add Feature Form */}
          <form onSubmit={handleAddFeature} className="bento-card p-4 space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">Add Feature to Backlog</p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Feature title (e.g. Implement Webhook Dispatcher)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none transition shadow-inner font-sans"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-2.5 py-2 text-xs text-[#cbd5e1] focus:outline-none cursor-pointer font-mono"
              >
                <option value="P0">P0 (Critical / 4x Weight)</option>
                <option value="P1">P1 (High / 3x Weight)</option>
                <option value="P2">P2 (Medium / 2x Weight)</option>
                <option value="P3">P3 (Backlog / 1x Weight)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="bento-btn-primary px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </form>

          {/* Feature List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1 font-mono">
              <span className="font-semibold text-white">Feature Tasks ({project.features.length})</span>
              <span>Weighted Formula: P0=4 &bull; P1=3 &bull; P2=2 &bull; P3=1</span>
            </div>

            {project.features.length === 0 ? (
              <div className="bento-card p-12 text-center text-xs text-[#64748b] font-mono border-dashed">
                No features registered in backlog yet. Add above or trigger the AI Strategist.
              </div>
            ) : (
              <div className="space-y-2">
                {project.features.map((f) => {
                  const isDone = f.status === 'DONE';
                  return (
                    <div
                      key={f.id}
                      className={`bento-card p-3.5 flex items-center justify-between gap-4 transition-all ${
                        isDone ? 'opacity-60 bg-[#0a0c12]/50' : 'hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="mt-0.5 text-[#64748b] hover:text-emerald-400 transition cursor-pointer shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 glow-emerald" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#475569]" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              isDone ? 'line-through text-[#64748b]' : 'text-[#f1f5f9]'
                            }`}
                          >
                            {f.title}
                          </p>
                          {f.description && (
                            <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">{f.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            priorityStyles[f.priority] || 'text-[#94a3b8]'
                          }`}
                        >
                          {f.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-[#64748b] hover:text-rose-400 p-1 rounded transition cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Feature Suggestions Holographic Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bento-card bg-[#0e101a] border border-white/20 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">AI Roadmap Feature Strategist</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[#64748b] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                <p className="text-xs text-[#cbd5e1] font-mono">Synthesizing project goals and codebase trajectory...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiProvider && (
                  <p className="text-[11px] font-mono text-[#94a3b8]">
                    Inference Cascade: <span className="text-indigo-300 uppercase font-semibold">{aiProvider}</span>
                  </p>
                )}
                {aiSuggestions.map((f, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            priorityStyles[f.priority]
                          }`}
                        >
                          {f.priority}
                        </span>
                        <p className="text-xs font-semibold text-white">{f.title}</p>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] leading-relaxed">{f.description}</p>
                      {f.rationale && (
                        <p className="text-[11px] text-indigo-300/90 font-mono italic">&bull; {f.rationale}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddAiFeature(f)}
                      className="bento-btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-xs text-[#94a3b8] font-mono animate-pulse">
          Hydrating project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
