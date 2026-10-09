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
  Cpu,
  X,
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
    P0: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    P1: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    P2: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f7] flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1c1d28]">
            <div>
              <h1 className="text-xl font-semibold text-[#f4f4f7] tracking-tight flex items-center gap-2">
                Future Project Priority Incubator
              </h1>
              <p className="text-xs text-[#7c8091] mt-0.5">
                Queue and prioritize future concepts before writing a single line of code.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleFetchAiProjects}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#13151f] hover:bg-[#1c1e2c] text-[#c5c8d6] border border-[#252838] shadow-sm transition cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                AI Project Ideas
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Idea
              </button>
            </div>
          </div>

          {/* Ideas Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['P0', 'P1', 'P2'] as const).map((prio) => {
              const columnIdeas = ideas.filter((i) => i.priority === prio && i.status !== 'PROMOTED');
              const columnTitles = {
                P0: 'P0 // Next Immediate Build',
                P1: 'P1 // Upcoming Priority',
                P2: 'P2 // Long-Term Backlog',
              };

              return (
                <div key={prio} className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-xs font-mono">
                    <span className="text-[#8b8f9e] font-semibold">{columnTitles[prio]}</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#161722] text-[#6b6f80] border border-[#222433]">
                      {columnIdeas.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {columnIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="craft-card p-3.5 rounded-lg space-y-2.5 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#14151f] text-[#8b8f9e] border border-[#202230]">
                              {idea.project_type}
                            </span>
                            <button
                              onClick={() => handleDelete(idea.id)}
                              className="text-[#4c4f5f] hover:text-rose-400 transition"
                              title="Delete idea"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="font-semibold text-xs text-[#f4f4f7] leading-tight">{idea.title}</h4>
                          {idea.elevator_pitch && (
                            <p className="text-[11px] text-[#7c8091] mt-1 leading-relaxed">{idea.elevator_pitch}</p>
                          )}
                        </div>

                        {idea.target_tech_stack && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b8f9e]">
                            <Code className="w-3 h-3 text-blue-400" />
                            {idea.target_tech_stack}
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#1c1d28] flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${priorityStyles[prio]}`}
                          >
                            {prio}
                          </span>
                          <button
                            onClick={() => handlePromote(idea.id)}
                            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
                          >
                            Promote to Active <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {columnIdeas.length === 0 && (
                      <div className="p-6 text-center rounded-lg border border-dashed border-[#1f202c] text-xs text-[#525565] font-mono">
                        No items in {prio}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateIdea}
            className="bg-[#111218] border border-[#242738] rounded-lg w-full max-w-lg p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1c1d28]">
              <h3 className="font-semibold text-sm text-[#f4f4f7]">Capture Future Project Concept</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#64687a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b8f9e] mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Task Queue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0d0e14] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b8f9e] mb-1">Elevator Pitch</label>
              <textarea
                placeholder="What problem does it solve and why is it worth building?"
                value={elevatorPitch}
                onChange={(e) => setElevatorPitch(e.target.value)}
                className="w-full bg-[#0d0e14] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] h-20 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8b8f9e] mb-1">Target Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Go, Redis, Docker"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b8f9e] mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                  className="w-full bg-[#0d0e14] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] focus:outline-none focus:border-blue-500"
                >
                  <option value="P0">P0 (Immediate)</option>
                  <option value="P1">P1 (High)</option>
                  <option value="P2">P2 (Long-term)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1c1d28]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-[#8b8f9e] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                Save to Incubator
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Discover Projects Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#111218] border border-[#252838] rounded-lg w-full max-w-xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1d28] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-[#f4f4f7]">AI Suggested Next Projects</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[#64687a] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mb-2" />
                <p className="text-xs text-[#7c8091] font-mono">Analyzing project catalog for skill expansion...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((p, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-lg bg-[#14151f] border border-[#222433] flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181a26] text-[#8b8f9e] border border-[#252738]">
                          {p.project_type}
                        </span>
                        <h4 className="text-xs font-semibold text-[#f4f4f7]">{p.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#7c8091] leading-relaxed">{p.elevator_pitch}</p>
                      <p className="text-[11px] font-mono text-blue-400">Stack: {p.target_tech_stack}</p>
                    </div>
                    <button
                      onClick={() => handleAddAiProject(p)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#1c1e2b] hover:bg-[#25283a] text-[#f4f4f7] border border-[#2e3146] shrink-0 transition"
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
