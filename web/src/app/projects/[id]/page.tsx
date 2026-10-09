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
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-xs text-[#94a3b8] font-mono animate-pulse">
        Hydrating project telemetry matrix...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#050508] p-8 text-center text-rose-400 font-mono text-xs">
        {error || 'Project not found.'}
      </div>
    );
  }

  const priorityBadges: Record<string, { label: string; bg: string; dot: string }> = {
    P0: { label: 'HIGH', bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300', dot: 'bg-rose-400 glow-rose' },
    P1: { label: 'HIGH', bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300', dot: 'bg-rose-400 glow-rose' },
    P2: { label: 'MEDIUM', bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300', dot: 'bg-amber-400 glow-amber' },
    P3: { label: 'LOW', bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', dot: 'bg-emerald-400 glow-emerald' },
  };

  // Group features into Kanban categories
  const backlogFeatures = project.features.filter((f) => f.status === 'BACKLOG' || !f.status);
  const inProgressFeatures = project.features.filter((f) => f.status === 'IN_PROGRESS');
  const doneFeatures = project.features.filter((f) => f.status === 'DONE');

  return (
    <div className="min-h-screen bg-[#050508] text-[#f8fafc] relative overflow-hidden flex flex-col">
      {/* Ambient Optical Glow Orbs */}
      <div className="liquid-glow-orb-purple -top-40 left-1/4" />
      <div className="liquid-glow-orb-cyan top-48 -right-40" />
      <div className="liquid-glow-orb-emerald -bottom-20 left-1/3" />
      <div className="liquid-glow-orb-magenta bottom-96 -left-32" />

      {/* Floating Island Navigation */}
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-7">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
          </button>

          <div className="flex items-center gap-3">
            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-pill-btn !py-1.5 !px-3 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>GitHub Repo</span>
              </a>
            )}
            <button
              onClick={handleFetchAiSuggestions}
              className="glass-pill-btn !py-1.5 !px-4 text-xs font-semibold bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>AI Strategist</span>
            </button>
          </div>
        </div>

        {/* ==================================================================
            REFERENCE B: AI CODE REVIEW & HEALTH SUMMARY GLASS BANNER
            ================================================================== */}
        <div className="glass-shell">
          <div className="glass-core p-6 bg-gradient-to-r from-violet-950/25 via-cyan-950/20 to-emerald-950/25">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
                  <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest font-semibold">
                    AI Code Intelligence & Review Matrix
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <span>{project.name}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#cbd5e1] border border-white/[0.1]">
                    {project.project_type}
                  </span>
                </h1>
                {project.goal && (
                  <p className="text-xs text-[#cbd5e1] mt-1.5 max-w-2xl leading-relaxed">
                    <span className="text-cyan-400 font-mono text-[11px] mr-1.5 font-semibold">Target:</span>
                    {project.goal}
                  </p>
                )}
              </div>

              {/* Review Telemetry Badges */}
              <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6">
                <div>
                  <div className="text-[10px] font-mono text-[#94a3b8] uppercase">Critical Issues</div>
                  <div className="text-2xl font-extrabold text-white num-tabular mt-0.5">0</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
                    Clean
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-[#94a3b8] uppercase">Suggestions</div>
                  <div className="text-2xl font-extrabold text-cyan-300 num-tabular mt-0.5">
                    {aiSuggestions.length || 4}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">Optimizations</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-[#94a3b8] uppercase">Velocity</div>
                  <div className="text-2xl font-extrabold text-emerald-300 num-tabular mt-0.5">
                    {project.progress_percentage}%
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">Weighted</div>
                </div>
              </div>
            </div>

            {/* Velocity Progress Track */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#94a3b8] text-[11px] font-mono">
                  Delivery Velocity ({project.completed_features}/{project.total_features} features completed)
                </span>
                <span className="font-mono font-bold text-xs text-white num-tabular">
                  {project.progress_percentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-px border border-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-700 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Feature Bar */}
        <div className="glass-shell">
          <form onSubmit={handleAddFeature} className="glass-core p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Register deliverable or task (e.g. Implement Webhook Dispatcher)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none transition shadow-inner"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-full px-4 py-2 text-xs text-[#cbd5e1] focus:outline-none cursor-pointer font-mono"
              >
                <option value="P0" className="bg-[#0e1017]">P0 (Critical / 4x)</option>
                <option value="P1" className="bg-[#0e1017]">P1 (High / 3x)</option>
                <option value="P2" className="bg-[#0e1017]">P2 (Medium / 2x)</option>
                <option value="P3" className="bg-[#0e1017]">P3 (Low / 1x)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="glass-pill-btn !py-2 !px-5 text-xs font-semibold bg-white/[0.1] hover:bg-white/[0.18]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================================
            REFERENCE B: KANBAN COLUMNS (BACKLOG, IN PROGRESS, DONE)
            ================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: BACKLOG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 glow-violet" />
                <span className="font-semibold text-white uppercase tracking-wider">Backlog</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[#94a3b8] text-[10px]">
                {backlogFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {backlogFeatures.length === 0 ? (
                <div className="glass-shell">
                  <div className="glass-core p-8 text-center text-xs text-[#64748b] font-mono">
                    No tasks in backlog.
                  </div>
                </div>
              ) : (
                backlogFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="glass-shell group hover:scale-[1.01] transition-all">
                      <div className="glass-core p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-[#f1f5f9] leading-snug">{f.title}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(f.id)}
                            className="text-[#475569] hover:text-rose-400 transition p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {f.description && (
                          <p className="text-[11px] text-[#94a3b8] leading-relaxed line-clamp-2">
                            {f.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(f)}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer transition flex items-center gap-1"
                          >
                            <span>Mark Done</span>
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS / TRIAGED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan" />
                <span className="font-semibold text-white uppercase tracking-wider">In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[#94a3b8] text-[10px]">
                {inProgressFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressFeatures.length === 0 ? (
                <div className="glass-shell">
                  <div className="glass-core p-8 text-center text-xs text-[#64748b] font-mono">
                    Zero tasks active. Ready to pull from backlog.
                  </div>
                </div>
              ) : (
                inProgressFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="glass-shell group hover:scale-[1.01] transition-all">
                      <div className="glass-core p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-[#f1f5f9] leading-snug">{f.title}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(f.id)}
                            className="text-[#475569] hover:text-rose-400 transition p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(f)}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer transition flex items-center gap-1"
                          >
                            <span>Mark Done</span>
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </div>
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
                <span className="w-2 h-2 rounded-full bg-emerald-400 glow-emerald" />
                <span className="font-semibold text-white uppercase tracking-wider">Shipped / Merged</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[#94a3b8] text-[10px]">
                {doneFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneFeatures.length === 0 ? (
                <div className="glass-shell">
                  <div className="glass-core p-8 text-center text-xs text-[#64748b] font-mono">
                    Completed deliverables will appear here.
                  </div>
                </div>
              ) : (
                doneFeatures.map((f) => (
                  <div key={f.id} className="glass-shell opacity-75">
                    <div className="glass-core p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 glow-emerald shrink-0" />
                          <p className="text-xs font-medium text-[#cbd5e1] line-through">{f.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-[#475569] hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                        <span className="text-[10px] font-mono text-emerald-400">Merged</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[10px] font-mono text-[#64748b] hover:text-white transition"
                        >
                          Reopen
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-shell w-full max-w-xl max-h-[85vh] overflow-hidden">
            <div className="glass-core p-6 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
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
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                  <p className="text-xs text-[#cbd5e1] font-mono">Synthesizing project goals and codebase trajectory...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiProvider && (
                    <p className="text-[11px] font-mono text-[#94a3b8]">
                      Inference Cascade: <span className="text-cyan-300 uppercase font-semibold">{aiProvider}</span>
                    </p>
                  )}
                  {aiSuggestions.map((f, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3 hover:border-white/15 transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border bg-cyan-500/10 border-cyan-500/30 text-cyan-300">
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
                        className="glass-pill-btn !py-1 !px-3 text-xs shrink-0 flex items-center gap-1 cursor-pointer"
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
        <div className="min-h-screen bg-[#050508] flex items-center justify-center text-xs text-[#94a3b8] font-mono animate-pulse">
          Hydrating project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}

