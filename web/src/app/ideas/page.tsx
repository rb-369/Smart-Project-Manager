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
  X,
  Zap,
  Layers,
  CheckCircle2
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
    P2: { badge: 'border-blue-200 bg-blue-50 text-[#0038FF]', dot: 'bg-[#0038FF]', label: 'P2 Backlog' },
  };

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Content: Full Blue Page with Compact Functional Header */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-24 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                CONCEPT INCUBATOR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Future Project Radar</span>
            </h1>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Queue and prioritize upcoming software concepts before initial repository commit.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleFetchAiProjects}
              className="btn-lime !py-2 !px-4 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>AI Concept Engine</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6FF20]" />
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
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      prio === 'P0' ? 'bg-[#C6FF20] pulse-lime' : prio === 'P1' ? 'bg-[#C6FF20]' : 'bg-purple-300'
                    }`} />
                    <span className="text-white font-black uppercase tracking-wider">{columnTitles[prio]}</span>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {columnIdeas.length === 0 ? (
                    <div className="bg-white/10 border border-white/15 p-8 text-center text-xs text-white/60 font-mono rounded-2xl backdrop-blur-md">
                      No concepts currently in this track.
                    </div>
                  ) : (
                    columnIdeas.map((idea) => {
                      const pConfig = priorityStyles[prio];
                      return (
                        <div key={idea.id} className="bg-white text-slate-900 border border-white/20 shadow-2xl p-5 space-y-3.5 hover:translate-y-[-2px] transition-all rounded-3xl flex flex-col justify-between">
                          <div>
                            {/* Electric Blue Header Box for Idea */}
                            <div className="bg-[#0038FF] text-white rounded-2xl p-4 shadow-inner mb-3 flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                                  {idea.project_type}
                                </span>
                                <h2 className="font-black text-base text-white leading-snug mt-2">{idea.title}</h2>
                              </div>
                              <button
                                onClick={() => handleDelete(idea.id)}
                                className="text-white/70 hover:text-[#C6FF20] transition-colors p-1 cursor-pointer"
                                title="Delete concept"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {idea.elevator_pitch && (
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3 font-normal">
                                {idea.elevator_pitch}
                              </p>
                            )}
                          </div>

                          {idea.target_tech_stack && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <Code className="w-3.5 h-3.5 text-[#0038FF]" />
                              <span className="font-bold">{idea.target_tech_stack}</span>
                            </div>
                          )}

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                              {pConfig.label}
                            </span>

                            <button
                              onClick={() => handlePromote(idea.id)}
                              className="btn-lime !py-1 !px-3.5 text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <span>Promote</span>
                              <ArrowRight className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-black text-sm text-slate-950 uppercase">Add New Concept</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Concept Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Task Orchestrator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Elevator Pitch</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of goals, mechanics, and value proposition"
                  value={elevatorPitch}
                  onChange={(e) => setElevatorPitch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none shadow-inner font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Target Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Go, gRPC, Redis, Docker"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">Category</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                  >
                    <option value="RESUME">Resume Portfolio</option>
                    <option value="COLLEGE">Academic / Research</option>
                    <option value="PRODUCTION">Production SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">Priority Track</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                  >
                    <option value="P0">P0 - Next Immediate</option>
                    <option value="P1">P1 - Upcoming</option>
                    <option value="P2">P2 - Research Backlog</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-lime !py-2 !px-5 text-xs font-black shadow-md"
                >
                  Create Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Concept Engine Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0038FF]" />
                <h2 className="font-black text-sm text-slate-950 uppercase">AI Concept Engine</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0038FF] mb-3" />
                <p className="text-xs text-slate-600 font-mono">Synthesizing high-impact project concepts...</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto">
                {aiSuggestions.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-3 hover:border-[#0038FF] transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-[#0038FF]">
                          {p.project_type}
                        </span>
                        <h3 className="font-black text-xs text-slate-900">{p.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{p.elevator_pitch}</p>
                      {p.target_tech_stack && (
                        <p className="text-[10px] font-mono text-purple-700 font-bold">&bull; {p.target_tech_stack}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddAiProject(p)}
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
      )}
    </div>
  );
}
