'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  ChatMessage,
  QdrantStatus,
  ProjectSummary,
  SubAgentData,
  RagCitation,
} from '@/types';
import {
  Bot,
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
  Trash2,
  Compass,
  ArrowRight,
  Target,
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Active sub-agent tab per message ID
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{ [msgId: string]: 'researcher' | 'judge' | 'planner' }>({});
  // Planner sub-tab per message ID (pivot vs original)
  const [plannerSubTabPerMessage, setPlannerSubTabPerMessage] = useState<{ [msgId: string]: 'pivot' | 'original' }>({});

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
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch initial telemetry, project list, and MongoDB cloud history
  useEffect(() => {
    if (isAuthenticated) {
      fetchQdrantStatus();
      fetchProjects();
      fetchHistory();
    }
  }, [isAuthenticated, selectedProjectId]);

  // Stepper animation timer when submitting
  useEffect(() => {
    if (!isSubmitting) {
      setActiveStep(0);
      return;
    }
    setActiveStep(1); // Stage 1: Context
    const timer1 = setTimeout(() => setActiveStep(2), 1200); // Stage 2: Researcher
    const timer2 = setTimeout(() => setActiveStep(3), 2500); // Stage 3: Judge
    const timer3 = setTimeout(() => setActiveStep(4), 3800); // Stage 4: Planner

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSubmitting]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting, activeStep]);

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

  const fetchHistory = async () => {
    try {
      const res = await api.getChatHistory(selectedProjectId || undefined);
      if (res && res.history) {
        setMessages(res.history);
      }
    } catch (err) {
      console.warn('Failed to load chat history from MongoDB Atlas:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history? This will remove saved conversations from MongoDB Atlas.')) {
      return;
    }
    setIsClearingHistory(true);
    try {
      await api.clearChatHistory(selectedProjectId || undefined);
      setMessages([]);
    } catch (err: any) {
      alert(`Failed to clear history: ${err?.message || 'Error'}`);
    } finally {
      setIsClearingHistory(false);
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
        mode: 'auto',
        project_id: selectedProjectId || undefined,
        history: historyPayload,
      });

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        mode: response.mode,
        subagent_data: response.subagent_data,
        citations: response.citations,
        tier_used: response.tier_used,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err?.message || 'Failed to reach AI Copilot. Please check backend connection.'}`,
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

  const handleAddSuggestedFeature = async (feature: { title: string; priority: string; description: string }, key: string) => {
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Starter Prompts
  const starterPrompts = [
    'Should we build an automated receipt OCR scanning feature?',
    'Design an automated Stripe subscription billing system with webhooks',
    'Evaluate building real-time audio chat in our web application',
    'Explain how authentication and repository syncing work in my codebase',
  ];

  return (
    <div className="min-h-screen bg-blue-grid text-white relative overflow-hidden flex flex-col font-sans selection:bg-[#C6FF20] selection:text-black">
      {/* Subtle Ambient Vignettes on Blue */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C6FF20]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-28 pb-12 flex-1 flex flex-col relative z-10">
        
        {/* Top Control Bar: Title + Telemetry + Project Scope */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span className="text-[11px] font-mono text-[#C6FF20] uppercase tracking-widest font-black">
                DEVCOMMAND AUTONOMOUS COPILOT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Single Copilot & Sub-Agents</span>
            </h1>
            <p className="text-xs text-white/80 mt-1">
              Single unified interface coordinating <strong className="text-sky-300">Market Researcher</strong>, <strong className="text-rose-300">The Judge</strong>, and <strong className="text-[#C6FF20]">Feature Planner</strong> sub-agents with Qdrant Cloud RAG.
            </p>
          </div>

          {/* Controls: RAG Status, Project Scope, Clear History */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project Scope Selector */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/20 rounded-full px-3 py-1 text-xs">
              <FolderGit2 className="w-3.5 h-3.5 text-[#C6FF20]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white text-xs outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">🌐 All Repositories</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    📦 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Qdrant Cloud Badge */}
            <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 text-xs font-mono font-semibold ${
              qdrantStatus?.connected
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{qdrantStatus?.connected ? 'Qdrant: Online' : 'Connecting'}</span>
              {qdrantStatus?.points_count !== undefined && (
                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                  {qdrantStatus.points_count} pts
                </span>
              )}
            </div>

            {/* Sync Knowledge Button */}
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Index all projects and features into Qdrant Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKnowledge ? 'animate-spin' : ''}`} />
              <span>{isSyncingKnowledge ? 'Indexing...' : 'Sync'}</span>
            </button>

            {/* Clear History Button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={isClearingHistory}
                className="px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                title="Clear cloud chat history in MongoDB Atlas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {syncMessage && (
              <span className="text-xs font-mono text-[#C6FF20] px-2 py-1 rounded bg-black/40 border border-[#C6FF20]/30 animate-fade-in">
                {syncMessage}
              </span>
            )}
          </div>
        </div>

        {/* Conversation Box (Scrollable) */}
        <div className="flex-1 bg-white/5 border border-white/15 rounded-3xl p-4 sm:p-6 my-4 overflow-y-auto min-h-[460px] max-h-[640px] space-y-4 shadow-2xl backdrop-blur-md">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border-2 border-white/30 flex items-center justify-center shadow-xl mb-4 p-3">
                <Bot className="w-8 h-8 text-[#C6FF20]" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mb-2">
                What feature or idea would you like to evaluate?
              </h2>
              <p className="text-xs text-white/70 max-w-md mb-6 leading-relaxed">
                Pitch any feature or ask any codebase question. When you suggest an idea, our 3 sub-agents automatically coordinate to research competitors, judge viability, and engineer the blueprint.
              </p>

              {/* Starter Prompt Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 gap-2 text-left">
                <div className="text-[11px] font-mono text-[#C6FF20] uppercase font-bold tracking-wider px-1">
                  Try pitching an idea to the sub-agent pipeline:
                </div>
                {starterPrompts.map((prompt, idx) => (
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
            messages.map((msg) => {
              const subData = msg.subagent_data;
              const hasSubAgents = subData && subData.is_pipeline;
              const activeTab = activeTabPerMessage[msg.id] || 'judge';
              const plannerSubTab = plannerSubTabPerMessage[msg.id] || 'pivot';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* Header label */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-white/60 px-1">
                    <span>{msg.role === 'user' ? 'You' : (hasSubAgents ? 'DevCommand Copilot (Sub-Agent Pipeline)' : 'DevCommand AI')}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.tier_used && <span className="text-[10px] text-[#C6FF20]">[{msg.tier_used}]</span>}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`max-w-4xl rounded-3xl p-5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
                        : 'bg-white text-slate-900 shadow-2xl border border-white/30 w-full'
                    }`}
                  >
                    {/* User message: just plain text */}
                    {msg.role === 'user' && (
                      <div className="whitespace-pre-wrap font-sans text-sm font-medium">
                        {msg.content}
                      </div>
                    )}

                    {/* Assistant Message: Check if unified sub-agent pipeline or conversational */}
                    {msg.role === 'assistant' && (
                      <div className="space-y-4">
                        {/* Copy / Actions Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            {hasSubAgents ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                <Bot className="w-3.5 h-3.5 text-blue-600" />
                                <span>3 Sub-Agents Executed</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Conversational Copilot
                              </div>
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

                        {/* ========================================================================= */}
                        {/* UNIFIED SUB-AGENT CARD (When Feature Pitch)                               */}
                        {/* ========================================================================= */}
                        {hasSubAgents && subData.judge && (
                          <div className="space-y-4">
                            {/* 1. Executive Verdict Banner */}
                            <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                <div>
                                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                    THE JUDGE SUB-AGENT VERDICT
                                  </div>
                                  <div className="text-base font-black tracking-tight mt-0.5 text-white">
                                    {subData.judge.verdict_title || 'Feature Viability Rating'}
                                  </div>
                                </div>

                                {/* Score Gauge & Signal Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right font-mono">
                                    <span className="text-2xl font-black text-white">{subData.judge.score}</span>
                                    <span className="text-xs text-slate-400">/100</span>
                                  </div>
                                  <div
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow ${
                                      subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                        ? 'bg-amber-400 text-black shadow-amber-400/20'
                                        : 'bg-rose-500 text-white shadow-rose-500/20'
                                    }`}
                                  >
                                    <span>
                                      {subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? '🟢'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                        ? '🟡'
                                        : '🔴'}
                                    </span>
                                    <span>{subData.judge.verdict_signal.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                {subData.judge.summary_verdict}
                              </p>
                            </div>

                            {/* 2. Sub-Agent Interactive Tabs */}
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                              {/* Tab 1: The Judge */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'judge' }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                                  activeTab === 'judge'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>1. The Judge</span>
                              </button>

                              {/* Tab 2: Market Researcher */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'researcher' }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                                  activeTab === 'researcher'
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>2. Market Researcher</span>
                              </button>

                              {/* Tab 3: Feature Planner */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'planner' }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                                  activeTab === 'planner'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>3. Feature Planner</span>
                              </button>
                            </div>

                            {/* Tab Content 1: The Judge */}
                            {activeTab === 'judge' && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                  <div className="font-bold font-mono text-slate-700 uppercase tracking-wider text-[11px]">
                                    Unvarnished Assessment
                                  </div>
                                  <p className="text-slate-700 leading-relaxed">
                                    {subData.judge.brutal_critique}
                                  </p>
                                </div>

                                {/* Strengths vs Fatal Flaws Bento */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Fatal Flaws */}
                                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
                                    <div className="font-bold text-rose-700 flex items-center gap-1.5 font-mono text-[11px]">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>FATAL FLAWS & RISKS</span>
                                    </div>
                                    <ul className="space-y-1 text-slate-700">
                                      {(subData.judge.failure_modes || []).map((flaw, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-rose-600 font-bold">•</span>
                                          <span>{flaw}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* What To Build Instead */}
                                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
                                    <div className="font-bold text-purple-700 flex items-center gap-1.5 font-mono text-[11px]">
                                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                                      <span>SMART ALTERNATIVE (JUDGE&apos;S CHOICE)</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">
                                      {subData.judge.what_to_build_instead || 'Focus on the simplest verifiable MVP slice first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab Content 2: Market Researcher */}
                            {activeTab === 'researcher' && subData.researcher && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80 leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                                  {subData.researcher.content}
                                </div>
                              </div>
                            )}

                            {/* Tab Content 3: Feature Planner */}
                            {activeTab === 'planner' && subData.planner && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                {/* If Smart Pivot exists, offer sub-toggle between Pivot Plan vs Original Draft */}
                                {subData.pivot_plan && (
                                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200">
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'pivot' }))}
                                      className={`flex-1 py-1 px-2.5 rounded-lg font-bold font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                                        plannerSubTab === 'pivot'
                                          ? 'bg-purple-600 text-white shadow'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      <Target className="w-3.5 h-3.5" />
                                      <span>🎯 Recommended Pivot Plan</span>
                                    </button>
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'original' }))}
                                      className={`flex-1 py-1 px-2.5 rounded-lg font-bold font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                                        plannerSubTab === 'original'
                                          ? 'bg-slate-700 text-white shadow'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      <span>Original Pitch Draft</span>
                                    </button>
                                  </div>
                                )}

                                {/* Blueprint Content */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                                  {subData.pivot_plan && plannerSubTab === 'pivot'
                                    ? subData.pivot_plan.content
                                    : subData.planner.content}
                                </div>

                                {/* 1-Click Feature Roadmap Additions */}
                                {((subData.pivot_plan && plannerSubTab === 'pivot'
                                  ? subData.pivot_plan.suggested_features
                                  : subData.planner.suggested_features) || []).length > 0 && (
                                  <div className="pt-2 space-y-2">
                                    <div className="font-mono font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                                      <span>1-Click Add to Project Roadmap</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {(subData.pivot_plan && plannerSubTab === 'pivot'
                                        ? subData.pivot_plan.suggested_features
                                        : subData.planner.suggested_features
                                      ).map((feat, idx) => {
                                        const itemKey = `feat-${msg.id}-${plannerSubTab}-${idx}`;
                                        const isAdded = addedItemIds[itemKey];
                                        return (
                                          <div
                                            key={idx}
                                            className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400 transition-colors shadow-sm"
                                          >
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700">
                                                  {feat.priority}
                                                </span>
                                                <span className="font-bold text-slate-900 text-xs">{feat.title}</span>
                                              </div>
                                              <p className="text-[11px] text-slate-600 leading-normal">
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
                                                  <span>Added</span>
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
                              </div>
                            )}
                          </div>
                        )}

                        {/* Conversational Output (When not running 3-agent pipeline) */}
                        {(!hasSubAgents || !subData.judge) && (
                          <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-900">
                            {msg.content}
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
                                <span className="capitalize text-slate-400">[{cite.entity_type || 'code'}]</span>
                                <span className="font-bold">{cite.title}</span>
                                <span className="text-[9px] text-blue-600">
                                  {(cite.score * 100).toFixed(0)}%
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Submitting Live Multi-Agent Stepper Indicator */}
          {isSubmitting && (
            <div className="flex items-start space-y-2 animate-fade-in w-full max-w-2xl">
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#C6FF20] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C6FF20]" />
                    <span>ORCHESTRATING SUB-AGENTS</span>
                  </div>
                  <span className="text-slate-400">Multi-Agent Pipeline</span>
                </div>

                {/* Animated 4-Stage Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {/* Step 1: Qdrant Context */}
                  <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                    activeStep >= 1 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {activeStep >= 1 ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />}
                    <span className="truncate">1. Context</span>
                  </div>

                  {/* Step 2: Market Researcher */}
                  <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                    activeStep >= 2 ? (activeStep === 2 ? 'bg-sky-950/80 border-sky-400 text-sky-100 ring-1 ring-sky-400/40 shadow-xs' : 'bg-sky-950/40 border-sky-500/40 text-sky-300') : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {activeStep > 2 ? <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" /> : <Search className={`w-3.5 h-3.5 shrink-0 ${activeStep === 2 ? 'text-sky-300' : ''}`} />}
                    <span className="truncate">2. Researcher</span>
                  </div>

                  {/* Step 3: The Judge */}
                  <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                    activeStep >= 3 ? (activeStep === 3 ? 'bg-rose-950/80 border-rose-400 text-rose-100 ring-1 ring-rose-400/40 shadow-xs' : 'bg-rose-950/40 border-rose-500/40 text-rose-300') : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {activeStep > 3 ? <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" /> : <Scale className={`w-3.5 h-3.5 shrink-0 ${activeStep === 3 ? 'text-rose-300' : ''}`} />}
                    <span className="truncate">3. The Judge</span>
                  </div>

                  {/* Step 4: Feature Planner */}
                  <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                    activeStep >= 4 ? 'bg-blue-950/80 border-blue-400 text-blue-100 ring-1 ring-blue-400/40 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Layers className={`w-3.5 h-3.5 shrink-0 ${activeStep === 4 ? 'text-blue-300' : ''}`} />
                    <span className="truncate">4. Planner</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  {activeStep === 1 && 'Querying Qdrant Cloud vectors for user repository codebase context...'}
                  {activeStep === 2 && 'Market Researcher Sub-Agent is discovering competitors and evaluating feasibility...'}
                  {activeStep === 3 && 'The Judge Sub-Agent is calculating feature score, brutal critique, and fatal flaws...'}
                  {activeStep >= 4 && 'Feature Planner Sub-Agent is drafting architecture blueprint and roadmap tasks...'}
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
            {starterPrompts.map((prompt, idx) => (
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
              placeholder="Pitch a feature idea, ask about competitors, or evaluate an architectural change..."
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
              <span>MongoDB Cloud History & Qdrant RAG Active</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
