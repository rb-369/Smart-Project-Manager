'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer, PageHeader } from '@/components/AppShell';
import { ChatMessage, QdrantStatus, ProjectSummary } from '@/types';
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
import { Button } from '@/components/ui/Button';
import { Badge, PriorityBadge } from '@/components/ui/Badge';

/**
 * Message ids must be unique but stable across renders. Generating them in
 * a module-scope helper keeps the component body pure.
 */
let messageCounter = 0;
function nextMessageId(role: string): string {
  messageCounter += 1;
  return `${role}-${Date.now()}-${messageCounter}`;
}

const SUB_AGENT_TABS = [
  { id: 'judge', label: 'The Judge', icon: Scale },
  { id: 'researcher', label: 'Market Researcher', icon: Search },
  { id: 'planner', label: 'Feature Planner', icon: Layers },
] as const;

const PIPELINE_STAGES = [
  { key: 1, label: 'Context', detail: 'Querying Qdrant Cloud vectors for your codebase context…' },
  { key: 2, label: 'Researcher', detail: 'Discovering competitors and evaluating feasibility…' },
  { key: 3, label: 'The Judge', detail: 'Scoring viability, brutal critique and fatal flaws…' },
  { key: 4, label: 'Planner', detail: 'Drafting the architecture blueprint and roadmap tasks…' },
] as const;

