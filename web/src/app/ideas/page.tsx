'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FutureProject, FutureProjectPriority, ProjectType, SuggestedProject } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import {
  Lightbulb,
  Plus,
  ArrowRight,
  Trash2,
  Code,
  Loader2,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<FutureProject[]>([]);
  const [loading, setLoading] = useState(true);

  // New idea form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [techStack, setTechStack] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('RESUME');
  const [priority, setPriority] = useState<FutureProjectPriority>('P1');

  // AI Discover Projects modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedProject[]>([]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/future-projects');
      setIdeas(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/future-projects', {
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority: priority,
      });
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setShowAddModal(false);
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromote = async (id: string) => {
    try {
      await api.post(`/future-projects/${id}/promote`);
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/future-projects/${id}`);
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchAiProjects = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res: any = await api.post('/ai/suggest-projects');
      setAiSuggestions(res.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiProject = async (p: SuggestedProject) => {
    try {
      await api.post('/future-projects', {
        title: p.title,
        elevator_pitch: p.elevator_pitch,
        target_tech_stack: p.target_tech_stack,
        project_type: p.project_type,
        priority: 'P1',
      });
      setAiSuggestions((prev) => prev.filter((item) => item.title !== p.title));
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityStyles: Record<string, string> = {
    P0: 'border-rose-500/30 bg-rose-500/10 text-rose-300 glow-rose',
    P1: 'border-amber-500/30 bg-amber-500/10 text-amber-300 glow-amber',
    P2: 'border-sky-500/30 bg-sky-500/10 text-sky-300 glow-blue',
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto space-y-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400 glow-amber" />
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Future Project Incubator
                </h1>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                Queue and prioritize upcoming project architectures before writing a single commit.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFetchAiProjects}
                className="bento-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                AI Project Ideas
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)] transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Concept
              </button>
            </div>
          </div>

          {/* Ideas Bento Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['P0', 'P1', 'P2'] as const).map((prio) => {
              const columnIdeas = ideas.filter((i) => i.priority === prio && i.status !== 'PROMOTED');
              const columnTitles = {
                P0: 'P0 // Next Immediate Build',
                P1: 'P1 // Upcoming Priority',
                P2: 'P2 // Future Research & Backlog',
              };

              return (
                <div key={prio} className="space-y-3.5">
                  <div className="flex items-center justify-between px-1 text-xs font-mono">
                    <span className="text-[#cbd5e1] font-semibold">{columnTitles[prio]}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94a3b8] border border-white/[0.08]">
                      {columnIdeas.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="bento-card p-4 space-y-3 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#a5b4fc] border border-white/[0.08]">
                              {idea.project_type}
                            </span>
                            <button
                              onClick={() => handleDelete(idea.id)}
                              className="text-[#64748b] hover:text-rose-400 transition-colors p-1"
                              title="Delete idea"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="font-semibold text-sm text-white leading-snug">{idea.title}</h4>
                          {idea.elevator_pitch && (
                            <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">{idea.elevator_pitch}</p>
                          )}
                        </div>

                        {idea.target_tech_stack && (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-[#cbd5e1] bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                            <Code className="w-3.5 h-3.5 text-sky-400" />
                            <span>{idea.target_tech_stack}</span>
                          </div>
                        )}

                        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${priorityStyles[prio]}`}
                          >
                            {prio}
                          </span>
                          <button
                            onClick={() => handlePromote(idea.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <span>Promote to Active</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {columnIdeas.length === 0 && (
                      <div className="bento-card p-8 text-center text-xs text-[#64748b] font-mono border-dashed">
                        No concepts in {prio}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Add Concept Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleCreateIdea}
            className="bento-card bg-[#0e101a] border border-white/20 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <h3 className="font-bold text-sm text-white">Capture Future Project Architecture</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#64748b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Project Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Consensus Engine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Elevator Pitch & Purpose</label>
              <textarea
                placeholder="What core problem does it solve and what makes it exceptional?"
                value={elevatorPitch}
                onChange={(e) => setElevatorPitch(e.target.value)}
                className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white h-20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Target Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Rust, Tokio, gRPC"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Incubator Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                  className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="P0">P0 (Immediate Build)</option>
                  <option value="P1">P1 (Upcoming)</option>
                  <option value="P2">P2 (Long-term Backlog)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#94a3b8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bento-btn-primary px-4 py-2 text-xs font-semibold rounded-lg text-white"
              >
                Save to Incubator
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Discover Projects Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bento-card bg-[#0e101a] border border-white/20 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">AI Suggested Project Concepts</h3>
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
                <Loader2 className="w-6 h-6 animate-spin text-sky-400 mb-2" />
                <p className="text-xs text-[#cbd5e1] font-mono">Analyzing skill gaps and trending technical domains...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#a5b4fc] border border-white/[0.08]">
                          {p.project_type}
                        </span>
                        <h4 className="text-xs font-bold text-white">{p.title}</h4>
                      </div>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">{p.elevator_pitch}</p>
                      <p className="text-xs font-mono text-sky-400">Target Stack: {p.target_tech_stack}</p>
                    </div>
                    <button
                      onClick={() => handleAddAiProject(p)}
                      className="bento-btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition"
                    >
                      <Plus className="w-3 h-3" /> Save
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
