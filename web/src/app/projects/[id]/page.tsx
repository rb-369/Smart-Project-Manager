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
  Clock,
  Sparkles,
  Trash2,
  Loader2,
  Check,
  Target,
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

  const handleAddAiFeature = async (f: SuggestedFeature) => {
    try {
      await api.post(`/projects/${projectId}/features`, {
        title: f.title,
        priority: f.priority,
        description: f.description,
        status: 'BACKLOG',
      });
      setAiSuggestions((prev) => prev.filter((item) => item.title !== f.title));
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-xs text-slate-400">
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0b0f19] p-8 text-center text-red-400">
        {error || 'Project not found.'}
      </div>
    );
  }

  const priorityWeights = { P0: 'bg-red-950/60 text-red-300 border-red-800/40', P1: 'bg-amber-950/60 text-amber-300 border-amber-800/40', P2: 'bg-blue-950/60 text-blue-300 border-blue-800/40', P3: 'bg-slate-800 text-slate-400' };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 max-w-5xl mx-auto space-y-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>

          {/* Project Header */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                    {project.project_type}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">{project.name}</h1>
                {project.description && <p className="text-xs text-slate-400 mt-1">{project.description}</p>}
              </div>

              <div className="flex items-center gap-3">
                {project.html_url && (
                  <a
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View GitHub
                  </a>
                )}
                <button
                  onClick={handleFetchAiSuggestions}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> AI Feature Strategist
                </button>
              </div>
            </div>

            {/* Goal Banner */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Target className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">Project Objective</p>
                <p className="text-xs text-slate-200 mt-0.5 font-medium">{project.goal || 'No goal set yet.'}</p>
              </div>
            </div>

            {/* Progress Gauge */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400 font-medium">
                  Priority-Weighted Progress ({project.completed_features}/{project.total_features} features completed)
                </span>
                <span className="font-extrabold text-sm text-emerald-400">{project.progress_percentage}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Add Feature Form */}
          <form onSubmit={handleAddFeature} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">Add Feature to Backlog</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Feature title (e.g. Implement Webhooks)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="P0">P0 (Critical / Blocker)</option>
                <option value="P1">P1 (High Priority)</option>
                <option value="P2">P2 (Medium Priority)</option>
                <option value="P3">P3 (Nice to Have)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </form>

          {/* Feature List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300">Feature Backlog & Tasks ({project.features.length})</h2>

            {project.features.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                No features added yet. Add one above or click "AI Feature Strategist".
              </div>
            ) : (
              <div className="space-y-2">
                {project.features.map((f) => {
                  const isDone = f.status === 'DONE';
                  return (
                    <div
                      key={f.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {f.title}
                          </p>
                          {f.description && <p className="text-[11px] text-slate-500 mt-0.5">{f.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityWeights[f.priority]}`}>
                          {f.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
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

      {/* AI Feature Suggestions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">AI Next Feature Recommendations</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                <p className="text-xs text-slate-300">Analyzing goal and completed tasks...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiProvider && (
                  <p className="text-[10px] text-slate-400 mb-2">Powered by: <span className="font-bold uppercase text-slate-200">{aiProvider}</span></p>
                )}
                {aiSuggestions.map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${priorityWeights[f.priority]}`}>
                          {f.priority}
                        </span>
                        <p className="text-xs font-bold text-slate-200">{f.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-1">{f.description}</p>
                      <p className="text-[10px] text-indigo-300 italic font-medium">&ldquo;{f.rationale}&rdquo;</p>
                    </div>
                    <button
                      onClick={() => handleAddAiFeature(f)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1 cursor-pointer transition shadow"
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
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-xs text-slate-400">
          Loading project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
