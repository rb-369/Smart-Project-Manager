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
  CheckCircle2,
  MessageSquareText,
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
  const [, setBackendOffline] = useState(false);
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
        priority,
        notes: notes.trim() || undefined,
      });
      setIdeas((prev) => [created, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      showNotification(`Added "${created.title}" to ideas backlog!`);
    } catch (err: any) {
      console.warn('Unable to create idea on backend:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: `offline-${Date.now()}`,
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority,
        notes: notes.trim() || undefined,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      showNotification(`Saved "${title.trim()}" locally.`);
    }
  };

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
      console.warn('Backend parse error, using smart local parser fallback:', err);
      const clean = rawText.trim();
      const firstLine = clean.split('\n')[0].slice(0, 50);
      setParsedPreview({
        title: firstLine || 'Extracted Project Concept',
        elevator_pitch: clean.slice(0, 220),
        target_tech_stack: 'Python, FastAPI, React, SQLite',
        project_type: 'RESUME',
        priority: 'P1',
        notes: `Extracted from WhatsApp notes:\n${clean}`,
        raw_message: clean,
        starter_features: [
          'Core MVP Data Architecture & Endpoints',
          'Interactive Frontend User Interface',
          'Production Deployment & CI Workflow',
        ],
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveImportedConcept = async () => {
    if (!parsedPreview) return;
    try {
      const created = await api.post<FutureProject>('/future-projects', {
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch?.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack?.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: parsedPreview.raw_message || rawText.trim() || undefined,
      });
      setIdeas((prev) => [created, ...prev]);
      setShowImportModal(false);
      setRawText('');
      setParsedPreview(null);
      showNotification(`Imported concept "${created.title}" successfully!`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to save imported concept on backend:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: `offline-${Date.now()}`,
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch?.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack?.trim() || undefined,
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
    P0: { badge: 'border-2 border-black bg-[#FF5533] text-black', dot: 'bg-black', label: 'P0 IMMEDIATE' },
    P1: { badge: 'border-2 border-black bg-amber-300 text-black', dot: 'bg-black', label: 'P1 UPCOMING' },
    P2: { badge: 'border-2 border-black bg-[#BBF7D0] text-black', dot: 'bg-black', label: 'P2 BACKLOG' },
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#DFFF4F] text-black font-mono text-xs font-black px-4 py-3 border-2 border-black shadow-[6px_6px_0px_#000000] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-28 pb-20 space-y-6 relative z-10 flex-1">
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#0047FF] border border-black inline-block" />
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest font-black">
                FUTURE PROJECTS BACKLOG &bull; RADAR ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight flex items-center gap-3">
              <span>Project Ideas &amp; Concept Radar</span>
            </h1>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed max-w-2xl font-mono">
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
              className="px-4 py-2 bg-[#DFFF4F] text-black font-mono text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] flex items-center gap-1.5 cursor-pointer transition"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Import Concept (WhatsApp)</span>
            </button>
            <button
              onClick={handleFetchAiProjects}
              className="px-4 py-2 bg-[#0047FF] text-white font-mono text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#DFFF4F]" />
              <span>AI Suggestions</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-white text-black font-mono text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#FAF7EE] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {/* Ideas Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['P0', 'P1', 'P2'] as const).map((prio) => {
            const columnIdeas = ideas.filter((i) => i.priority === prio && i.status !== 'PROMOTED');
            const columnTitles = {
              P0: 'P0 // NEXT IMMEDIATE BUILD',
              P1: 'P1 // UPCOMING PRIORITY',
              P2: 'P2 // RESEARCH & BACKLOG',
            };

            return (
              <div key={prio} className="space-y-4">
                <div className="flex items-center justify-between px-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 border border-black ${
                      prio === 'P0' ? 'bg-[#FF5533]' : prio === 'P1' ? 'bg-amber-300' : 'bg-[#BBF7D0]'
                    }`} />
                    <span className="text-black font-black uppercase tracking-wider">{columnTitles[prio]}</span>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-0.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {columnIdeas.length === 0 ? (
                    <div className="bg-white border-2 border-black p-8 text-center text-xs text-neutral-500 font-mono shadow-[3px_3px_0px_#000000]">
                      No concepts currently in this priority track.
                    </div>
                  ) : (
                    columnIdeas.map((idea) => {
                      const pConfig = priorityStyles[prio];
                      return (
                        <div key={idea.id} className="bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[7px_7px_0px_#000000] hover:-translate-y-1 p-5 space-y-3.5 transition-all flex flex-col justify-between">
                          <div>
                            {/* Cobalt Blue Header Box for Idea */}
                            <div className="bg-[#0047FF] text-white border-2 border-black p-4 shadow-[2px_2px_0px_#000000] mb-3 flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-black text-[#DFFF4F] border border-black uppercase">
                                    {idea.project_type}
                                  </span>
                                  <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-white text-black border border-black uppercase">
                                    NO REPO YET
                                  </span>
                                </div>
                                <h2 className="font-black text-base text-white leading-snug mt-2">{idea.title}</h2>
                              </div>
                              <button
                                onClick={() => handleDelete(idea.id)}
                                className="text-white hover:text-[#FF5533] transition-colors p-1 cursor-pointer"
                                title="Delete concept"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {idea.elevator_pitch && (
                              <p className="text-xs text-neutral-700 mt-2 leading-relaxed font-normal">
                                {idea.elevator_pitch}
                              </p>
                            )}

                            {idea.notes && (
                              <div className="mt-2.5 p-2.5 bg-[#FAF7EE] border-2 border-black text-[11px] font-mono text-black whitespace-pre-wrap max-h-32 overflow-y-auto">
                                <span className="font-black text-black block mb-1 uppercase">Notes / MVP Scope:</span>
                                {idea.notes}
                              </div>
                            )}

                            {idea.raw_message && (
                              <details className="mt-2 text-xs group">
                                <summary className="cursor-pointer font-mono text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 select-none font-black uppercase">
                                  <MessageSquareText className="w-3 h-3 text-[#0047FF]" />
                                  <span>View Original Message</span>
                                </summary>
                                <div className="mt-1.5 p-2 bg-[#FAF7EE] border border-black text-[11px] font-mono text-black whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                                  {idea.raw_message}
                                </div>
                              </details>
                            )}
                          </div>

                          {idea.target_tech_stack && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-black bg-[#FAF7EE] p-2.5 border-2 border-black shadow-[1px_1px_0px_#000000]">
                              <Code className="w-3.5 h-3.5 text-[#0047FF] shrink-0" />
                              <span className="font-black truncate uppercase">{idea.target_tech_stack}</span>
                            </div>
                          )}

                          <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-mono font-black px-2 py-0.5 uppercase flex items-center gap-1.5 ${pConfig.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                              {pConfig.label}
                            </span>

                            <button
                              onClick={() => handlePromote(idea.id, idea.title)}
                              className="px-3 py-1 bg-[#DFFF4F] text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#DFFF4F] text-xs font-mono font-black uppercase flex items-center gap-1 transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-3 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[10px_10px_0px_#000000] p-6 space-y-4 text-black">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#DFFF4F] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-black uppercase tracking-tight">Import Concept from WhatsApp / Notes</h2>
                  <p className="text-[11px] text-neutral-600 font-mono">
                    AI will smartly parse informal chats and structure them into a project idea.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="p-1 bg-[#FAF7EE] border border-black hover:bg-black hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Raw Text Input */}
            {!parsedPreview ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono font-black text-black uppercase tracking-wider">
                      Paste WhatsApp Text or Voice Transcript
                    </label>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      Slang, typos, &amp; notes supported
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    autoFocus
                    placeholder="e.g. bro what if we build a bot that automatically tweets git commits using python and fastapi, top priority asap. We could add discord alerts too."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white p-3.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition resize-none font-mono leading-relaxed"
                  />
                </div>

                <div className="bg-[#FAF7EE] border-2 border-black p-3.5 flex items-start gap-2.5 text-xs text-black shadow-[2px_2px_0px_#000000]">
                  <Zap className="w-4 h-4 text-[#0047FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-mono leading-relaxed">
                    <strong>SMART EXTRACTION:</strong> DevCommand AI analyzes your messy notes, infers a professional title, pitch, tech stack, priority, and generates an MVP starter features checklist.
                  </p>
                </div>

                {extractError && (
                  <div className="text-xs font-mono text-rose-800 bg-rose-50 p-2.5 border-2 border-black">
                    {extractError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black uppercase hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtracting || !rawText.trim()}
                    onClick={handleExtractConcept}
                    className="px-5 py-2 bg-[#DFFF4F] text-black border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Smart Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-black" />
                        <span>Smart Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Extracted Preview & Review Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#BBF7D0] border-2 border-black p-2.5 text-xs text-black shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center gap-1.5 font-black uppercase font-mono">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Concept Extracted! Review and tweak below:</span>
                  </div>
                  {parsedPreview.provider_used && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-black uppercase">
                      {parsedPreview.provider_used}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Concept Title</label>
                    <input
                      type="text"
                      value={parsedPreview.title}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, title: e.target.value })}
                      className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2 text-xs text-black font-black font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Elevator Pitch</label>
                    <textarea
                      rows={2}
                      value={parsedPreview.elevator_pitch}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, elevator_pitch: e.target.value })}
                      className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2 text-xs text-black font-mono focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Target Tech Stack</label>
                    <input
                      type="text"
                      value={parsedPreview.target_tech_stack}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, target_tech_stack: e.target.value })}
                      className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2 text-xs text-black font-mono font-black uppercase focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={parsedPreview.project_type}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, project_type: e.target.value as ProjectType })}
                        className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] px-3.5 py-2 text-xs text-black focus:outline-none font-mono font-black uppercase"
                      >
                        <option value="RESUME">Resume Portfolio</option>
                        <option value="COLLEGE">Academic / College</option>
                        <option value="PRODUCTION">Production SaaS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Priority Track</label>
                      <select
                        value={parsedPreview.priority}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, priority: e.target.value as FutureProjectPriority })}
                        className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] px-3.5 py-2 text-xs text-black focus:outline-none font-mono font-black uppercase"
                      >
                        <option value="P0">P0 - Next Immediate</option>
                        <option value="P1">P1 - Upcoming</option>
                        <option value="P2">P2 - Research Backlog</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Notes &amp; Starter MVP Features</label>
                    <textarea
                      rows={3}
                      value={parsedPreview.notes || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, notes: e.target.value })}
                      className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2 text-xs text-black focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  {parsedPreview.raw_message && (
                    <div className="p-2.5 bg-[#FAF7EE] border-2 border-black">
                      <span className="text-[10px] font-mono font-black text-black uppercase block mb-1">
                        Original Message:
                      </span>
                      <p className="text-[11px] font-mono text-neutral-800 bg-white p-2 border border-black max-h-20 overflow-y-auto">
                        &ldquo;{parsedPreview.raw_message}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setParsedPreview(null)}
                    className="flex items-center gap-1 text-xs font-mono font-black text-black hover:text-[#0047FF] uppercase"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Paste New Text</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black uppercase hover:bg-neutral-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImportedConcept}
                      className="px-5 py-2 bg-[#DFFF4F] text-black border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-3 border-black w-full max-w-lg shadow-[10px_10px_0px_#000000] p-6 space-y-4 text-black">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h2 className="font-black text-sm text-black uppercase tracking-tight">Add New Concept Manually</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 bg-[#FAF7EE] border border-black hover:bg-black hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Concept Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Task Orchestrator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Elevator Pitch</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of goals, mechanics, and value proposition"
                  value={elevatorPitch}
                  onChange={(e) => setElevatorPitch(e.target.value)}
                  className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Target Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Go, gRPC, Redis, Docker"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] px-3.5 py-2 text-xs text-black focus:outline-none font-mono font-black uppercase"
                  >
                    <option value="RESUME">Resume Portfolio</option>
                    <option value="COLLEGE">Academic / College</option>
                    <option value="PRODUCTION">Production SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Priority Track</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                    className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] px-3.5 py-2 text-xs text-black focus:outline-none font-mono font-black uppercase"
                  >
                    <option value="P0">P0 - Next Immediate</option>
                    <option value="P1">P1 - Upcoming</option>
                    <option value="P2">P2 - Research Backlog</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">Notes / MVP Features</label>
                <textarea
                  rows={2}
                  placeholder="Bullet points or key technical milestones"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#FAF7EE] border-2 border-black focus:border-[#0047FF] focus:bg-white px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none transition resize-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#FAF7EE] border-2 border-black text-xs font-mono font-black uppercase hover:bg-neutral-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DFFF4F] text-black border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] cursor-pointer transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-3 border-black w-full max-w-xl max-h-[85vh] overflow-hidden shadow-[10px_10px_0px_#000000] p-6 text-black">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#0047FF]" />
                <h2 className="font-black text-sm text-black uppercase tracking-tight">AI Concept Engine</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-1 bg-[#FAF7EE] border border-black hover:bg-black hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0047FF] mb-3" />
                <p className="text-xs text-black font-mono font-black uppercase">Synthesizing high-impact project concepts...</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                {aiSuggestions.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF7EE] border-2 border-black flex items-start justify-between gap-3 shadow-[2px_2px_0px_#000000]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 border border-black bg-black text-[#DFFF4F] uppercase">
                          {p.project_type}
                        </span>
                        <h3 className="font-black text-xs text-black uppercase">{p.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed font-normal">{p.elevator_pitch}</p>
                      {p.target_tech_stack && (
                        <p className="text-[10px] font-mono text-[#0047FF] font-black uppercase">&bull; {p.target_tech_stack}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddAiProject(p)}
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
      )}
    </div>
  );
}
