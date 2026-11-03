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
} from '@/types';
import { OpenUIRenderer } from '@/components/openui/OpenUIRenderer';
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
  Trash2,
  Target,
  Sparkles,
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Active sub-agent tab per message ID
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{ [msgId: string]: 'openui' | 'researcher' | 'judge' | 'planner' }>({});
  // Planner sub-tab per message ID (pivot vs original)
  const [plannerSubTabPerMessage, setPlannerSubTabPerMessage] = useState<{ [msgId: string]: 'pivot' | 'original' }>({});

  // Projects for Grounded Context
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Qdrant Telemetry State & OpenUI / OUI-1 Status
  const [qdrantStatus, setQdrantStatus] = useState<QdrantStatus | null>(null);
  const [oui1Status, setOui1Status] = useState<any>(null);
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
      fetchOui1Status();
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

  const fetchOui1Status = async () => {
    try {
      const status = await api.getOui1Status();
      setOui1Status(status);
    } catch (err) {
      console.warn('Failed to fetch OUI-1 status:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res: any = await api.get('/projects');
      setProjects(res || []);
    } catch (err) {
      console.warn('Failed to fetch projects list:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.getChatHistory(selectedProjectId || undefined);
      if (res && res.history) {
        setMessages(res.history);
      }
    } catch (err) {
      console.warn('Failed to fetch chat history:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputValue).trim();
    if (!query || isSubmitting) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
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
        message: query,
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

      if (response.subagent_data?.is_pipeline) {
        setActiveTabPerMessage((prev) => ({
          ...prev,
          [assistantMessage.id]: 'judge',
        }));
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error generating response: ${err.message || 'Sub-agent communication failure.'}`,
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

  const handleSyncKnowledge = async () => {
    setIsSyncingKnowledge(true);
    setSyncMessage(null);
    try {
      const res = await api.syncKnowledgeBase();
      setSyncMessage(`✓ Indexed ${res.points_indexed} vectors in Qdrant`);
      fetchQdrantStatus();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage('Failed to sync knowledge.');
    } finally {
      setIsSyncingKnowledge(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all conversation history from MongoDB Atlas?')) return;
    setIsClearingHistory(true);
    try {
      await api.clearChatHistory(selectedProjectId || undefined);
      setMessages([]);
    } catch (err: any) {
      alert(`Failed to clear: ${err.message}`);
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleAddSuggestedFeature = async (
    feature: { title: string; priority: any; description?: string },
    itemKey: string
  ) => {
    if (!selectedProjectId) {
      alert('Please select a project in the top bar to attach this feature to.');
      return;
    }

    try {
      await api.post(`/projects/${selectedProjectId}/features`, {
        title: feature.title,
        priority: feature.priority || 'P1',
        description: feature.description,
      });

      setAddedItemIds((prev) => ({ ...prev, [itemKey]: true }));
    } catch (err: any) {
      alert(`Failed to add feature: ${err.message}`);
    }
  };

  const handleOpenUIAction = async (action: { name: string; params?: any }) => {
    const actName = (action.name || '').toLowerCase();
    if (actName.includes('add') || actName.includes('feature') || actName.includes('roadmap')) {
      const title = action.params?.title || 'Interactive OpenUI Feature';
      const priority = action.params?.priority || 'P1';
      await handleAddSuggestedFeature(
        { title, priority, description: 'Added from OpenUI interactive component.' },
        `openui-${Date.now()}`
      );
    } else {
      handleSendMessage(`Execute action: ${action.name} with params ${JSON.stringify(action.params || {})}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const starterPrompts = [
    'Should we build an automated WhatsApp concept import bot for DevCommand?',
    '⚡ Build an interactive sprint velocity dashboard with OpenUI',
    '📋 Generate an interactive roadmap & task checklist for user authentication',
    'Evaluate adding biometric WebAuthn security keys with interactive architecture',
  ];

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col relative z-10">
        
        {/* Top Control Bar: Title + Telemetry + Project Scope */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-neutral-200/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0047FF] animate-pulse inline-block" />
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">
                DEVCOMMAND AUTONOMOUS COPILOT &bull; MULTI-AGENT SWARM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-3">
              <span>Single Copilot &amp; Sub-Agents</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Single unified interface coordinating <strong className="text-[#0047FF] uppercase">Market Researcher</strong>, <strong className="text-[#FF5533] uppercase">The Judge</strong>, and <strong className="text-neutral-900 uppercase">Feature Planner</strong> sub-agents with Qdrant Cloud RAG.
            </p>
          </div>

          {/* Controls: RAG Status, Project Scope, Clear History */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project Scope Selector */}
            <div className="flex items-center gap-2 bg-white border border-neutral-200/90 rounded-xl px-3 py-1.5 text-xs font-mono font-bold shadow-xs hover:border-neutral-300 transition-all">
              <FolderGit2 className="w-3.5 h-3.5 text-[#0047FF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-neutral-900 uppercase outline-none cursor-pointer text-xs font-bold"
              >
                <option value="">🌐 ALL REPOSITORIES</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Qdrant Cloud Badge */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold uppercase shadow-xs ${
              qdrantStatus?.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{qdrantStatus?.connected ? 'QDRANT: ONLINE' : 'CONNECTING'}</span>
              {qdrantStatus?.points_count !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">
                  {qdrantStatus.points_count} PTS
                </span>
              )}
            </div>

            {/* OpenUI / OUI-1 Status Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold uppercase shadow-xs ${
                oui1Status?.connected
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-purple-50 border-purple-200 text-purple-800'
              }`}
              title={oui1Status?.message || 'OpenUI Generative UI with OUI-1 & Cascade'}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>{oui1Status?.connected ? 'OUI-1: ACTIVE' : 'OPENUI: CASCADE'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/80 border border-current/20">
                DSL
              </span>
            </div>

            {/* Sync Knowledge Button */}
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition shadow-xs active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              title="Index all projects and features into Qdrant Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKnowledge ? 'animate-spin text-[#0047FF]' : 'text-neutral-600'}`} />
              <span>{isSyncingKnowledge ? 'INDEXING...' : 'SYNC'}</span>
            </button>

            {/* Clear History Button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={isClearingHistory}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                title="Clear cloud chat history in MongoDB Atlas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            )}

            {syncMessage && (
              <span className="text-xs font-mono text-emerald-800 font-bold uppercase px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in shadow-xs">
                {syncMessage}
              </span>
            )}
          </div>
        </div>

        {/* Conversation Box (Scrollable) */}
        <div className="flex-1 bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 my-4 overflow-y-auto min-h-[480px] max-h-[660px] space-y-5 shadow-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0047FF] to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-50">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
                What feature or idea would you like to evaluate?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mb-6 leading-relaxed font-sans">
                Pitch any feature or ask any codebase question. Our 3 autonomous sub-agents coordinate instantly to research competitors, judge viability, and engineer the blueprint.
              </p>

              {/* 3-Pillars Sub-Agent Explainer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-6 text-left">
                <div className="rounded-xl p-3 bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0047FF] uppercase">
                    <Search className="w-3.5 h-3.5" />
                    <span>Researcher</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Discovers competitors, market gaps, and ecosystem precedents.
                  </p>
                </div>

                <div className="rounded-xl p-3 bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5533] uppercase">
                    <Scale className="w-3.5 h-3.5" />
                    <span>The Judge</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Scores viability (0-100), exposes fatal flaws, and advises pivots.
                  </p>
                </div>

                <div className="rounded-xl p-3 bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-900 uppercase">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Planner</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Builds actionable architectures with 1-click roadmap tasks.
                  </p>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3.5 rounded-xl bg-neutral-50/70 hover:bg-neutral-100 border border-neutral-200/80 text-xs text-neutral-800 font-sans font-medium flex items-center justify-between group transition-all shadow-xs hover:border-neutral-300 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#0047FF] group-hover:translate-x-1 shrink-0 ml-2 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const subData = msg.subagent_data;
              const hasSubAgents = subData && subData.is_pipeline;
              const activeTab = activeTabPerMessage[msg.id] || (subData?.openui_lang || msg.openui_lang ? 'openui' : 'judge');
              const plannerSubTab = plannerSubTabPerMessage[msg.id] || 'pivot';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Header label */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 font-medium px-1">
                    <span>{msg.role === 'user' ? 'YOU' : (hasSubAgents ? 'COPILOT SWARM' : 'DEVCOMMAND AI')}</span>
                    <span>&bull;</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.tier_used && <span className="text-[#0047FF] font-semibold">[{msg.tier_used}]</span>}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-tr-xs bg-neutral-900 text-white p-4 sm:p-5 shadow-xs max-w-2xl border border-neutral-800'
                        : 'rounded-2xl rounded-tl-xs bg-neutral-50/70 border border-neutral-200/80 p-5 sm:p-6 w-full max-w-4xl space-y-4 shadow-xs'
                    }`}
                  >
                    {/* User message */}
                    {msg.role === 'user' && (
                      <div className="whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {/* Assistant Message */}
                    {msg.role === 'assistant' && (
                      <div className="space-y-4">
                        {/* Copy / Actions Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
                          <div className="flex items-center gap-2">
                            {hasSubAgents ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300 rounded-full">
                                <Bot className="w-3.5 h-3.5 text-black" />
                                <span>3 Sub-Agents Executed</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-white text-neutral-700 border border-neutral-200 rounded-full">
                                Conversational Copilot
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-mono font-medium px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-neutral-200 transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* SUB-AGENT PIPELINE CARD */}
                        {hasSubAgents && subData.judge && (
                          <div className="space-y-4">
                            {/* 1. Executive Verdict Banner */}
                            <div className="p-4 sm:p-5 rounded-xl bg-neutral-900 text-white border border-neutral-800 shadow-sm space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                                <div>
                                  <div className="text-[10px] font-mono text-[#DFFF4F] uppercase tracking-widest font-bold">
                                    THE JUDGE SUB-AGENT VERDICT
                                  </div>
                                  <div className="text-base font-bold tracking-tight mt-0.5 text-white uppercase">
                                    {subData.judge.verdict_title || 'Feature Viability Rating'}
                                  </div>
                                </div>

                                {/* Score Gauge & Signal Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right font-mono">
                                    <span className="text-2xl font-bold text-white num-tabular">{subData.judge.score}</span>
                                    <span className="text-xs text-neutral-400">/100</span>
                                  </div>
                                  <div
                                    className={`px-3 py-1 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-full ${
                                      subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/20'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                        ? 'bg-amber-400 text-black'
                                        : 'bg-[#FF5533] text-white'
                                    }`}
                                  >
                                    <span>{subData.judge.verdict_signal.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                                {subData.judge.summary_verdict}
                              </p>
                            </div>

                            {/* 2. Sub-Agent Interactive Tabs */}
                            <div className="flex items-center gap-1 p-1 bg-neutral-200/60 rounded-xl border border-neutral-300/50">
                              {/* Tab 1: The Judge */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'judge' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'judge'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5 text-[#FF5533]" />
                                <span>1. The Judge</span>
                              </button>

                              {/* Tab 2: Market Researcher */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'researcher' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'researcher'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Search className="w-3.5 h-3.5 text-[#0047FF]" />
                                <span>2. Researcher</span>
                              </button>

                              {/* Tab 3: Feature Planner */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'planner' }))}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                  activeTab === 'planner'
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                                <span>3. Feature Planner</span>
                              </button>

                              {/* Tab 4: OpenUI Interactive UI */}
                              {(subData.openui_lang || msg.openui_lang) && (
                                <button
                                  onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'openui' }))}
                                  className={`px-3 py-1.5 text-xs font-bold font-mono uppercase flex items-center gap-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeTab === 'openui'
                                      ? 'bg-neutral-900 text-white shadow-xs'
                                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-white/50'
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#DFFF4F]" />
                                  <span>4. Interactive UI</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#DFFF4F] text-black">
                                    OUI-1
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Tab Content 1: The Judge */}
                            {activeTab === 'judge' && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-4 bg-white rounded-xl border border-neutral-200/90 space-y-1.5 shadow-xs">
                                  <div className="font-mono text-neutral-800 uppercase tracking-wider text-[11px] font-bold">
                                    Unvarnished Assessment
                                  </div>
                                  <p className="text-neutral-700 leading-relaxed font-sans text-xs">
                                    {subData.judge.brutal_critique}
                                  </p>
                                </div>

                                {/* Strengths vs Fatal Flaws */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Fatal Flaws */}
                                  <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-2 shadow-xs">
                                    <div className="font-bold text-rose-800 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Fatal Flaws &amp; Risks</span>
                                    </div>
                                    <ul className="space-y-1.5 text-neutral-800 font-sans text-xs">
                                      {(subData.judge.failure_modes || []).map((flaw, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-rose-500 font-bold">&bull;</span>
                                          <span>{flaw}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* What To Build Instead */}
                                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2 shadow-xs">
                                    <div className="font-bold text-[#0047FF] flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <Zap className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>Smart Alternative Proposal</span>
                                    </div>
                                    <p className="text-neutral-800 leading-relaxed font-sans text-xs">
                                      {subData.judge.what_to_build_instead || 'Focus on the simplest verifiable MVP slice first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab Content 2: Market Researcher */}
                            {activeTab === 'researcher' && subData.researcher && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-5 bg-white rounded-xl border border-neutral-200/90 leading-relaxed whitespace-pre-wrap font-sans text-xs text-neutral-800 shadow-xs">
                                  {subData.researcher.content}
                                </div>
                              </div>
                            )}

                            {/* Tab Content 3: Feature Planner */}
                            {activeTab === 'planner' && subData.planner && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                {subData.pivot_plan && (
                                  <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'pivot' }))}
                                      className={`flex-1 py-1.5 px-3 font-bold font-mono text-[11px] uppercase rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                        plannerSubTab === 'pivot'
                                          ? 'bg-white text-neutral-900 shadow-xs'
                                          : 'text-neutral-500 hover:text-neutral-900'
                                      }`}
                                    >
                                      <Target className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>Recommended Pivot Plan</span>
                                    </button>
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'original' }))}
                                      className={`flex-1 py-1.5 px-3 font-bold font-mono text-[11px] uppercase rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                        plannerSubTab === 'original'
                                          ? 'bg-white text-neutral-900 shadow-xs'
                                          : 'text-neutral-500 hover:text-neutral-900'
                                      }`}
                                    >
                                      <span>Original Pitch Draft</span>
                                    </button>
                                  </div>
                                )}

                                {/* Blueprint Content */}
                                <div className="p-5 bg-white rounded-xl border border-neutral-200/90 leading-relaxed whitespace-pre-wrap font-mono text-xs text-neutral-800 shadow-xs">
                                  {subData.pivot_plan && plannerSubTab === 'pivot'
                                    ? subData.pivot_plan.content
                                    : subData.planner.content}
                                </div>

                                {/* 1-Click Feature Roadmap Additions */}
                                {((subData.pivot_plan && plannerSubTab === 'pivot'
                                  ? subData.pivot_plan.suggested_features
                                  : subData.planner.suggested_features) || []).length > 0 && (
                                  <div className="pt-2 space-y-2">
                                    <div className="font-mono font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-[#0047FF]" />
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
                                            className="p-3.5 bg-white rounded-xl border border-neutral-200/90 hover:border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all"
                                          >
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-900 text-white rounded-md uppercase">
                                                  {feat.priority}
                                                </span>
                                                <span className="font-bold text-neutral-900 text-xs">{feat.title}</span>
                                              </div>
                                              <p className="text-[11px] text-neutral-500 leading-normal font-mono">
                                                {feat.description}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => handleAddSuggestedFeature(feat, itemKey)}
                                              disabled={isAdded}
                                              className={`px-3.5 py-1.5 text-xs font-bold font-mono uppercase shrink-0 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                                                isAdded
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                  : 'bg-neutral-900 hover:bg-[#0047FF] text-white shadow-xs active:translate-y-0.5'
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

                            {/* Tab Content 4: OpenUI Interactive UI */}
                            {activeTab === 'openui' && (subData.openui_lang || msg.openui_lang) && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <OpenUIRenderer
                                  content=""
                                  openuiLang={subData.openui_lang || msg.openui_lang}
                                  onAction={handleOpenUIAction}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Conversational Output with OpenUI Generative UI */}
                        {(!hasSubAgents || !subData.judge) && (
                          <OpenUIRenderer
                            content={msg.content}
                            openuiLang={msg.openui_lang || subData?.openui_lang}
                            onAction={handleOpenUIAction}
                          />
                        )}

                        {/* Grounded RAG Citations Bar */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-neutral-200/70 flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-500 font-bold uppercase">
                            <div className="flex items-center gap-1 text-neutral-700">
                              <Database className="w-3 h-3 text-[#0047FF]" />
                              <span>Qdrant Vectors:</span>
                            </div>
                            {msg.citations.map((cite, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-800 flex items-center gap-1.5 shadow-xs"
                              >
                                <span className="text-neutral-400">[{cite.entity_type || 'code'}]</span>
                                <span>{cite.title}</span>
                                <span className="text-[#0047FF] font-bold">
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

          {/* Submitting Stepper Indicator */}
          {isSubmitting && (
            <div className="flex items-start space-y-2 animate-fade-in w-full max-w-2xl">
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-sm w-full space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 text-xs font-mono font-bold uppercase">
                  <div className="flex items-center gap-2 text-neutral-900">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0047FF]" />
                    <span>ORCHESTRATING SUB-AGENTS</span>
                  </div>
                  <span className="text-neutral-400 font-medium">Pipeline Active</span>
                </div>

                {/* Animated 4-Stage Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] font-bold uppercase">
                  <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                    activeStep >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                  }`}>
                    {activeStep >= 1 ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />}
                    <span className="truncate">1. Context</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                    activeStep >= 2 ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                  }`}>
                    <Search className="w-3.5 h-3.5 shrink-0 text-[#0047FF]" />
                    <span className="truncate">2. Researcher</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                    activeStep >= 3 ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                  }`}>
                    <Scale className="w-3.5 h-3.5 shrink-0 text-[#FF5533]" />
                    <span className="truncate">3. Judge</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                    activeStep >= 4 ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 text-neutral-400'
                  }`}>
                    <Layers className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">4. Planner</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-neutral-500 pt-0.5">
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
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
          {/* Quick Prompts Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#0047FF]" /> Quick Ideas:
            </span>
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(prompt)}
                className="px-3 py-1 bg-neutral-100 hover:bg-[#DFFF4F]/70 text-neutral-700 hover:text-black rounded-full border border-neutral-200/70 text-[11px] font-mono font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt}
              </button>
            ))}
          </div>

          {/* Text Area & Submit */}
          <div className="flex items-end gap-2.5">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pitch a feature idea, ask about competitors, or evaluate an architectural change..."
              className="flex-1 bg-neutral-50/70 border border-neutral-200/90 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm font-sans p-3.5 outline-none focus:bg-white focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF]/10 transition-all resize-none leading-relaxed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputValue.trim()}
              className="w-12 h-12 rounded-xl bg-neutral-900 hover:bg-[#0047FF] text-white flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-xs active:translate-y-0.5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1 pt-0.5">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-neutral-600 font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>MongoDB Cloud History &amp; Qdrant RAG Active</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
