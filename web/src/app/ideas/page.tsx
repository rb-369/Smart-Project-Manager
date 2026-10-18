'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FutureProject, FutureProjectPriority, ProjectType, SuggestedProject, ParsedConcept } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  Plus,
  ArrowRight,
  Trash2,
  Code,
  Cpu,
  Loader2,
  X,
  Zap,
  Layers,
  CheckCircle2,
  MessageSquareText,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Check,
  RotateCcw
} from 'lucide-react';

export default function IdeasPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [ideas, setIdeas] = useState<FutureProject[]>([]);
  const [, setLoading] = useState(true);

  // New manual idea form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [techStack, setTechStack] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('RESUME');
  const [priority, setPriority] = useState<FutureProjectPriority>('P1');
  const [notes, setNotes] = useState('');

  // Smart WhatsApp / Raw Note Concept Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedConcept | null>(null);

  // AI Discover Projects modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedProject[]>([]);
  const [backendOffline, setBackendOffline] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/ideas');
    }
  }, [authLoading, isAuthenticated, router]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const fetchIdeas = async () => {
    if (!api.isAuthenticated()) return;
    try {
      setLoading(true);
      setBackendOffline(false);
      const res: any = await api.get('/future-projects');
      setIdeas(res || []);
    } catch (err: any) {
      console.warn('Unable to load ideas from backend:', err?.message || err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdeas();
    }
  }, [isAuthenticated, user]);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await api.post<FutureProject>('/future-projects', {
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority: priority,
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      setShowAddModal(false);
      showNotification(`"${title.trim()}" added to Ideas Backlog!`);
      if (created && created.id) {
        setIdeas((prev) => [created, ...prev]);
      } else {
        fetchIdeas();
      }
    } catch (err: any) {
      console.warn('Backend unavailable, saving idea in local state:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: `offline-${Date.now()}`,
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority: priority,
        notes: notes.trim() || undefined,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      setShowAddModal(false);
      showNotification(`Saved "${title.trim()}" locally.`);
    }
  };

  // Trigger Smart AI Extraction for WhatsApp / Notes
  const handleExtractConcept = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res: any = await api.post('/future-projects/parse-concept', {
        raw_text: rawText.trim(),
      });
      setParsedPreview(res);
    } catch (err: any) {
      console.warn('AI smart extraction error, falling back locally:', err?.message || err);
      const clean = rawText.trim();
      const firstLine = clean.split('\n')[0].slice(0, 50);
      setParsedPreview({
        title: firstLine || 'Extracted Project Concept',
        elevator_pitch: clean.slice(0, 220),
        target_tech_stack: 'Python, FastAPI, React, SQLite',
        project_type: 'RESUME',
        priority: 'P1',
        notes: `Raw WhatsApp notes:\n${clean}`,
        starter_features: [
          'Core MVP Data Architecture & Endpoints',
          'Interactive Frontend User Interface',
          'Production Deployment & CI Workflow',
        ],
        provider_used: 'Local Heuristic Cascade',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Save the extracted & reviewed concept
  const handleSaveImportedConcept = async () => {
    if (!parsedPreview || !parsedPreview.title.trim()) return;
    try {
      const created = await api.post<FutureProject>('/future-projects', {
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: parsedPreview.raw_message || rawText.trim() || undefined,
      });
      showNotification(`Concept "${parsedPreview.title.trim()}" imported successfully!`);
      setShowImportModal(false);
      setRawText('');
      setParsedPreview(null);
      if (created && created.id) {
        setIdeas((prev) => [created, ...prev]);
      } else {
        fetchIdeas();
      }
    } catch (err: any) {
      console.warn('Backend unavailable, saving imported idea locally:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: `offline-${Date.now()}`,
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: parsedPreview.raw_message || rawText.trim() || undefined,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setShowImportModal(false);
      setRawText('');
      setParsedPreview(null);
      showNotification(`Saved "${parsedPreview.title.trim()}" locally.`);
    }
  };

  const handlePromote = async (id: string, ideaTitle: string) => {
    try {
      await api.post(`/future-projects/${id}/promote`);
      showNotification(`🚀 "${ideaTitle}" promoted to Active Projects! Check Mission Control.`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to promote idea:', err?.message || err);
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'PROMOTED' } : i))
      );
      showNotification(`🚀 "${ideaTitle}" marked as promoted.`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/future-projects/${id}`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to delete idea:', err?.message || err);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleFetchAiProjects = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res: any = await api.post('/ai/suggest-projects');
      setAiSuggestions(res.projects || []);
    } catch (err: any) {
      console.warn('AI suggestions backend unavailable:', err?.message || err);
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
      showNotification(`Added "${p.title}" to ideas backlog!`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to add suggested project:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: `offline-${Date.now()}`,
        title: p.title,
        elevator_pitch: p.elevator_pitch,
        target_tech_stack: p.target_tech_stack,
        project_type: p.project_type,
        priority: p.priority,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setAiSuggestions((prev) => prev.filter((item) => item.title !== p.title));
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

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#C6FF20] text-black font-mono text-xs font-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Content: Full Blue Page with Functional Header */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-32 pb-20 space-y-6 relative z-10 flex-1">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                FUTURE PROJECTS BACKLOG
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Project Ideas &amp; Concept Radar</span>
            </h1>
            <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-2xl">
              Incubate and prioritize software concepts whose repositories are not built yet. Import raw WhatsApp texts or voice notes with one click.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => {
                setShowImportModal(true);
                setRawText('');
                setParsedPreview(null);
                setExtractError(null);
              }}
              className="btn-lime !py-2 !px-4 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-black" />
              <span>Import Concept (WhatsApp)</span>
            </button>
            <button
              onClick={handleFetchAiProjects}
              className="py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#C6FF20]" />
              <span>AI Suggestions</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Manual Add</span>
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
                      No concepts currently in this priority track.
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                                    {idea.project_type}
                                  </span>
                                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-[#C6FF20] text-black">
                                    NO REPO YET
                                  </span>
                                </div>
                                <h2 className="font-black text-base text-white leading-snug mt-2">{idea.title}</h2>
                              </div>
                              <button
                                onClick={() => handleDelete(idea.id)}
                                className="text-white/70 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                                title="Delete concept"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {idea.elevator_pitch && (
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
                                {idea.elevator_pitch}
                              </p>
                            )}

                            {idea.notes && (
                              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                <span className="font-bold text-slate-900 block mb-1">Notes / MVP Scope:</span>
                                {idea.notes}
                              </div>
                            )}

                            {idea.raw_message && (
                              <details className="mt-2 text-xs group">
                                <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 select-none font-bold">
                                  <MessageSquareText className="w-3 h-3 text-emerald-600" />
                                  <span>View Original Message</span>
                                </summary>
                                <div className="mt-1.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                                  {idea.raw_message}
                                </div>
                              </details>
                            )}
                          </div>

                          {idea.target_tech_stack && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <Code className="w-3.5 h-3.5 text-[#0038FF] shrink-0" />
                              <span className="font-bold truncate">{idea.target_tech_stack}</span>
                            </div>
                          )}

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                              {pConfig.label}
                            </span>

                            <button
                              onClick={() => handlePromote(idea.id, idea.title)}
                              className="btn-lime !py-1 !px-3 text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
                              title="Convert to active repository in Mission Control"
                            >
                              <span>Start Building</span>
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

      {/* Smart Concept / WhatsApp Text Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 rounded-3xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-950 uppercase">Import Concept from WhatsApp / Notes</h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    AI will smartly parse informal chats and structure them into a project idea.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Raw Text Input */}
            {!parsedPreview ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800">
                      Paste WhatsApp Text or Voice Transcript
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Slang, typos, and bullet points supported
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    autoFocus
                    placeholder="e.g. bro what if we build a bot that automatically tweets git commits using python and fastapi, top priority asap. We could add discord webhook alerts too."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-2xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none shadow-inner font-mono leading-relaxed"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200/70 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Zap className="w-4 h-4 text-[#0038FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Smart Extraction:</strong> DevCommand AI analyzes your messy notes, infers a professional title, crisp pitch, modern tech stack, priority (P0/P1/P2), and generates an MVP starter features checklist.
                  </p>
                </div>

                {extractError && (
                  <div className="text-xs font-mono text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {extractError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtracting || !rawText.trim()}
                    onClick={handleExtractConcept}
                    className="btn-lime !py-2 !px-5 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Smart Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-black" />
                        <span>⚡ Smart Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Extracted Preview & Review Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Concept Extracted! Review and tweak below before saving:</span>
                  </div>
                  {parsedPreview.provider_used && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      {parsedPreview.provider_used}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Concept Title</label>
                    <input
                      type="text"
                      value={parsedPreview.title}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Elevator Pitch</label>
                    <textarea
                      rows={2}
                      value={parsedPreview.elevator_pitch}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, elevator_pitch: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Target Tech Stack</label>
                    <input
                      type="text"
                      value={parsedPreview.target_tech_stack}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, target_tech_stack: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">Category</label>
                      <select
                        value={parsedPreview.project_type}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, project_type: e.target.value as ProjectType })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                      >
                        <option value="RESUME">Resume Portfolio</option>
                        <option value="COLLEGE">Academic / College</option>
                        <option value="PRODUCTION">Production SaaS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">Priority Track</label>
                      <select
                        value={parsedPreview.priority}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, priority: e.target.value as FutureProjectPriority })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                      >
                        <option value="P0">P0 - Next Immediate</option>
                        <option value="P1">P1 - Upcoming</option>
                        <option value="P2">P2 - Research Backlog</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">Notes &amp; Starter MVP Features</label>
                    <textarea
                      rows={3}
                      value={parsedPreview.notes || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  {parsedPreview.raw_message && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">
                        💬 Original Message (Saved):
                      </span>
                      <p className="text-[11px] font-mono text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 max-h-20 overflow-y-auto">
                        &ldquo;{parsedPreview.raw_message}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setParsedPreview(null)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Paste New Text</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImportedConcept}
                      className="btn-lime !py-2 !px-5 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-black" />
                      <span>Save to Ideas Backlog</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add Concept Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-black text-sm text-slate-950 uppercase">Add New Concept Manually</h2>
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
                    <option value="COLLEGE">Academic / College</option>
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

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Notes / MVP Features</label>
                <textarea
                  rows={2}
                  placeholder="Bullet points or key technical milestones"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0038FF] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none shadow-inner font-mono text-[11px]"
                />
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
                  className="btn-lime !py-2 !px-5 text-xs font-black shadow-md cursor-pointer"
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
                <Lightbulb className="w-4 h-4 text-[#0038FF]" />
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
