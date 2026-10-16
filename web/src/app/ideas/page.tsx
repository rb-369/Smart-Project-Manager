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

  const tickerItems = [
    '⚡ RAPID ARCHITECTURE EXPERIMENTS',
    '⚡ AUTOMATED SPEC EXTRACTION',
    '⚡ MULTI-TIER PROMOTION PIPELINE',
    '⚡ P0 IMMEDIATE BUILDS',
    '⚡ ZERO DEAD BACKLOGS',
    '⚡ AI SYNTHESIS CASCADE'
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#C6FF20] selection:text-black">
      
      {/* ====================================================================
          1. TOP HERO: ELECTRIC BLUE BLUEPRINT GRID (Matching Landing Page)
          ==================================================================== */}
      <section className="bg-blue-grid text-white pt-6 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Ambient Vignettes on Blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Island Navigation Header */}
        <Navbar />

        {/* Hero Content Block */}
        <div className="max-w-6xl mx-auto text-center relative z-10 pt-20 pb-8">
          
          {/* Top Neon Badge Pill */}
          <div className="flex justify-center mb-5">
            <span className="lime-sticker text-xs font-black shadow-[0_4px_16px_rgba(198,255,32,0.4)]">
              ⚡ AUTONOMOUS CONCEPT INCUBATOR
            </span>
          </div>

          {/* Massive Stacked White Headline */}
          <div className="relative inline-block max-w-5xl mx-auto px-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[0.95]">
              <div className="tracking-tight mb-2">FUTURE PROJECT</div>
              <div className="flex items-center justify-center flex-wrap gap-3 mt-1 sm:mt-2">
                <span className="tracking-tight">RADAR &amp;</span>
                <span className="inline-block bg-[#C6FF20] text-black px-4 py-1 sm:py-2 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl font-black shadow-[0_8px_30px_rgba(198,255,32,0.6)] -rotate-1 hover:rotate-0 transition-transform">
                  CONCEPT ENGINE
                </span>
              </div>
            </h1>

            {/* Hand-Drawn SVG Neon Lime Arrow */}
            <div className="hidden md:block absolute -top-6 -right-10 text-[#C6FF20]">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-12">
                <path d="M20 70 C 35 30, 65 30, 75 40" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" />
                <path d="M60 28 L 78 40 L 70 58" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Subtext */}
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto mt-5 leading-relaxed font-normal">
            Queue and prioritize upcoming software concepts before repository creation, then promote them directly into high-velocity production roadmaps.
          </p>

          {/* Action CTAs on Electric Blue Canvas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={handleFetchAiProjects}
              className="btn-lime !py-3 !px-7 text-xs font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>AI CONCEPT ENGINE</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="py-3 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C6FF20]" />
              <span>ADD NEW CONCEPT</span>
            </button>
          </div>

        </div>
      </section>

      {/* ====================================================================
          2. ACID LIME TICKER MARQUEE TAPE
          ==================================================================== */}
      <div className="w-full bg-[#C6FF20] text-black font-mono font-black text-xs sm:text-sm uppercase py-3 tracking-wider border-y-2 border-black/15 overflow-hidden select-none relative z-30 shadow-lg">
        <div className="animate-marquee gap-8">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 font-bold text-lg">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. CLEAN BRIGHT WHITE CURVED SHEET (Incubator Tracks)
          ==================================================================== */}
      <main className="bg-white text-slate-900 rounded-t-[44px] sm:rounded-t-[60px] -mt-6 relative z-20 shadow-2xl pt-14 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        
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
                      prio === 'P0' ? 'bg-[#0038FF]' : prio === 'P1' ? 'bg-[#C6FF20]' : 'bg-[#7020DD]'
                    }`} />
                    <span className="text-slate-950 font-black uppercase tracking-wider">{columnTitles[prio]}</span>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {columnIdeas.length === 0 ? (
                    <div className="gridster-panel bg-white border border-slate-200 p-8 text-center text-xs text-slate-400 font-mono rounded-2xl">
                      No concepts currently in this track.
                    </div>
                  ) : (
                    columnIdeas.map((idea) => {
                      const pConfig = priorityStyles[prio];
                      return (
                        <div key={idea.id} className="gridster-panel bg-white border border-slate-200/90 shadow-md p-5 space-y-3.5 hover:translate-y-[-2px] transition-all rounded-3xl flex flex-col justify-between">
                          <div>
                            {/* Electric Blue Header Box for Idea */}
                            <div className="bg-[#0038FF] text-white rounded-2xl p-4 shadow-inner mb-3 flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                                  {idea.project_type}
                                </span>
                                <h4 className="font-black text-base text-white leading-snug mt-2">{idea.title}</h4>
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
                            <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-950 uppercase">Add New Concept</h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0038FF]" />
                <h3 className="font-black text-sm text-slate-950 uppercase">AI Concept Engine</h3>
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
                        <h4 className="font-black text-xs text-slate-900">{p.title}</h4>
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
