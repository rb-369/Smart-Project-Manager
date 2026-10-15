'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FutureProject, FutureProjectPriority, ProjectType, SuggestedProject } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  Plus,
  ArrowRight,
  Trash2,
  Code,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<FutureProject[]>([]);
  const [, setLoading] = useState(true);

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
        priority: p.priority,
      });
      setAiSuggestions((prev) => prev.filter((item) => item.title !== p.title));
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityStyles: Record<string, { badge: string; dot: string; label: string }> = {
    P0: { badge: 'border-rose-200 bg-rose-50 text-rose-700', dot: 'bg-rose-500', label: 'P0 Immediate' },
    P1: { badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'P1 Upcoming' },
    P2: { badge: 'border-blue-200 bg-blue-50 text-[#0A5CFF]', dot: 'bg-[#0A5CFF]', label: 'P2 Backlog' },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden flex flex-col bg-grid-pattern-light selection:bg-[#C6FF20] selection:text-black">
      {/* Light Ambient Glows */}
      <div className="ambient-glow-blue -top-40 left-1/4" />
      <div className="ambient-glow-lime top-48 -right-40" />
      <div className="ambient-glow-violet bottom-32 left-1/3" />

      {/* Floating Island Navigation */}
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-7">
        {/* Header Tray */}
        <div className="gridster-panel bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
              <span className="text-[11px] font-mono text-[#0A5CFF] uppercase tracking-widest font-bold">
                Architecture Incubator
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Future Project Radar
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Queue and prioritize upcoming software concepts before initial repository commit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFetchAiProjects}
              className="btn-outline-white !py-2 !px-4 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0A5CFF]" />
              <span>AI Concept Engine</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-blue !py-2 !px-4 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Concept</span>
            </button>
          </div>
        </div>

        {/* Ideas Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['P0', 'P1', 'P2'] as const).map((prio) => {
            const columnIdeas = ideas.filter((i) => i.priority === prio && i.status !== 'PROMOTED');
            const columnTitles = {
              P0: 'P0 // Next Immediate Build',
              P1: 'P1 // Upcoming Priority',
              P2: 'P2 // Future Research & Backlog',
            };

            return (
              <div key={prio} className="space-y-4">
                <div className="flex items-center justify-between px-2 text-xs font-mono">
                  <span className="text-slate-800 font-bold">{columnTitles[prio]}</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {columnIdeas.length === 0 ? (
                    <div className="gridster-panel bg-white border border-slate-200 p-8 text-center text-xs text-slate-400 font-mono">
                      No projects in this track.
                    </div>
                  ) : (
                    columnIdeas.map((idea) => {
                      const pConfig = priorityStyles[prio];
                      return (
                        <div key={idea.id} className="gridster-panel bg-white border border-slate-200 p-4 space-y-3 hover:translate-y-[-2px] transition-all">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                                {idea.project_type}
                              </span>
                              <button
                                onClick={() => handleDelete(idea.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Delete idea"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{idea.title}</h4>
                            {idea.elevator_pitch && (
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                                {idea.elevator_pitch}
                              </p>
                            )}
                          </div>

                          {idea.target_tech_stack && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <Code className="w-3.5 h-3.5 text-[#0A5CFF]" />
                              <span>{idea.target_tech_stack}</span>
                            </div>
                          )}

                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                              {pConfig.label}
                            </span>

                            <button
                              onClick={() => handlePromote(idea.id)}
                              className="text-xs font-bold text-[#0A5CFF] hover:underline flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Promote</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Concept Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="gridster-panel bg-white border border-slate-300 w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-950">Add New Concept</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Concept Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Task Orchestrator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A5CFF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Elevator Pitch</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of goals, mechanics, and value proposition"
                  value={elevatorPitch}
                  onChange={(e) => setElevatorPitch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A5CFF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Target Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Go, gRPC, Redis, Docker"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A5CFF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="RESUME">Resume Portfolio</option>
                    <option value="COLLEGE">College Project</option>
                    <option value="PRODUCTION">Production SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Priority Track</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="P0">P0 - Immediate Next</option>
                    <option value="P1">P1 - High Priority</option>
                    <option value="P2">P2 - Backlog Idea</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline-white !py-1.5 !px-4 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-blue !py-1.5 !px-5 text-xs font-bold"
                >
                  Register Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Concept Engine Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="gridster-panel bg-white border border-slate-300 w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A5CFF]" />
                <h3 className="font-bold text-sm text-slate-950">AI Concept Engine</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A5CFF] mb-2" />
                <p className="text-xs text-slate-600 font-mono">Analyzing skill gaps and trending technical domains...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {aiSuggestions.map((p, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border bg-blue-50 border-blue-200 text-[#0A5CFF]">
                          {p.project_type}
                        </span>
                        <p className="text-xs font-bold text-slate-900">{p.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{p.elevator_pitch}</p>
                      {p.target_tech_stack && (
                        <p className="text-[11px] font-mono text-[#0A5CFF]">&bull; Stack: {p.target_tech_stack}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddAiProject(p)}
                      className="btn-outline-white !py-1 !px-3 text-xs shrink-0 flex items-center gap-1 cursor-pointer font-bold"
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
