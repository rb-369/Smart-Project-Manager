'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ChatMessage, QdrantStatus } from '@/types';
import {
  Bot,
  Search,
  Scale,
  Send,
  Loader2,
  X,
  Maximize2,
  Layers,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ChatLauncherContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [qdrantStatus, setQdrantStatus] = useState<QdrantStatus | null>(null);
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{
    [msgId: string]: 'judge' | 'researcher' | 'planner';
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOnChatPage = pathname === '/chat';

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (!qdrantStatus) {
        api.getQdrantStatus().then(setQdrantStatus).catch(() => {});
      }
      api.getChatHistory()
        .then((res) => {
          if (res && res.history) setMessages(res.history);
        })
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated, qdrantStatus]);

  useEffect(() => {
    if (!isSubmitting) {
      setActiveStep(0);
      return;
    }
    setActiveStep(1);
    const t1 = setTimeout(() => setActiveStep(2), 1200);
    const t2 = setTimeout(() => setActiveStep(3), 2500);
    const t3 = setTimeout(() => setActiveStep(4), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSubmitting, activeStep]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isAuthenticated || pathname === '/login' || pathname === '/register') {
    return null;
  }

  if (isOnChatPage) {
    return null;
  }

  const handleSendMessage = async (text?: string) => {
    const query = (text || inputValue).trim();
    if (!query || isSubmitting) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSubmitting(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage({
        message: query,
        mode: 'auto',
        history,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.response,
        mode: res.mode,
        subagent_data: res.subagent_data,
        citations: res.citations,
        tier_used: res.tier_used,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err?.message || 'Failed to reach AI Copilot.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
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

  const handleClearHistory = async () => {
    if (!confirm('Clear chat history from MongoDB Atlas?')) return;
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch (err: any) {
      alert(`Clear failed: ${err?.message || 'Error'}`);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Copilot and sub-agents"
            className="group flex items-center gap-2.5 rounded-full border border-white/25 bg-gradient-to-r from-brand-blue-500 via-brand-blue-600 to-brand-blue-800 px-3.5 py-3 font-mono text-[0.6875rem] font-bold text-white shadow-deep transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_0_28px_-6px_rgba(0,56,255,0.7)]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg border border-white/20 bg-black/25">
              <Bot className="h-3.5 w-3.5 text-brand-lime-400" aria-hidden="true" />
            </span>
            <span className="hidden tracking-wide sm:inline">AI Copilot &amp; Sub-Agents</span>
            <span className="sm:hidden">Copilot</span>
            <span className="h-2 w-2 rounded-full bg-brand-lime-400 pulse-lime" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Flyout */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="DevCommand Copilot"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-white/15 bg-ink-950/95 text-white shadow-deep backdrop-blur-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:w-[480px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl border border-white/20 bg-gradient-to-br from-brand-blue-400 to-brand-blue-700">
                <Bot className="h-3.5 w-3.5 text-brand-lime-400" aria-hidden="true" />
              </span>
              <div>
                <h3 className="flex items-center gap-1.5 text-[0.75rem] font-bold tracking-tight">
                  DevCommand Copilot
                </h3>
                <div className="flex items-center gap-1.5 font-mono text-[0.625rem] text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-lime-400" aria-hidden="true" />
                  <span>3 Sub-Agents Active • Qdrant RAG</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  aria-label="Clear chat history"
                  title="Clear chat history"
                  className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/chat');
                }}
                aria-label="Open full page chat"
                title="Expand to full page"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Copilot"
                title="Close"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white/60">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
                  <Bot className="h-6 w-6 text-brand-lime-400" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="text-[0.875rem] font-bold text-white">Ask anything or pitch an idea</h4>
                  <p className="mt-1 max-w-xs text-[0.6875rem] text-white/60">
                    Three sub-agents research competitors, judge viability, and draft blueprints.
                  </p>
                </div>
                <div className="w-full space-y-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Should we add biometric authentication to our application?',
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-left text-[0.6875rem] text-white/80 transition-colors hover:bg-white/10"
                  >
                    Should we add biometric authentication?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Evaluate building an automated subscription billing system',
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-left text-[0.6875rem] text-white/80 transition-colors hover:bg-white/10"
                  >
                    Evaluate automated subscription billing
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const sub = msg.subagent_data;
                const isPipeline = sub && sub.is_pipeline && sub.judge;
                const tab = activeTabPerMessage[msg.id] || 'judge';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="px-1 font-mono text-[0.625rem] text-white/40">
                      {msg.role === 'user' ? 'You' : 'DevCommand AI'}
                    </div>

                    <div
                      className={`max-w-[92%] rounded-2xl p-3.5 leading-relaxed ${
                        msg.role === 'user'
                          ? 'border border-brand-blue-400/40 bg-brand-blue-600 text-white'
                          : 'border border-ink-200 bg-white text-ink-900 shadow-e2'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="space-y-3">
                          {isPipeline && sub.judge && (
                            <div className="space-y-2.5">
                              <div className="space-y-1.5 rounded-xl border border-ink-800 bg-ink-950 p-3 text-white">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-ink-400">
                                    The Judge
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[0.8125rem] font-black">
                                      {sub.judge.score}/100
                                    </span>
                                    <span
                                      className={`rounded px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold ${
                                        sub.judge.verdict_signal === 'BUILD_NOW'
                                          ? 'bg-emerald-500 text-black'
                                          : sub.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                            ? 'bg-amber-400 text-black'
                                            : 'bg-rose-500 text-white'
                                      }`}
                                    >
                                      {sub.judge.verdict_signal.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[0.6875rem] leading-normal text-ink-300">
                                  {sub.judge.summary_verdict}
                                </p>
                              </div>

                              <div
                                role="tablist"
                                aria-label="Sub-agent output"
                                className="flex items-center gap-1 border-b border-ink-200 pb-1.5 font-mono text-[0.6875rem]"
                              >
                                {(
                                  [
                                    ['judge', 'Judge', Scale],
                                    ['researcher', 'Researcher', Search],
                                    ['planner', 'Planner', Layers],
                                  ] as const
                                ).map(([id, label, Icon]) => (
                                  <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === id}
                                    onClick={() =>
                                      setActiveTabPerMessage((p) => ({ ...p, [msg.id]: id }))
                                    }
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition-colors ${
                                      tab === id
                                        ? 'bg-brand-blue-500 text-white'
                                        : 'text-ink-600 hover:bg-ink-100'
                                    }`}
                                  >
                                    <Icon className="h-3 w-3" aria-hidden="true" />
                                    {label}
                                  </button>
                                ))}
                              </div>

                              {tab === 'judge' && (
                                <div className="space-y-2 text-[0.6875rem] text-ink-700">
                                  <p className="rounded-lg border border-ink-200 bg-ink-50 p-2.5 leading-relaxed">
                                    {sub.judge.brutal_critique}
                                  </p>
                                  {sub.judge.what_to_build_instead && (
                                    <div className="space-y-0.5 rounded-lg border border-brand-violet-200 bg-brand-violet-50 p-2.5 text-brand-violet-700">
                                      <div className="font-mono text-[0.625rem] font-bold text-brand-violet-600">
                                        Alternative
                                      </div>
                                      <div>{sub.judge.what_to_build_instead}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {tab === 'researcher' && sub.researcher && (
                                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-brand-blue-200 bg-brand-blue-50/60 p-2.5 text-[0.6875rem] leading-relaxed text-ink-700">
                                  {sub.researcher.content}
                                </div>
                              )}

                              {tab === 'planner' && sub.planner && (
                                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-ink-200 bg-ink-50 p-2.5 text-[0.6875rem] leading-relaxed text-ink-700">
                                  {sub.pivot_plan ? sub.pivot_plan.content : sub.planner.content}
                                </div>
                              )}
                            </div>
                          )}

                          {(!isPipeline || !sub?.judge) && (
                            <div className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-900">
                              {msg.content}
                            </div>
                          )}

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-200 pt-2 font-mono text-[0.625rem] text-ink-500">
                              <span className="font-bold text-ink-700">Qdrant context:</span>
                              {msg.citations.slice(0, 2).map((c, idx) => (
                                <span
                                  key={idx}
                                  className="rounded border border-ink-200 bg-ink-100 px-1.5 py-0.5"
                                >
                                  {c.title}
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

            {isSubmitting && (
              <div
                role="status"
                aria-live="polite"
                className="space-y-2 rounded-2xl border border-ink-800 bg-ink-950 p-3 font-mono text-[0.6875rem] text-white"
              >
                <div className="flex items-center gap-2 font-bold text-brand-lime-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Coordinating 3 sub-agents…</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[0.625rem]">
                  <div
                    className={`rounded-lg border p-1.5 ${
                      activeStep >= 2
                        ? 'border-brand-blue-400/60 bg-brand-blue-500/15 text-brand-blue-200'
                        : 'border-ink-800 bg-ink-900 text-ink-500'
                    }`}
                  >
                    1. Researcher
                  </div>
                  <div
                    className={`rounded-lg border p-1.5 ${
                      activeStep >= 3
                        ? 'border-brand-lime-400/60 bg-brand-lime-400/10 text-brand-lime-200'
                        : 'border-ink-800 bg-ink-900 text-ink-500'
                    }`}
                  >
                    2. Judge
                  </div>
                  <div
                    className={`rounded-lg border p-1.5 ${
                      activeStep >= 4
                        ? 'border-brand-violet-400/60 bg-brand-violet-500/15 text-brand-violet-200'
                        : 'border-ink-800 bg-ink-900 text-ink-500'
                    }`}
                  >
                    3. Planner
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="space-y-2 border-t border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="copilot-input" className="sr-only">
                Message the DevCommand Copilot
              </label>
              <textarea
                id="copilot-input"
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pitch a feature idea or ask a codebase question…"
                className="min-w-0 flex-1 resize-none rounded-xl border border-white/20 bg-black/40 p-2.5 text-xs text-white transition-colors placeholder:text-white/40 focus:border-brand-lime-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime-400"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={isSubmitting || !inputValue.trim()}
                aria-label="Send message"
                className="h-10 w-10 shrink-0 bg-brand-lime-400 p-0 text-black hover:bg-brand-lime-300"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ChatLauncher() {
  return (
    <Suspense fallback={null}>
      <ChatLauncherContent />
    </Suspense>
  );
}
