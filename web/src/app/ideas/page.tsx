'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FutureProject, FutureProjectPriority, ProjectType, SuggestedProject } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import {
  Lightbulb,
  Plus,
  Sparkles,
  ArrowRight,
  Trash2,
  CheckCircle,
  Code,
  Tag,
  Loader2,
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
      await api.post(`/future-projects/${id}/promote`, {});
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

  const handleSaveAiProject = async (p: SuggestedProject) => {
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

  const priorityColors = {
    P0: 'border-red-800/40 bg-red-950/20 text-red-300',
    P1: 'border-amber-800/40 bg-amber-950/20 text-amber-300',
    P2: 'border-blue-800/40 bg-blue-950/20 text-blue-300',
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-400" />
                Future Project Priority Incubator
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Queue and prioritize future concepts before writing a single line of code.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFetchAiProjects}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Project Ideas
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Idea
              </button>
            </div>
          </div>

          {/* Ideas Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['P0', 'P1', 'P2'] as const).map((prio) => {
              const columnIdeas = ideas.filter((i) => i.priority === prio && i.status !== 'PROMOTED');
              const columnTitles = {
                P0: 'P0 • Highest Priority (Next Up)',
                P1: 'P1 • High Priority (Upcoming)',
                P2: 'P2 • Idea Backlog (Future)',
              };

              return (
                <div key={prio} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">
                      {columnTitles[prio]}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                      {columnIdeas.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="glass-card p-4 rounded-xl border border-slate-800 space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {idea.project_type}
                            </span>
                            <button
                              onClick={() => handleDelete(idea.id)}
                              className="text-slate-600 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="font-bold text-sm text-slate-100">{idea.title}</h4>
                          {idea.elevator_pitch && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{idea.elevator_pitch}</p>
                          )}
                        </div>

                        {idea.target_tech_stack && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                            <Code className="w-3.5 h-3.5 text-indigo-400" />
                            {idea.target_tech_stack}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColors[prio]}`}>
                            {prio}
                          </span>
                          <button
                            onClick={() => handlePromote(idea.id)}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                          >
                            Promote <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {columnIdeas.length === 0 && (
                      <div className="p-6 text-center rounded-xl border border-dashed border-slate-800/60 text-xs text-slate-600">
                        No ideas in {prio}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Add Idea Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateIdea}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-base text-white">Capture Future Project Idea</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Database Visualizer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Elevator Pitch / Problem</label>
              <textarea
                rows={2}
                placeholder="What problem does this solve?"
                value={elevatorPitch}
                onChange={(e) => setElevatorPitch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Go + React"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="P0">P0 (Next Up)</option>
                  <option value="P1">P1 (High Priority)</option>
                  <option value="P2">P2 (Backlog)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Idea
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Discover Projects Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">AI Project Discovery</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {aiLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                <p className="text-xs text-slate-300">Evaluating your portfolio and brainstorming high-impact ideas...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{p.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{p.elevator_pitch}</p>
                      </div>
                      <button
                        onClick={() => handleSaveAiProject(p)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1 shadow cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Save to Ideas
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="font-semibold text-slate-300">{p.target_tech_stack}</span>
                      <span>•</span>
                      <span className="text-indigo-300 italic">{p.why_this_project}</span>
                    </div>
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
