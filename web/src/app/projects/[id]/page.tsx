'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectDetail, Feature, FeaturePriority, FeatureStatus, SuggestedFeature } from '@/types';
import { Navbar } from '@/components/Navbar';
import { StaticLoader } from '@/components/StaticLoader';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  CheckCircle2,
  Trash2,
  Loader2,
  Cpu,
  X,
  Star,
  Globe,
  EyeOff,
  RotateCcw,
  Check
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

  // Live URL and Project controls state
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [liveUrlInput, setLiveUrlInput] = useState('');
  const [liveUrlSaving, setLiveUrlSaving] = useState(false);

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
      setLiveUrlInput(res.live_url || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!project) return;
    try {
      const updated = await api.toggleStarProject(project.id);
      setProject((prev) => (prev ? { ...prev, is_starred: updated.is_starred } : prev));
    } catch (err: any) {
      console.warn('Unable to toggle star:', err);
    }
  };

  const handleToggleHide = async () => {
    if (!project) return;
    try {
      const updated = await api.toggleHideProject(project.id);
      setProject((prev) => (prev ? { ...prev, is_hidden: updated.is_hidden } : prev));
    } catch (err: any) {
      console.warn('Unable to toggle hide:', err);
    }
  };

  const handleSaveLiveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setLiveUrlSaving(true);
      const updated = await api.updateProjectLiveUrl(project.id, liveUrlInput.trim());
      setProject((prev) => (prev ? { ...prev, live_url: updated.live_url } : prev));
      setIsEditingUrl(false);
    } catch (err: any) {
      console.warn('Unable to update live URL:', err);
    } finally {
      setLiveUrlSaving(false);
    }
  };

  useEffect(() => {
    if (projectId && isAuthenticated) fetchProject();
  }, [projectId, isAuthenticated, user]);

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsAdding(true);
      await api.post(`/projects/${projectId}/features`, {
        title: newTitle.trim(),
        priority: newPriority,
        description: newDescription.trim() || undefined,
        status: 'BACKLOG',
      });
      fetchProject();
      setNewTitle('');
      setNewDescription('');
      setNewPriority('P1');
    } catch (err: any) {
      alert(`Failed to add feature: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (feature: Feature) => {
    const nextStatus: FeatureStatus =
      feature.status === 'DONE' ? 'BACKLOG' : feature.status === 'BACKLOG' ? 'IN_PROGRESS' : 'DONE';

    try {
      await api.patch(`/features/${feature.id}`, { status: nextStatus });
      fetchProject();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to remove this feature?')) return;

    try {
      await api.delete(`/features/${featureId}`);
      fetchProject();
    } catch (err: any) {
      alert(`Failed to delete feature: ${err.message}`);
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
      alert(`Failed to fetch AI suggestions: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiFeature = async (feature: SuggestedFeature) => {
    try {
      await api.post(`/projects/${projectId}/features`, {
        title: feature.title,
        priority: feature.priority,
        description: feature.description,
        status: 'BACKLOG',
      });
      setAiSuggestions((prev) => prev.filter((f) => f.title !== feature.title));
      fetchProject();
    } catch (err: any) {
      alert(`Failed to add feature: ${err.message}`);
    }
  };

  const priorityBadges: Record<FeaturePriority, { bg: string; dot: string; label: string }> = {
    P0: { bg: 'bg-[#FF5533] text-black border-2 border-black', dot: 'bg-black', label: 'P0 IMMEDIATE' },
    P1: { bg: 'bg-amber-300 text-black border-2 border-black', dot: 'bg-black', label: 'P1 HIGH' },
    P2: { bg: 'bg-[#BBF7D0] text-black border-2 border-black', dot: 'bg-black', label: 'P2 MEDIUM' },
    P3: { bg: 'bg-white text-black border-2 border-black', dot: 'bg-black', label: 'P3 LOW' },
  };

  if (loading) {
    return (
      <StaticLoader
        label="HYDRATING PROJECT ROADMAP"
        sublabel="Connecting to isolated repository matrix..."
        fullScreen={true}
      />
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#F6F3EC] text-black flex flex-col justify-center items-center p-4">
        <div className="bg-white border-3 border-black p-8 text-center max-w-md shadow-[8px_8px_0px_#000000] space-y-4">
          <p className="text-black text-sm font-mono font-black uppercase">
            {error || 'Project not found.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 bg-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] transition cursor-pointer"
          >
            &larr; Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const backlogFeatures = project.features.filter((f) => f.status === 'BACKLOG');
  const inProgressFeatures = project.features.filter((f) => f.status === 'IN_PROGRESS');
  const doneFeatures = project.features.filter((f) => f.status === 'DONE');

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-28 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b-2 border-black">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs font-mono font-black uppercase text-black bg-white px-3.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#FAF7EE] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Mission Control
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Star / Main Button */}
            <button
              onClick={handleToggleStar}
              className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-mono font-black uppercase border-2 border-black transition cursor-pointer ${
                project.is_starred
                  ? 'bg-[#DFFF4F] text-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black shadow-[2px_2px_0px_#000000] hover:bg-[#FAF7EE]'
              }`}
              title={project.is_starred ? 'Unstar (unpin)' : 'Star (pin to top)'}
            >
              <Star className={`w-3.5 h-3.5 ${project.is_starred ? 'fill-black' : ''}`} />
              <span>{project.is_starred ? 'Starred Main' : 'Star Repo'}</span>
            </button>

            {/* Live App Launch */}
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-mono font-black uppercase border-2 border-black bg-[#BBF7D0] text-black hover:bg-black hover:text-[#DFFF4F] transition shadow-[2px_2px_0px_#000000]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Launch App</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}

            {/* GitHub Repo Link */}
            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-mono font-black uppercase border-2 border-black bg-white hover:bg-black hover:text-white text-black transition shadow-[2px_2px_0px_#000000]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}

            {/* Soft-Hide / Restore Button */}
            <button
              onClick={handleToggleHide}
              className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-mono font-black uppercase border-2 border-black transition cursor-pointer shadow-[2px_2px_0px_#000000] ${
                project.is_hidden
                  ? 'bg-[#0047FF] text-white hover:bg-black'
                  : 'bg-white text-black hover:bg-rose-50 hover:text-rose-700'
              }`}
              title={project.is_hidden ? 'Restore to active dashboard' : 'Hide from default view'}
            >
              {project.is_hidden ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Repo</span>
                </>
              )}
            </button>

            {/* AI Strategist Button */}
            <button
              onClick={handleFetchAiSuggestions}
              className="py-1.5 px-4 bg-[#DFFF4F] text-black border-2 border-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] cursor-pointer flex items-center gap-1.5 transition"
            >
              <Cpu className="w-3.5 h-3.5 text-black" />
              <span>AI Strategist</span>
            </button>
          </div>
        </div>

        {/* Project Header Card */}
        <div className="bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 bg-[#0047FF] border border-black inline-block" />
                <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest font-black">
                  AI CODE INTELLIGENCE &bull; ROADMAP MATRIX
                </span>
                {project.is_starred && (
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-[#DFFF4F] text-black border border-black flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-black text-black" />
                    <span>MAIN</span>
                  </span>
                )}
                {project.is_hidden && (
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-black text-white border border-black">
                    HIDDEN
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight flex items-center gap-3 flex-wrap">
                <span>{project.name}</span>
                <span className="text-xs font-mono px-3 py-1 bg-black text-[#DFFF4F] border border-black font-black uppercase">
                  {project.project_type}
                </span>
              </h1>

              {/* Live URL Bar */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {project.live_url ? (
                  <div className="flex items-center gap-2 bg-[#BBF7D0] border-2 border-black text-black px-3 py-1 text-xs font-mono font-black shadow-[2px_2px_0px_#000000]">
                    <Globe className="w-3.5 h-3.5 text-black" />
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>{project.live_url}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                    <button
                      onClick={() => setIsEditingUrl(!isEditingUrl)}
                      className="text-black ml-1 uppercase underline cursor-pointer text-[10px]"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingUrl(!isEditingUrl)}
                    className="flex items-center gap-1 text-xs font-mono text-[#0047FF] hover:underline cursor-pointer bg-[#FAF7EE] px-3 py-1 border-2 border-black font-black uppercase shadow-[2px_2px_0px_#000000]"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>+ Add Live Deployed URL (Vercel)</span>
                  </button>
                )}

                {isEditingUrl && (
                  <form onSubmit={handleSaveLiveUrl} className="flex items-center gap-1.5 bg-[#FAF7EE] p-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <input
                      type="url"
                      value={liveUrlInput}
                      onChange={(e) => setLiveUrlInput(e.target.value)}
                      placeholder="https://my-app.vercel.app"
                      className="bg-white border-2 border-black text-black text-xs font-mono px-2 py-1 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={liveUrlSaving}
                      className="px-2.5 py-1 bg-[#0047FF] text-white text-xs font-black border-2 border-black hover:bg-black transition cursor-pointer"
                    >
                      {liveUrlSaving ? '...' : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingUrl(false)}
                      className="p-1 bg-white border-2 border-black text-black hover:bg-neutral-200 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </div>

              {project.goal && (
                <p className="text-xs sm:text-sm text-neutral-800 mt-2 max-w-2xl leading-relaxed font-mono">
                  <span className="text-[#0047FF] font-black uppercase mr-1.5">Target:</span>
                  {project.goal}
                </p>
              )}
            </div>

            {/* Review Telemetry Badges */}
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l-2 border-black pt-4 md:pt-0 md:pl-6 font-mono">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase font-black">Critical Issues</div>
                <div className="text-2xl font-black text-black num-tabular mt-0.5">0</div>
                <div className="text-[10px] text-black font-black uppercase flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#DFFF4F] border border-black" />
                  Clean
                </div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-500 uppercase font-black">Suggestions</div>
                <div className="text-2xl font-black text-[#0047FF] num-tabular mt-0.5">
                  {aiSuggestions.length || 4}
                </div>
                <div className="text-[10px] text-neutral-600 font-bold uppercase mt-0.5">Optimizations</div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-500 uppercase font-black">Velocity</div>
                <div className="text-2xl font-black text-black num-tabular mt-0.5">
                  {project.progress_percentage}%
                </div>
                <div className="text-[10px] text-neutral-600 font-bold uppercase mt-0.5">Weighted</div>
              </div>
            </div>
          </div>

          {/* Velocity Progress Track */}
          <div className="mt-6 pt-4 border-t-2 border-black">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-neutral-700 text-[11px] font-black uppercase tracking-wider">
                Delivery Velocity ({project.completed_features}/{project.total_features} features completed)
              </span>
              <span className="font-black text-xs text-black num-tabular bg-[#DFFF4F] px-1.5 py-0.2 border border-black">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#FAF7EE] border-2 border-black overflow-hidden p-0.5">
              <div
                className="h-full bg-[#0047FF] border-r-2 border-black transition-all duration-700"
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Feature Bar */}
        <div className="bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000000] p-4">
          <form onSubmit={handleAddFeature}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Register deliverable or task (e.g. Implement Webhook Dispatcher)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition font-mono"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as FeaturePriority)}
                className="bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] px-4 py-2 text-xs text-black focus:outline-none cursor-pointer font-mono font-black uppercase"
              >
                <option value="P0">P0 (Critical / 4x)</option>
                <option value="P1">P1 (High / 3x)</option>
                <option value="P2">P2 (Medium / 2x)</option>
                <option value="P3">P3 (Low / 1x)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newTitle.trim()}
                className="py-2.5 px-6 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black font-mono font-black text-xs uppercase flex items-center justify-center gap-1.5 shrink-0 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition"
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
                <span className="w-3 h-3 bg-amber-300 border border-black" />
                <span className="font-black text-black uppercase tracking-wider">Backlog</span>
              </div>
              <span className="px-2.5 py-0.5 bg-white text-black border-2 border-black text-[10px] font-black font-mono shadow-[2px_2px_0px_#000000]">
                {backlogFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {backlogFeatures.length === 0 ? (
                <div className="bg-white border-2 border-black p-8 text-center text-xs text-neutral-500 font-mono shadow-[2px_2px_0px_#000000]">
                  No tasks in backlog.
                </div>
              ) : (
                backlogFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] p-4 space-y-3 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000000] transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black text-black leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {f.description && (
                        <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-2 font-mono">
                          {f.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 uppercase flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-[#0047FF] hover:underline cursor-pointer font-black uppercase transition flex items-center gap-1"
                        >
                          <span>Mark In Progress</span>
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
                <span className="w-3 h-3 bg-[#0047FF] border border-black" />
                <span className="font-black text-black uppercase tracking-wider">In Progress</span>
              </div>
              <span className="px-2.5 py-0.5 bg-white text-black border-2 border-black text-[10px] font-black font-mono shadow-[2px_2px_0px_#000000]">
                {inProgressFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressFeatures.length === 0 ? (
                <div className="bg-white border-2 border-black p-8 text-center text-xs text-neutral-500 font-mono shadow-[2px_2px_0px_#000000]">
                  Zero tasks active. Ready to pull from backlog.
                </div>
              ) : (
                inProgressFeatures.map((f) => {
                  const badge = priorityBadges[f.priority] || priorityBadges['P2'];
                  return (
                    <div key={f.id} className="bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] p-4 space-y-3 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000000] transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black text-black leading-snug">{f.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 uppercase flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(f)}
                          className="text-[11px] font-mono text-[#0047FF] hover:underline cursor-pointer font-black uppercase transition flex items-center gap-1"
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
                <span className="w-3 h-3 bg-[#BBF7D0] border border-black" />
                <span className="font-black text-black uppercase tracking-wider">Shipped / Merged</span>
              </div>
              <span className="px-2.5 py-0.5 bg-white text-black border-2 border-black text-[10px] font-black font-mono shadow-[2px_2px_0px_#000000]">
                {doneFeatures.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneFeatures.length === 0 ? (
                <div className="bg-white border-2 border-black p-8 text-center text-xs text-neutral-500 font-mono shadow-[2px_2px_0px_#000000]">
                  Completed deliverables will appear here.
                </div>
              ) : (
                doneFeatures.map((f) => (
                  <div key={f.id} className="bg-[#FAF7EE] text-black border-2 border-black shadow-[2px_2px_0px_#000000] p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                        <p className="text-xs font-black text-neutral-600 line-through">{f.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(f.id)}
                        className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                      <span className="text-[10px] font-mono text-black font-black uppercase bg-[#BBF7D0] px-1.5 py-0.5 border border-black">
                        MERGED
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(f)}
                        className="text-[10px] font-mono text-neutral-600 hover:text-black transition cursor-pointer font-black uppercase"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-3 border-black shadow-[10px_10px_0px_#000000] w-full max-w-xl max-h-[85vh] overflow-hidden text-black">
            <div className="p-6 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0047FF]" />
                  <h3 className="font-black text-sm text-black uppercase tracking-tight">AI Roadmap Feature Strategist</h3>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1 bg-[#FAF7EE] border border-black hover:bg-black hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiLoading ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0047FF] mb-2" />
                  <p className="text-xs text-black font-mono font-black uppercase">Synthesizing project goals and codebase trajectory...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiProvider && (
                    <p className="text-[11px] font-mono text-neutral-600 font-black uppercase">
                      Inference Cascade: <span className="text-[#0047FF]">{aiProvider}</span>
                    </p>
                  )}
                  {aiSuggestions.map((f, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#FAF7EE] border-2 border-black flex items-start justify-between gap-3 shadow-[2px_2px_0px_#000000]"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 border border-black bg-black text-[#DFFF4F] uppercase">
                            {f.priority}
                          </span>
                          <p className="text-xs font-black text-black">{f.title}</p>
                        </div>
                        <p className="text-[11px] text-neutral-700 leading-relaxed font-mono">{f.description}</p>
                        {f.rationale && (
                          <p className="text-[11px] text-[#0047FF] font-mono font-bold">&bull; {f.rationale}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddAiFeature(f)}
                        className="px-3 py-1 bg-[#DFFF4F] text-black border-2 border-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] shrink-0 flex items-center gap-1 cursor-pointer transition"
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
        <StaticLoader
          label="HYDRATING PROJECT ROADMAP"
          sublabel="Connecting to isolated workspace telemetry..."
          fullScreen={true}
        />
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
