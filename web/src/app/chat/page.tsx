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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const starterPrompts = [
    'Should we build an automated WhatsApp concept import bot for DevCommand?',
    'Evaluate adding biometric WebAuthn security keys to our Next.js authentication flow',
    'Evaluate building an offline PWA caching service worker for poor network conditions',
    'What features would make DevCommand 10x more valuable for solo full-stack developers?',
  ];

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-black relative flex flex-col font-sans selection:bg-[#DFFF4F] selection:text-black">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-8 pb-12 flex-1 flex flex-col relative z-10">
        
        {/* Top Control Bar: Title + Telemetry + Project Scope */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#0047FF] border border-black inline-block" />
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest font-black">
                DEVCOMMAND AUTONOMOUS COPILOT &bull; MULTI-AGENT SWARM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight flex items-center gap-3">
              <span>Single Copilot &amp; Sub-Agents</span>
            </h1>
            <p className="text-xs text-neutral-600 mt-1 font-mono">
              Single unified interface coordinating <strong className="text-[#0047FF] uppercase">Market Researcher</strong>, <strong className="text-[#FF5533] uppercase">The Judge</strong>, and <strong className="text-black uppercase">Feature Planner</strong> sub-agents with Qdrant Cloud RAG.
            </p>
          </div>

          {/* Controls: RAG Status, Project Scope, Clear History */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project Scope Selector */}
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1.5 text-xs font-mono font-black shadow-[2px_2px_0px_#000000]">
              <FolderGit2 className="w-3.5 h-3.5 text-[#0047FF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-black uppercase outline-none cursor-pointer text-xs font-black"
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
            <div className={`px-3 py-1.5 border-2 border-black flex items-center gap-2 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#000000] ${
              qdrantStatus?.connected
                ? 'bg-[#BBF7D0] text-black'
                : 'bg-amber-200 text-black'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{qdrantStatus?.connected ? 'QDRANT: ONLINE' : 'CONNECTING'}</span>
              {qdrantStatus?.points_count !== undefined && (
                <span className="px-1.5 py-0.2 bg-black text-[#DFFF4F] text-[10px]">
                  {qdrantStatus.points_count} PTS
                </span>
              )}
            </div>

            {/* Sync Knowledge Button */}
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="px-3.5 py-1.5 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-black text-xs font-mono font-black uppercase flex items-center gap-1.5 transition shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
              title="Index all projects and features into Qdrant Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKnowledge ? 'animate-spin' : ''}`} />
              <span>{isSyncingKnowledge ? 'INDEXING...' : 'SYNC'}</span>
            </button>

            {/* Clear History Button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={isClearingHistory}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 border-2 border-black text-rose-800 text-xs font-mono font-black uppercase flex items-center gap-1.5 transition shadow-[2px_2px_0px_#000000] cursor-pointer"
                title="Clear cloud chat history in MongoDB Atlas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            )}

            {syncMessage && (
              <span className="text-xs font-mono text-black font-black uppercase px-2 py-1 bg-[#DFFF4F] border-2 border-black animate-fade-in shadow-[2px_2px_0px_#000000]">
                {syncMessage}
              </span>
            )}
          </div>
        </div>

        {/* Conversation Box (Scrollable) */}
        <div className="flex-1 bg-white border-2 border-black p-4 sm:p-6 my-4 overflow-y-auto min-h-[460px] max-h-[640px] space-y-4 shadow-[6px_6px_0px_#000000]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-16 h-16 bg-[#0047FF] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000000] mb-4 p-3">
                <Bot className="w-8 h-8 text-[#DFFF4F]" />
              </div>
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-2">
                What feature or idea would you like to evaluate?
              </h2>
              <p className="text-xs text-neutral-600 max-w-md mb-6 leading-relaxed font-mono">
                Pitch any feature or ask any codebase question. When you suggest an idea, our 3 sub-agents automatically coordinate to research competitors, judge viability, and engineer the blueprint.
              </p>

              {/* Starter Prompt Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 gap-2 text-left">
                <div className="text-[11px] font-mono text-black uppercase font-black tracking-wider px-1">
                  Try pitching an idea to the sub-agent pipeline:
                </div>
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 bg-[#FAF7EE] hover:bg-[#DFFF4F] border-2 border-black text-xs text-black font-mono font-bold flex items-center justify-between group transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-all" />
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
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-600 font-black uppercase px-1">
                    <span>{msg.role === 'user' ? 'YOU' : (hasSubAgents ? 'DEVCOMMAND COPILOT (SUB-AGENT PIPELINE)' : 'DEVCOMMAND AI')}</span>
                    <span>&bull;</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.tier_used && <span className="text-[#0047FF]">[{msg.tier_used}]</span>}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`max-w-4xl p-5 text-sm leading-relaxed border-2 border-black ${
                      msg.role === 'user'
                        ? 'bg-[#0047FF] text-white shadow-[4px_4px_0px_#000000]'
                        : 'bg-[#FAF7EE] text-black shadow-[6px_6px_0px_#000000] w-full'
                    }`}
                  >
                    {/* User message */}
                    {msg.role === 'user' && (
                      <div className="whitespace-pre-wrap font-sans text-sm font-medium">
                        {msg.content}
                      </div>
                    )}

                    {/* Assistant Message */}
                    {msg.role === 'assistant' && (
                      <div className="space-y-4">
                        {/* Copy / Actions Bar */}
                        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                          <div className="flex items-center gap-2">
                            {hasSubAgents ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-black uppercase bg-[#DFFF4F] text-black border border-black">
                                <Bot className="w-3.5 h-3.5 text-black" />
                                <span>3 Sub-Agents Executed</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-0.5 text-[11px] font-mono font-black uppercase bg-white text-black border border-black">
                                Conversational Copilot
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-mono font-bold cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-black">Copied</span>
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
                            <div className="p-4 bg-black text-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-700">
                                <div>
                                  <div className="text-[10px] font-mono text-[#DFFF4F] uppercase tracking-widest font-black">
                                    THE JUDGE SUB-AGENT VERDICT
                                  </div>
                                  <div className="text-base font-black tracking-tight mt-0.5 text-white uppercase">
                                    {subData.judge.verdict_title || 'Feature Viability Rating'}
                                  </div>
                                </div>

                                {/* Score Gauge & Signal Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right font-mono">
                                    <span className="text-2xl font-black text-white">{subData.judge.score}</span>
                                    <span className="text-xs text-neutral-400">/100</span>
                                  </div>
                                  <div
                                    className={`px-3 py-1.5 font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 border border-black ${
                                      subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? 'bg-[#DFFF4F] text-black'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                        ? 'bg-amber-400 text-black'
                                        : 'bg-[#FF5533] text-black'
                                    }`}
                                  >
                                    <span>{subData.judge.verdict_signal.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-neutral-200 leading-relaxed font-mono">
                                {subData.judge.summary_verdict}
                              </p>
                            </div>

                            {/* 2. Sub-Agent Interactive Tabs */}
                            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                              {/* Tab 1: The Judge */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'judge' }))}
                                className={`px-3 py-1.5 text-xs font-black font-mono uppercase flex items-center gap-1.5 border-2 border-black cursor-pointer transition-all ${
                                  activeTab === 'judge'
                                    ? 'bg-[#FF5533] text-black shadow-[2px_2px_0px_#000000]'
                                    : 'bg-white text-black hover:bg-neutral-100'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>1. The Judge</span>
                              </button>

                              {/* Tab 2: Market Researcher */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'researcher' }))}
                                className={`px-3 py-1.5 text-xs font-black font-mono uppercase flex items-center gap-1.5 border-2 border-black cursor-pointer transition-all ${
                                  activeTab === 'researcher'
                                    ? 'bg-[#0047FF] text-white shadow-[2px_2px_0px_#000000]'
                                    : 'bg-white text-black hover:bg-neutral-100'
                                }`}
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>2. Researcher</span>
                              </button>

                              {/* Tab 3: Feature Planner */}
                              <button
                                onClick={() => setActiveTabPerMessage((prev) => ({ ...prev, [msg.id]: 'planner' }))}
                                className={`px-3 py-1.5 text-xs font-black font-mono uppercase flex items-center gap-1.5 border-2 border-black cursor-pointer transition-all ${
                                  activeTab === 'planner'
                                    ? 'bg-[#DFFF4F] text-black shadow-[2px_2px_0px_#000000]'
                                    : 'bg-white text-black hover:bg-neutral-100'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>3. Feature Planner</span>
                              </button>
                            </div>

                            {/* Tab Content 1: The Judge */}
                            {activeTab === 'judge' && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-3 bg-white border-2 border-black space-y-1.5 shadow-[2px_2px_0px_#000000]">
                                  <div className="font-mono text-black uppercase tracking-wider text-[11px] font-black">
                                    Unvarnished Assessment
                                  </div>
                                  <p className="text-neutral-800 leading-relaxed font-mono">
                                    {subData.judge.brutal_critique}
                                  </p>
                                </div>

                                {/* Strengths vs Fatal Flaws */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Fatal Flaws */}
                                  <div className="p-3 bg-rose-50 border-2 border-black space-y-1.5 shadow-[2px_2px_0px_#000000]">
                                    <div className="font-black text-rose-800 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Fatal Flaws &amp; Risks</span>
                                    </div>
                                    <ul className="space-y-1 text-black font-mono text-[11px]">
                                      {(subData.judge.failure_modes || []).map((flaw, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-rose-600 font-black">&bull;</span>
                                          <span>{flaw}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* What To Build Instead */}
                                  <div className="p-3 bg-[#FAF7EE] border-2 border-black space-y-1.5 shadow-[2px_2px_0px_#000000]">
                                    <div className="font-black text-[#0047FF] flex items-center gap-1.5 font-mono text-[11px] uppercase">
                                      <Zap className="w-3.5 h-3.5 text-[#0047FF]" />
                                      <span>Smart Alternative Proposal</span>
                                    </div>
                                    <p className="text-black leading-relaxed font-mono text-[11px]">
                                      {subData.judge.what_to_build_instead || 'Focus on the simplest verifiable MVP slice first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab Content 2: Market Researcher */}
                            {activeTab === 'researcher' && subData.researcher && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                <div className="p-4 bg-white border-2 border-black leading-relaxed whitespace-pre-wrap font-mono text-black shadow-[2px_2px_0px_#000000]">
                                  {subData.researcher.content}
                                </div>
                              </div>
                            )}

                            {/* Tab Content 3: Feature Planner */}
                            {activeTab === 'planner' && subData.planner && (
                              <div className="space-y-3 animate-fade-in text-xs">
                                {subData.pivot_plan && (
                                  <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-black">
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'pivot' }))}
                                      className={`flex-1 py-1 px-2.5 font-black font-mono text-[11px] uppercase flex items-center justify-center gap-1.5 border-2 cursor-pointer transition-all ${
                                        plannerSubTab === 'pivot'
                                          ? 'bg-[#0047FF] text-white border-black shadow-[1px_1px_0px_#000000]'
                                          : 'border-transparent text-neutral-600 hover:text-black'
                                      }`}
                                    >
                                      <Target className="w-3.5 h-3.5" />
                                      <span>Recommended Pivot Plan</span>
                                    </button>
                                    <button
                                      onClick={() => setPlannerSubTabPerMessage((prev) => ({ ...prev, [msg.id]: 'original' }))}
                                      className={`flex-1 py-1 px-2.5 font-black font-mono text-[11px] uppercase flex items-center justify-center gap-1.5 border-2 cursor-pointer transition-all ${
                                        plannerSubTab === 'original'
                                          ? 'bg-black text-[#DFFF4F] border-black shadow-[1px_1px_0px_#000000]'
                                          : 'border-transparent text-neutral-600 hover:text-black'
                                      }`}
                                    >
                                      <span>Original Pitch Draft</span>
                                    </button>
                                  </div>
                                )}

                                {/* Blueprint Content */}
                                <div className="p-4 bg-white border-2 border-black leading-relaxed whitespace-pre-wrap font-mono text-black shadow-[2px_2px_0px_#000000]">
                                  {subData.pivot_plan && plannerSubTab === 'pivot'
                                    ? subData.pivot_plan.content
                                    : subData.planner.content}
                                </div>

                                {/* 1-Click Feature Roadmap Additions */}
                                {((subData.pivot_plan && plannerSubTab === 'pivot'
                                  ? subData.pivot_plan.suggested_features
                                  : subData.planner.suggested_features) || []).length > 0 && (
                                  <div className="pt-2 space-y-2">
                                    <div className="font-mono font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
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
                                            className="p-3 bg-white border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]"
                                          >
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 text-[10px] font-mono font-black bg-black text-[#DFFF4F] border border-black uppercase">
                                                  {feat.priority}
                                                </span>
                                                <span className="font-black text-black text-xs">{feat.title}</span>
                                              </div>
                                              <p className="text-[11px] text-neutral-600 leading-normal font-mono">
                                                {feat.description}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => handleAddSuggestedFeature(feat, itemKey)}
                                              disabled={isAdded}
                                              className={`px-3 py-1.5 text-xs font-black font-mono uppercase shrink-0 border-2 border-black flex items-center gap-1.5 transition cursor-pointer ${
                                                isAdded
                                                  ? 'bg-[#BBF7D0] text-black cursor-default shadow-none'
                                                  : 'bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
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

                        {/* Conversational Output */}
                        {(!hasSubAgents || !subData.judge) && (
                          <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-black">
                            {msg.content}
                          </div>
                        )}

                        {/* Grounded RAG Citations Bar */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t-2 border-black flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-600 font-black uppercase">
                            <div className="flex items-center gap-1 text-black">
                              <Database className="w-3 h-3 text-[#0047FF]" />
                              <span>Qdrant Vectors:</span>
                            </div>
                            {msg.citations.map((cite, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white border border-black text-black flex items-center gap-1"
                              >
                                <span>[{cite.entity_type || 'code'}]</span>
                                <span>{cite.title}</span>
                                <span className="text-[#0047FF]">
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
              <div className="bg-white text-black border-2 border-black p-5 shadow-[4px_4px_0px_#000000] w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-black text-xs font-mono font-black uppercase">
                  <div className="flex items-center gap-2 text-black">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0047FF]" />
                    <span>ORCHESTRATING SUB-AGENTS</span>
                  </div>
                  <span className="text-neutral-500">Pipeline Active</span>
                </div>

                {/* Animated 4-Stage Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] font-black uppercase">
                  <div className={`p-2 border-2 border-black flex items-center gap-2 ${
                    activeStep >= 1 ? 'bg-[#BBF7D0] text-black shadow-[1px_1px_0px_#000000]' : 'bg-[#FAF7EE] text-neutral-400'
                  }`}>
                    {activeStep >= 1 ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-black shrink-0" />}
                    <span className="truncate">1. Context</span>
                  </div>

                  <div className={`p-2 border-2 border-black flex items-center gap-2 ${
                    activeStep >= 2 ? 'bg-[#0047FF] text-white shadow-[1px_1px_0px_#000000]' : 'bg-[#FAF7EE] text-neutral-400'
                  }`}>
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">2. Researcher</span>
                  </div>

                  <div className={`p-2 border-2 border-black flex items-center gap-2 ${
                    activeStep >= 3 ? 'bg-[#FF5533] text-black shadow-[1px_1px_0px_#000000]' : 'bg-[#FAF7EE] text-neutral-400'
                  }`}>
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">3. Judge</span>
                  </div>

                  <div className={`p-2 border-2 border-black flex items-center gap-2 ${
                    activeStep >= 4 ? 'bg-[#DFFF4F] text-black shadow-[1px_1px_0px_#000000]' : 'bg-[#FAF7EE] text-neutral-400'
                  }`}>
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">4. Planner</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-neutral-600 pt-1">
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
        <div className="bg-white border-2 border-black p-3.5 shadow-[6px_6px_0px_#000000] space-y-2">
          {/* Quick Prompts Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-mono text-black uppercase font-black shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#0047FF]" /> Quick Ideas:
            </span>
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(prompt)}
                className="px-2.5 py-1 bg-[#FAF7EE] hover:bg-[#DFFF4F] border border-black text-black text-[11px] font-mono font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer"
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
              className="flex-1 bg-[#FAF7EE] border-2 border-black text-black placeholder-neutral-500 text-sm font-mono p-3 outline-none focus:bg-white transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputValue.trim()}
              className="w-12 h-12 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-bold flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 px-2 pt-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-black font-black uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>MongoDB Cloud History &amp; Qdrant RAG Active</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
