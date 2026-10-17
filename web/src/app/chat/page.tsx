'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  CopilotMode,
  ChatMessage,
  JudgeVerdict,
  QdrantStatus,
  ProjectSummary,
  SuggestedFeature,
  SuggestedProject,
} from '@/types';
import {
  Sparkles,
  Layers,
  Search,
  Scale,
  Send,
  Loader2,
  Database,
  RefreshCw,
  Plus,
  Check,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy,
  FolderGit2,
  ThumbsUp,
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<CopilotMode>('planner');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Projects for Grounded Context
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Qdrant Telemetry State
  const [qdrantStatus, setQdrantStatus] = useState<QdrantStatus | null>(null);
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Action status (e.g. feature added)
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch initial telemetry & project list
  useEffect(() => {
    if (isAuthenticated) {
      fetchQdrantStatus();
      fetchProjects();
    }
  }, [isAuthenticated]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const fetchQdrantStatus = async () => {
    try {
      const status = await api.getQdrantStatus();
      setQdrantStatus(status);
    } catch (err) {
      console.warn('Failed to fetch Qdrant status:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res: any = await api.get('/projects');
      setProjects(res || []);
    } catch (err) {
      console.warn('Failed to load projects for chat context:', err);
    }
  };

  const handleSyncKnowledge = async () => {
    setIsSyncingKnowledge(true);
    setSyncMessage(null);
    try {
      const res = await api.syncKnowledgeBase();
      setSyncMessage(`✓ Indexed ${res.points_indexed} vectors in Qdrant`);
      fetchQdrantStatus();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      setSyncMessage(err?.message || 'Sync failed');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncingKnowledge(false);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputValue).trim();
    if (!textToSend || isSubmitting) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      mode: mode,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSubmitting(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.sendChatMessage({
        message: textToSend,
        mode: mode,
        project_id: selectedProjectId || undefined,
        history: historyPayload,
      });

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        mode: response.mode,
        created_at: new Date().toISOString(),
        citations: response.citations,
        judge_verdict: response.judge_verdict,
        suggested_features: response.suggested_features,
        suggested_projects: response.suggested_projects,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err?.message || 'Failed to reach AI Copilot. Please check backend connection.'}`,
        mode: mode,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddSuggestedFeature = async (feature: SuggestedFeature, key: string) => {
    if (!selectedProjectId) {
      alert('Please select a target Project from the top selector first.');
      return;
    }
    try {
      await api.post(`/projects/${selectedProjectId}/features`, {
        title: feature.title,
        description: feature.description,
        priority: feature.priority,
      });
      setAddedItemIds((prev) => ({ ...prev, [key]: true }));
    } catch (err: any) {
      alert(`Failed to add feature: ${err?.message || 'Error'}`);
    }
  };

  const handleSaveSuggestedProject = async (proj: SuggestedProject, key: string) => {
    try {
      await api.post('/future-projects', {
        title: proj.title,
        elevator_pitch: proj.elevator_pitch,
        target_tech_stack: proj.target_tech_stack,
        project_type: proj.project_type,
        priority: proj.priority,
      });
      setAddedItemIds((prev) => ({ ...prev, [key]: true }));
    } catch (err: any) {
      alert(`Failed to save idea: ${err?.message || 'Error'}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Starter Prompts for each mode
  const quickPrompts: { [key in CopilotMode]: string[] } = {
    planner: [
      'Plan a real-time WebSocket milestone notifications system for our project',
      'Design an automated GitHub Actions CI/CD release workflow blueprint',
      'Deconstruct an end-to-end user export and backup feature with P0/P1 breakdown',
    ],
    researcher: [
      'Find top 3 SaaS competitors for automated roadmap decompilers and analyze feasibility',
      'Compare Supabase vs Qdrant vs Pinecone for multitenant code vector search',
      'Evaluate technical feasibility and latency risks of running local FastEmbed in WebAssembly',
    ],
    judge: [
      'Judge adding blockchain verification to every commit in this project',
      'Judge building a custom markdown rendering engine from scratch vs using unified/rehype',
      'Judge pivoting our product from project management to full AI agent orchestration',
    ],
  };

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-28 pb-12 flex-1 flex flex-col relative z-10">
        
        {/* Top Control Bar: Title + Qdrant Telemetry Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                DEVCOMMAND NEURAL COPILOT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>AI Copilot & The Judge</span>
            </h1>
            <p className="text-xs text-white/80 mt-1">
              Qdrant Cloud RAG grounded engineering intelligence with feature blueprints, competitor recon, and ruthless evaluation.
            </p>
          </div>

          {/* Qdrant Status & Telemetry Pill Box */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Qdrant Cloud Badge */}
            <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 text-xs font-mono font-semibold ${
              qdrantStatus?.connected
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{qdrantStatus?.connected ? 'Qdrant Cloud: Online' : 'Qdrant: In-Memory / Connecting'}</span>
              {qdrantStatus?.points_count !== undefined && (
                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                  {qdrantStatus.points_count} vectors
                </span>
              )}
            </div>

            {/* Sync Knowledge Button */}
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Index all projects, features, and incubator ideas into Qdrant Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKnowledge ? 'animate-spin' : ''}`} />
              <span>{isSyncingKnowledge ? 'Indexing...' : 'Sync RAG'}</span>
            </button>

            {syncMessage && (
              <span className="text-xs font-mono text-[#C6FF20] px-2 py-1 rounded bg-black/40 border border-[#C6FF20]/30 animate-fade-in">
                {syncMessage}
              </span>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs + Context Picker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 pb-4">
          
          {/* Mode Selector Tabs (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-3 gap-2">
            
            {/* Mode 1: Feature Planner */}
            <button
              onClick={() => setMode('planner')}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                mode === 'planner'
                  ? 'bg-white text-slate-900 border-[#C6FF20] shadow-xl shadow-[#C6FF20]/10 scale-[1.01]'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${mode === 'planner' ? 'bg-blue-600 text-white' : 'bg-white/10 text-[#C6FF20]'}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm tracking-tight">Feature Planner</span>
                </div>
                {mode === 'planner' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <p className={`text-[11px] leading-snug line-clamp-2 ${mode === 'planner' ? 'text-slate-600 font-medium' : 'text-white/70'}`}>
                Blueprints, API contracts, milestones & 1-click roadmap ingestion.
              </p>
            </button>

            {/* Mode 2: Researcher */}
            <button
              onClick={() => setMode('researcher')}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                mode === 'researcher'
                  ? 'bg-white text-slate-900 border-[#38bdf8] shadow-xl shadow-[#38bdf8]/10 scale-[1.01]'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${mode === 'researcher' ? 'bg-sky-600 text-white' : 'bg-white/10 text-sky-300'}`}>
                    <Search className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="font-black text-sm tracking-tight">Researcher</span>
                </div>
                {mode === 'researcher' && (
                  <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                )}
              </div>
              <p className={`text-[11px] leading-snug line-clamp-2 ${mode === 'researcher' ? 'text-slate-600 font-medium' : 'text-white/70'}`}>
                Competitor discovery, architecture feasibility & OSS alternatives.
              </p>
            </button>

            {/* Mode 3: The Judge */}
            <button
              onClick={() => setMode('judge')}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                mode === 'judge'
                  ? 'bg-white text-slate-900 border-rose-400 shadow-xl shadow-rose-500/10 scale-[1.01]'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${mode === 'judge' ? 'bg-rose-600 text-white' : 'bg-white/10 text-rose-300'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm tracking-tight">The Judge</span>
                </div>
                {mode === 'judge' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                )}
              </div>
              <p className={`text-[11px] leading-snug line-clamp-2 ${mode === 'judge' ? 'text-slate-600 font-medium' : 'text-white/70'}`}>
                Brutally honest 0-100 rating, fatal flaws & clear build/reject signal.
              </p>
            </button>
          </div>

          {/* Grounding Context Selector (4 cols) */}
          <div className="md:col-span-4 bg-white/10 border border-white/15 p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono mb-1 text-white/80">
              <span className="flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#C6FF20]" />
                <span>RAG Project Scope</span>
              </span>
              <span className="text-[10px] text-[#C6FF20]">Isolated User Partition</span>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-black/40 border border-white/20 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#C6FF20] transition-colors"
            >
              <option value="">🌐 All Repositories & Incubator Ideas</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.name} ({p.completed_features}/{p.total_features} features)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversation Box (Scrollable) */}
        <div className="flex-1 bg-white/5 border border-white/15 rounded-3xl p-4 sm:p-6 mb-4 overflow-y-auto min-h-[420px] max-h-[580px] space-y-4 shadow-2xl backdrop-blur-md">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border-2 border-white/30 flex items-center justify-center shadow-xl mb-4 p-3">
                <Sparkles className="w-8 h-8 text-[#C6FF20]" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mb-2">
                What are you building or evaluating today?
              </h2>
              <p className="text-xs text-white/70 max-w-md mb-6 leading-relaxed">
                DevCommand RAG analyzes your repositories and incubator ideas in Qdrant Cloud to deliver accurate technical blueprints, competitor research, and brutal feedback.
              </p>

              {/* Starter Prompt Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 gap-2 text-left">
                <div className="text-[11px] font-mono text-[#C6FF20] uppercase font-bold tracking-wider px-1">
                  Try a prompt in {mode.toUpperCase()} mode:
                </div>
                {quickPrompts[mode].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white/90 hover:text-white flex items-center justify-between group transition-all"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-[#C6FF20] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                {/* Header label */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-white/60 px-1">
                  <span>{msg.role === 'user' ? 'You' : `DevCommand AI (${msg.mode.toUpperCase()})`}</span>
                  <span>•</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Body */}
                <div
                  className={`max-w-3xl rounded-3xl p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
                      : 'bg-white text-slate-900 shadow-2xl border border-white/30'
                  }`}
                >
                  {/* Assistant Header & Copy Button */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        {msg.mode === 'judge' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            THE JUDGE
                          </span>
                        )}
                        {msg.mode === 'planner' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            FEATURE PLANNER
                          </span>
                        )}
                        {msg.mode === 'researcher' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-700 border border-sky-200">
                            RESEARCHER
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Special Widget: The Judge Verdict Score Card */}
                  {msg.judge_verdict && (
                    <div className="mb-5 p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                            UNFILTERED JUDGMENT
                          </div>
                          <div className="text-lg font-black tracking-tight mt-0.5">
                            Feature Viability Score
                          </div>
                        </div>

                        {/* Big Score Gauge & Verdict Signal */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-3xl font-black font-mono tracking-tight text-white">
                              {msg.judge_verdict.score}
                              <span className="text-sm text-slate-400 font-normal">/100</span>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1.5 rounded-xl font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                              msg.judge_verdict.verdict_signal === 'GREEN'
                                ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                                : msg.judge_verdict.verdict_signal === 'YELLOW'
                                ? 'bg-amber-400 text-black shadow-amber-400/20'
                                : 'bg-rose-500 text-white shadow-rose-500/20'
                            }`}
                          >
                            <span>
                              {msg.judge_verdict.verdict_signal === 'GREEN'
                                ? '🟢'
                                : msg.judge_verdict.verdict_signal === 'YELLOW'
                                ? '🟡'
                                : '🔴'}
                            </span>
                            <span>{msg.judge_verdict.verdict}</span>
                          </div>
                        </div>
                      </div>

                      {/* Strengths & Fatal Flaws Bento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Strengths */}
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
                          <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>STRENGTHS & PROS</span>
                          </div>
                          <ul className="space-y-1 text-slate-300">
                            {msg.judge_verdict.strengths.map((str, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Fatal Flaws */}
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-1.5">
                          <div className="font-bold text-rose-400 flex items-center gap-1.5 font-mono text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>FATAL FLAWS & RED FLAGS</span>
                          </div>
                          <ul className="space-y-1 text-slate-300">
                            {msg.judge_verdict.fatal_flaws.map((flaw, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>{flaw}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Pivot Advice */}
                      {msg.judge_verdict.pivot_advice && (
                        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
                          <div className="font-bold text-purple-300 font-mono text-[11px] mb-1 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-400" />
                            <span>THE JUDGE&apos;S PIVOT RECOMMENDATION (WHAT TO BUILD INSTEAD)</span>
                          </div>
                          <p className="text-purple-100 leading-relaxed">
                            {msg.judge_verdict.pivot_advice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Special Widget: Suggested Features (Planner Mode) */}
                  {msg.suggested_features && msg.suggested_features.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                      <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Suggested Roadmap Features (1-Click Add)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.suggested_features.map((feat, idx) => {
                          const itemKey = `feat-${msg.id}-${idx}`;
                          const isAdded = addedItemIds[itemKey];
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      feat.priority === 'P0'
                                        ? 'bg-rose-100 text-rose-700'
                                        : feat.priority === 'P1'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {feat.priority}
                                  </span>
                                  <h4 className="font-bold text-slate-900 text-sm">{feat.title}</h4>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {feat.description}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddSuggestedFeature(feat, itemKey)}
                                disabled={isAdded}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono shrink-0 flex items-center gap-1.5 transition-all ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Added to Roadmap</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add to Roadmap</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Widget: Suggested Projects (Planner Mode) */}
                  {msg.suggested_projects && msg.suggested_projects.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                      <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Recommended New Projects (Save to Incubator)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.suggested_projects.map((proj, idx) => {
                          const itemKey = `proj-${msg.id}-${idx}`;
                          const isAdded = addedItemIds[itemKey];
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-700">
                                    {proj.project_type}
                                  </span>
                                  <h4 className="font-bold text-slate-900 text-sm">{proj.title}</h4>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {proj.elevator_pitch}
                                </p>
                                <div className="text-[11px] font-mono text-purple-800">
                                  Stack: {proj.target_tech_stack}
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveSuggestedProject(proj, itemKey)}
                                disabled={isAdded}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono shrink-0 flex items-center gap-1.5 transition-all ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Saved to Incubator</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Save to Incubator</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grounded RAG Citations Bar */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-500">
                      <div className="flex items-center gap-1 text-slate-700 font-bold">
                        <Database className="w-3 h-3 text-[#0051FF]" />
                        <span>Qdrant Vectors Retrieved:</span>
                      </div>
                      {msg.citations.map((cite, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1"
                        >
                          <span className="capitalize text-slate-400">[{cite.type}]</span>
                          <span className="font-bold">{cite.title}</span>
                          <span className="text-[9px] text-blue-600">
                            {(cite.score * 100).toFixed(0)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Submitting Loading Spinner Indicator */}
          {isSubmitting && (
            <div className="flex items-start space-y-2">
              <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-white/30 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="text-xs font-mono text-slate-600">
                  {mode === 'judge'
                    ? 'The Judge is analyzing failure modes, market traps, and calculating verdict score...'
                    : mode === 'researcher'
                    ? 'Scanning competitor landscape, OSS libraries, and verifying architectural feasibility...'
                    : 'Querying Qdrant vectors and synthesizing feature blueprint...'}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Box */}
        <div className="bg-white/10 border border-white/20 rounded-3xl p-3 backdrop-blur-xl shadow-2xl space-y-2">
          
          {/* Quick Prompts Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-mono text-[#C6FF20] uppercase font-bold shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Quick Ideas:
            </span>
            {quickPrompts[mode].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(prompt)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] whitespace-nowrap transition-colors shrink-0 border border-white/10"
              >
                {prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt}
              </button>
            ))}
          </div>

          {/* Text Area & Submit */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'judge'
                  ? 'Describe a feature or idea for The Judge to ruthlessly rate and evaluate...'
                  : mode === 'researcher'
                  ? 'Ask about competitors, technical feasibility, architectural trade-offs, or libraries...'
                  : 'Describe a feature to plan, design API contracts, or decompose into milestones...'
              }
              className="flex-1 bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm rounded-2xl p-3 outline-none focus:border-[#C6FF20] transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputValue.trim()}
              className="w-12 h-12 rounded-2xl bg-[#C6FF20] hover:bg-[#b2ee13] text-black font-bold flex items-center justify-center shrink-0 shadow-lg shadow-[#C6FF20]/20 disabled:opacity-40 transition-all hover:scale-105"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 px-2 pt-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-[#C6FF20]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Qdrant Isolation Active</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
