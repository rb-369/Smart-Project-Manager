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
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-xs text-[#6e7285] font-mono">
        Loading project metadata...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#090a0f] p-8 text-center text-rose-400 font-mono text-xs">
        {error || 'Project not found.'}
      </div>
    );
  }

  const priorityStyles: Record<string, string> = {
    P0: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    P1: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    P2: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    P3: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f7] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
          {/* Back link */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-[#7c8091] hover:text-[#f4f4f7] transition cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
          </button>

          {/* Project Header Overview */}
          <div className="craft-panel p-5 rounded-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161722] text-[#8b8f9e] border border-[#222433]">
                    {project.project_type}
                  </span>
                  <span className="text-xs text-[#8b8f9e] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <h1 className="text-xl font-semibold text-[#f4f4f7] tracking-tight">{project.name}</h1>
                {project.description && (
                  <p className="text-xs text-[#7c8091] mt-1 leading-relaxed max-w-2xl">{project.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {project.html_url && (
                  <a
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#13151f] hover:bg-[#1c1e2c] text-[#c5c8d6] border border-[#262838] transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Repository
                  </a>
                )}
                <button
                  onClick={handleFetchAiSuggestions}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-sm transition cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" /> AI Strategist
                </button>
              </div>
            </div>

            {/* Target Objective banner if set */}
            {project.goal && (
              <div className="p-3 rounded-md bg-[#14151e] border border-[#1e202c] text-xs text-[#a0a4b5]">
                <span className="text-[#64687a] font-medium mr-2">Target Objective:</span>
                <span>{project.goal}</span>
              </div>
            )}

            {/* Precision Progress Track */}
            <div className="pt-1">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#64687a]">
                  Weighted Progress ({project.completed_features}/{project.total_features} features completed)
                </span>
                <span className="font-mono font-semibold text-xs text-[#f4f4f7] num-tabular">
                  {project.progress_percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#1b1c26] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    project.progress_percentage === 100
                      ? 'bg-emerald-400'
                      : project.progress_percentage > 50
                      ? 'bg-blue-500'
                      : 'bg-[#4b5563]'
                  }`}
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Add Feature Form */}
          <form onSubmit={handleAddFeature} className="craft-panel p-3.5 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="New feature title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-[#0f1016] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] placeholder-[#555866] focus:outline-none focus:border-blue-500 transition"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-[#0f1016] border border-[#222433] rounded-md px-2.5 py-1.5 text-xs text-[#c5c8d6] focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="P0">P0 (Critical / Blocker)</option>
                <option value="P1">P1 (High Priority)</option>
                <option value="P2">P2 (Medium Priority)</option>
                <option value="P3">P3 (Backlog / Polish)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#181a24] hover:bg-[#202330] text-[#e2e4eb] border border-[#2c3044] flex items-center justify-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </form>

          {/* Feature List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6e7285] px-1 font-mono">
              <span>Backlog ({project.features.length})</span>
              <span>Weights: P0=4 &bull; P1=3 &bull; P2=2 &bull; P3=1</span>
            </div>

            {project.features.length === 0 ? (
              <div className="py-12 text-center rounded-lg border border-dashed border-[#222433] text-xs text-[#6e7285]">
                No features added yet. Add a feature above or trigger the AI Strategist.
              </div>
            ) : (
              <div className="space-y-1.5">
                {project.features.map((f) => {
                  const isDone = f.status === 'DONE';
                  return (
                    <div
                      key={f.id}
                      className={`p-3 rounded-lg border transition flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-[#0e0f14] border-[#1a1b24] opacity-60'
                          : 'bg-[#111218] border-[#202230] hover:border-[#2e3144]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="mt-0.5 text-[#555866] hover:text-emerald-400 transition cursor-pointer shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#444759]" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              isDone ? 'line-through text-[#64687a]' : 'text-[#f4f4f7]'
                            }`}
                          >
                            {f.title}
                          </p>
                          {f.description && (
                            <p className="text-[11px] text-[#6b6f80] mt-0.5 leading-relaxed">{f.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                            priorityStyles[f.priority] || 'text-[#8b8f9e]'
                          }`}
                        >
                          {f.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-[#4b4e5e] hover:text-rose-400 p-1 rounded transition cursor-pointer"
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

      {/* AI Feature Suggestions Drawer / Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#111218] border border-[#252838] rounded-lg w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1d28] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-[#f4f4f7]">AI Recommended Next Features</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[#64687a] hover:text-white transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mb-2" />
                <p className="text-xs text-[#7c8091] font-mono">Synthesizing project roadmap...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiProvider && (
                  <p className="text-[11px] font-mono text-[#64687a]">
                    Engine: <span className="text-[#8b8f9e] uppercase">{aiProvider}</span>
                  </p>
                )}
                {aiSuggestions.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#14151f] border border-[#222433] flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                            priorityStyles[f.priority]
                          }`}
                        >
                          {f.priority}
                        </span>
                        <p className="text-xs font-semibold text-[#f4f4f7]">{f.title}</p>
                      </div>
                      <p className="text-[11px] text-[#7c8091] leading-relaxed">{f.description}</p>
                      {f.rationale && (
                        <p className="text-[11px] text-blue-400/90 font-mono italic">&bull; {f.rationale}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddAiFeature(f)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#1c1e2b] hover:bg-[#25283a] text-[#f4f4f7] border border-[#2e3146] shrink-0 flex items-center gap-1 cursor-pointer transition shadow-sm"
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
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-xs text-[#6e7285] font-mono">
          Loading project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