export default function ChatPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated, sessionError } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Active sub-agent tab per message ID
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{
    [msgId: string]: 'researcher' | 'judge' | 'planner';
  }>({});
  // Planner sub-tab per message ID (pivot vs original)
  const [plannerSubTabPerMessage, setPlannerSubTabPerMessage] = useState<{
    [msgId: string]: 'pivot' | 'original';
  }>({});

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
    if (!authLoading && !isAuthenticated && !sessionError) {
      router.push('/login?next=/chat');
    }
  }, [authLoading, isAuthenticated, sessionError, router]);

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
      const res: any = await api.getChatHistory(selectedProjectId || undefined);
      if (res && res.history) {
        setMessages(res.history);
      }
    } catch (err) {
      console.warn('Failed to load chat history from MongoDB Atlas:', err);
    }
  };

  // Fetch initial telemetry and project list
  useEffect(() => {
    if (isAuthenticated) {
      fetchQdrantStatus();
      fetchProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
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

  // Grow the composer with its content instead of clipping it.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [inputValue]);

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
      const res: any = await api.syncKnowledgeBase();
      setSyncMessage(`Indexed ${res.points_indexed} vectors in Qdrant`);
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
      id: nextMessageId('user'),
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
        id: nextMessageId('ai'),
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
        id: nextMessageId('ai-err'),
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

  const handleAddSuggestedFeature = async (
    feature: { title: string; priority: string; description: string },
    key: string,
  ) => {
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

  const starterPrompts = [
    'Should we build an automated receipt OCR scanning feature?',
    'Design an automated Stripe subscription billing system with webhooks',
    'Evaluate building real-time audio chat in our web application',
    'Explain how authentication and repository syncing work in my codebase',
  ];

  return (
    <AppShell>
      <Navbar />

      <PageContainer className="flex flex-col pb-28">
        <PageHeader
          eyebrow={
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-lime-300">
              DevCommand autonomous copilot
            </span>
          }
          title="Copilot &amp; sub-agents"
          description={
            <>
              One interface coordinating the{' '}
              <strong className="text-brand-blue-200">market researcher</strong>, the{' '}
              <strong className="text-brand-violet-200">judge</strong>, and the{' '}
              <strong className="text-brand-lime-300">feature planner</strong> — grounded in
              your repositories through Qdrant RAG.
            </>
          }
          actions={
            <>
              {/* Project scope */}
              <div className="surface-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs">
                <FolderGit2 className="h-3.5 w-3.5 text-brand-lime-400" aria-hidden="true" />
                <label htmlFor="chat-scope" className="sr-only">
                  Scope the conversation to a project
                </label>
                <select
                  id="chat-scope"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="max-w-[11rem] cursor-pointer bg-transparent text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime-400 [&>option]:bg-ink-900 [&>option]:text-white"
                >
                  <option value="">All repositories</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qdrant telemetry */}
              <div
                className={`surface-chip flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[0.6875rem] font-semibold ${
                  qdrantStatus?.connected ? '' : 'opacity-70'
                }`}
              >
                <Database
                  className={`h-3.5 w-3.5 ${
                    qdrantStatus?.connected ? 'text-brand-lime-400' : 'text-amber-300'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {qdrantStatus?.connected ? 'Qdrant online' : 'Qdrant connecting'}
                </span>
                {qdrantStatus?.points_count !== undefined && (
                  <span className="rounded bg-black/30 px-1.5 py-px text-[0.625rem]">
                    {qdrantStatus.points_count} pts
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncKnowledge}
                disabled={isSyncingKnowledge}
                className="surface-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[0.6875rem] font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                title="Index all projects and features into Qdrant Cloud"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncingKnowledge ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isSyncingKnowledge ? 'Indexing…' : 'Index'}</span>
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className="surface-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[0.6875rem] font-bold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  title="Clear cloud chat history in MongoDB Atlas"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              )}
            </>
          }
        />

        {syncMessage && (
          <div
            role="status"
            aria-live="polite"
            className="animate-fade-in-up rounded-full border border-brand-lime-400/30 bg-brand-lime-400/10 px-3 py-1.5 font-mono text-[0.6875rem] font-bold text-brand-lime-300"
          >
            {syncMessage}
          </div>
        )}

        {/* ================= CONVERSATION ================= */}
        <section
          aria-label="Conversation"
          className="surface-card mt-4 flex min-h-[30rem] flex-1 flex-col overflow-hidden rounded-3xl"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              /* ---------- Empty state ---------- */
              <div className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center">
                <div className="relative">
                  <div
                    className="absolute -inset-4 rounded-full bg-brand-blue-500/10 blur-xl"
                    aria-hidden="true"
                  />
                  <div className="relative grid h-16 w-16 place-items-center rounded-3xl border border-brand-blue-500/20 bg-gradient-to-br from-brand-blue-400 to-brand-blue-700 shadow-e2">
                    <Bot className="h-8 w-8 text-brand-lime-400" aria-hidden="true" />
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <h2 className="text-h2 font-extrabold tracking-tight text-ink-950">
                    What should we build next?
                  </h2>
                  <p className="text-[0.8125rem] leading-relaxed text-ink-500">
                    Pitch a feature or ask anything about your codebase. When you suggest an
                    idea, the three sub-agents coordinate automatically — research, judge,
                    blueprint.
                  </p>
                </div>

                <div className="w-full max-w-2xl text-left">
                  <div className="eyebrow mb-2 px-1 text-ink-400">
                    Try pitching an idea
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="group surface-well flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[0.8125rem] leading-snug text-ink-700 transition-[background-color,border-color,transform] duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-blue-500/30 hover:bg-white"
                      >
                        <span>{prompt}</span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-brand-blue-500"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const subData = msg.subagent_data;
                const hasSubAgents = subData && subData.is_pipeline;
                const activeTab = activeTabPerMessage[msg.id] || 'judge';
                const plannerSubTab = plannerSubTabPerMessage[msg.id] || 'pivot';
                const isUser = msg.role === 'user';

                return (
                  <div key={msg.id} className="space-y-2">
                    {/* Attribution */}
                    <div
                      className={`flex items-center gap-2 font-mono text-[0.6875rem] ${
                        isUser ? 'justify-end text-ink-400' : 'text-ink-400'
                      }`}
                    >
                      {!isUser && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-blue-500 text-white">
                          <Bot className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                      <span className="font-bold text-ink-600">
                        {isUser ? 'You' : hasSubAgents ? 'DevCommand council' : 'DevCommand AI'}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.tier_used && (
                        <span className="rounded bg-ink-100 px-1.5 py-px text-[0.625rem] text-ink-500">
                          {msg.tier_used}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    {isUser ? (
                      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-blue-500 px-4 py-3 text-sm leading-relaxed text-white shadow-e2">
                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Action bar */}
                        <div className="flex items-center justify-between gap-3">
                          <Badge tone={hasSubAgents ? 'violet' : 'neutral'} size="xs">
                            {hasSubAgents ? '3 sub-agents executed' : 'Conversational'}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="inline-flex items-center gap-1 font-mono text-[0.6875rem] text-ink-400 transition-colors hover:text-ink-700"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {hasSubAgents && subData.judge && (
                          <div className="space-y-4">
                            {/* ---- The Judge verdict: deep brand panel ---- */}
                            <div className="gridster-panel-deep space-y-3 p-5">
                              <div className="flex flex-col justify-between gap-3 border-b border-white/15 pb-3 sm:flex-row sm:items-center">
                                <div>
                                  <div className="eyebrow text-brand-lime-300">
                                    The Judge — verdict
                                  </div>
                                  <div className="mt-0.5 text-[0.9375rem] font-extrabold tracking-tight text-white">
                                    {subData.judge.verdict_title || 'Feature Viability Rating'}
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="font-mono text-right">
                                    <span className="text-2xl font-black text-white">
                                      {subData.judge.score}
                                    </span>
                                    <span className="text-xs text-white/50">/100</span>
                                  </div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.625rem] font-black uppercase tracking-wider ${
                                      subData.judge.verdict_signal === 'BUILD_NOW'
                                        ? 'bg-emerald-500 text-black'
                                        : subData.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                          ? 'bg-amber-400 text-black'
                                          : 'bg-rose-500 text-white'
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        subData.judge.verdict_signal === 'BUILD_NOW'
                                          ? 'bg-black'
                                          : subData.judge.verdict_signal ===
                                              'PROCEED_WITH_CAUTION'
                                            ? 'bg-black'
                                            : 'bg-white'
                                      }`}
                                      aria-hidden="true"
                                    />
                                    {subData.judge.verdict_signal.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[0.8125rem] leading-relaxed text-white/80">
                                {subData.judge.summary_verdict}
                              </p>
                            </div>

                            {/* ---- Sub-agent tabs ---- */}
                            <div
                              role="tablist"
                              aria-label="Sub-agent output"
                              className="surface-well flex flex-wrap items-center gap-1 rounded-2xl p-1"
                            >
                              {SUB_AGENT_TABS.map(({ id, label, icon: Icon }, index) => {
                                const selected = activeTab === id;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    onClick={() =>
                                      setActiveTabPerMessage((prev) => ({
                                        ...prev,
                                        [msg.id]: id,
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.6875rem] font-bold transition-colors ${
                                      selected
                                        ? id === 'judge'
                                          ? 'bg-brand-violet-500 text-white shadow-e1'
                                          : id === 'researcher'
                                            ? 'bg-brand-blue-500 text-white shadow-e1'
                                            : 'bg-brand-lime-400 text-black shadow-lime'
                                        : 'text-ink-500 hover:bg-white hover:text-ink-800'
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>
                                      {index + 1}. {label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* ---- Tab content ---- */}
                            {activeTab === 'judge' && (
                              <div role="tabpanel" className="space-y-3">
                                <div className="surface-well space-y-1.5 rounded-2xl p-4">
                                  <div className="eyebrow text-ink-500">
                                    Unvarnished assessment
                                  </div>
                                  <p className="text-[0.8125rem] leading-relaxed text-ink-700">
                                    {subData.judge.brutal_critique}
                                  </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                    <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-rose-700">
                                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Fatal flaws</span>
                                    </div>
                                    <ul className="space-y-1 text-[0.75rem] text-ink-700">
                                      {(subData.judge.failure_modes || []).map((flaw, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="font-bold text-rose-500" aria-hidden="true">
                                            •
                                          </span>
                                          <span>{flaw}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="rounded-2xl border border-brand-violet-200 bg-brand-violet-50 p-4">
                                    <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-brand-violet-700">
                                      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Judge&apos;s alternative</span>
                                    </div>
                                    <p className="text-[0.75rem] leading-relaxed text-ink-700">
                                      {subData.judge.what_to_build_instead ||
                                        'Focus on the simplest verifiable MVP slice first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTab === 'researcher' && subData.researcher && (
                              <div role="tabpanel" className="surface-well rounded-2xl p-4">
                                <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-700">
                                  {subData.researcher.content}
                                </p>
                              </div>
                            )}

                            {activeTab === 'planner' && subData.planner && (
                              <div role="tabpanel" className="space-y-3">
                                {subData.pivot_plan && (
                                  <div
                                    role="tablist"
                                    aria-label="Planner draft"
                                    className="surface-well flex items-center gap-1 rounded-2xl p-1"
                                  >
                                    <button
                                      type="button"
                                      role="tab"
                                      aria-selected={plannerSubTab === 'pivot'}
                                      onClick={() =>
                                        setPlannerSubTabPerMessage((prev) => ({
                                          ...prev,
                                          [msg.id]: 'pivot',
                                        }))
                                      }
                                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-[0.6875rem] font-bold transition-colors ${
                                        plannerSubTab === 'pivot'
                                          ? 'bg-brand-lime-400 text-black shadow-lime'
                                          : 'text-ink-500 hover:bg-white hover:text-ink-800'
                                      }`}
                                    >
                                      <Target className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Recommended pivot</span>
                                    </button>
                                    <button
                                      type="button"
                                      role="tab"
                                      aria-selected={plannerSubTab === 'original'}
                                      onClick={() =>
                                        setPlannerSubTabPerMessage((prev) => ({
                                          ...prev,
                                          [msg.id]: 'original',
                                        }))
                                      }
                                      className={`flex-1 rounded-xl px-2.5 py-1.5 font-mono text-[0.6875rem] font-bold transition-colors ${
                                        plannerSubTab === 'original'
                                          ? 'bg-ink-800 text-white'
                                          : 'text-ink-500 hover:bg-white hover:text-ink-800'
                                      }`}
                                    >
                                      Original draft
                                    </button>
                                  </div>
                                )}

                                <div className="surface-well rounded-2xl p-4">
                                  <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-700">
                                    {subData.pivot_plan && plannerSubTab === 'pivot'
                                      ? subData.pivot_plan.content
                                      : subData.planner.content}
                                  </p>
                                </div>

                                {((subData.pivot_plan && plannerSubTab === 'pivot'
                                  ? subData.pivot_plan.suggested_features
                                  : subData.planner.suggested_features) || []).length > 0 && (
                                  <div className="space-y-2">
                                    <div className="eyebrow flex items-center gap-1.5 text-ink-500">
                                      <Layers className="h-3.5 w-3.5 text-brand-blue-500" aria-hidden="true" />
                                      <span>Add to project roadmap</span>
                                    </div>
                                    <div className="grid gap-2">
                                      {(subData.pivot_plan && plannerSubTab === 'pivot'
                                        ? subData.pivot_plan.suggested_features
                                        : subData.planner.suggested_features
                                      ).map((feat, idx) => {
                                        const itemKey = `feat-${msg.id}-${plannerSubTab}-${idx}`;
                                        const isAdded = addedItemIds[itemKey];
                                        return (
                                          <div
                                            key={idx}
                                            className="surface-card flex flex-col items-start justify-between gap-3 rounded-2xl p-3.5 transition-colors hover:border-brand-blue-500/30 sm:flex-row sm:items-center"
                                          >
                                            <div className="min-w-0 space-y-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <PriorityBadge
                                                  priority={feat.priority as 'P0' | 'P1' | 'P2' | 'P3'}
                                                  size="xs"
                                                />
                                                <span className="text-[0.8125rem] font-bold text-ink-900">
                                                  {feat.title}
                                                </span>
                                              </div>
                                              <p className="text-[0.75rem] leading-relaxed text-ink-500">
                                                {feat.description}
                                              </p>
                                            </div>
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleAddSuggestedFeature(feat, itemKey)
                                              }
                                              disabled={isAdded}
                                              variant={isAdded ? 'outline' : 'secondary'}
                                              iconLeft={
                                                isAdded ? (
                                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                ) : (
                                                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                                )
                                              }
                                              className="shrink-0"
                                            >
                                              {isAdded ? 'Added' : 'Add to roadmap'}
                                            </Button>
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

                        {(!hasSubAgents || !subData.judge) && (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
                            {msg.content}
                          </div>
                        )}

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-200/80 pt-3 font-mono text-[0.6875rem] text-ink-500">
                            <span className="inline-flex items-center gap-1 font-bold text-ink-600">
                              <Database className="h-3 w-3 text-brand-blue-500" aria-hidden="true" />
                              <span>Qdrant context</span>
                            </span>
                            {msg.citations.map((cite, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5"
                              >
                                <span className="capitalize text-ink-400">
                                  [{cite.entity_type || 'code'}]
                                </span>
                                <span className="font-bold text-ink-700">{cite.title}</span>
                                <span className="text-brand-blue-600">
                                  {(cite.score * 100).toFixed(0)}%
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* ---- Orchestration stepper ---- */}
            {isSubmitting && (
              <div
                role="status"
                aria-live="polite"
                className="gridster-panel-deep space-y-3 p-5"
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-brand-lime-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Orchestrating sub-agents</span>
                  </div>
                  <span className="font-mono text-[0.625rem] text-white/50">
                    Multi-agent pipeline
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PIPELINE_STAGES.map((stage) => {
                    const done = activeStep > stage.key;
                    const active = activeStep === stage.key;
                    return (
                      <div
                        key={stage.key}
                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 font-mono text-[0.6875rem] transition-colors ${
                          active
                            ? 'border-brand-lime-400/50 bg-brand-lime-400/15 text-brand-lime-200'
                            : done
                              ? 'border-white/20 bg-white/10 text-white/85'
                              : 'border-white/10 bg-black/20 text-white/45'
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-brand-lime-400" aria-hidden="true" />
                        ) : (
                          <span
                            className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                              active ? 'border-brand-lime-400' : 'border-white/25'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">{stage.label}</span>
                      </div>
                    );
                  })}
                </div>

                <p className="font-mono text-[0.6875rem] text-white/60">
                  {PIPELINE_STAGES.find((s) => s.key === activeStep)?.detail ??
                    'Waiting for the pipeline…'}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* ================= COMPOSER ================= */}
        <section className="surface-card mt-4 space-y-3 rounded-3xl p-3 sm:p-4">
          {/* Quick ideas */}
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]">
              <span className="eyebrow flex shrink-0 items-center gap-1 text-ink-400">
                <Zap className="h-3 w-3 text-brand-blue-500" aria-hidden="true" />
                Quick ideas
              </span>
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputValue(prompt)}
                  className="surface-well shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[0.6875rem] text-ink-600 transition-colors hover:bg-white hover:text-ink-900"
                >
                  {prompt.length > 50 ? `${prompt.slice(0, 50)}…` : prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Message the DevCommand Copilot
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pitch a feature idea, ask about competitors, or evaluate an architectural change…"
              className="surface-well min-h-[4.5rem] min-w-0 flex-1 resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputValue.trim()}
              aria-label="Send message"
              className="h-12 w-12 shrink-0 p-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[0.6875rem] text-ink-400">
            <span>Enter to send · Shift+Enter for a new line</span>
            <span className="inline-flex items-center gap-1 text-brand-blue-600">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>MongoDB history &amp; Qdrant RAG active</span>
            </span>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
