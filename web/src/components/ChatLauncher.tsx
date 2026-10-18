'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  ChatMessage,
  QdrantStatus,
} from '@/types';
import {
  Bot,
  Layers,
  Search,
  Scale,
  Send,
  Loader2,
  X,
  Maximize2,
  Database,
  AlertTriangle,
  Zap,
  Check,
  Plus,
  Trash2,
  Target,
} from 'lucide-react';

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
  const [activeTabPerMessage, setActiveTabPerMessage] = useState<{ [msgId: string]: 'judge' | 'researcher' | 'planner' }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOnChatPage = pathname === '/chat';

  // Load telemetry & MongoDB history on open
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (!qdrantStatus) {
        api.getQdrantStatus().then(setQdrantStatus).catch(() => {});
      }
      api.getChatHistory().then((res) => {
        if (res && res.history) setMessages(res.history);
      }).catch(() => {});
    }
  }, [isOpen, isAuthenticated, qdrantStatus]);

  // Sub-agent stepper animation while submitting
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
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0051FF] via-[#0038b8] to-[#1e1b4b] text-white font-bold text-xs shadow-2xl border border-white/30 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,81,255,0.6)] cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-black/30 border border-white/20 flex items-center justify-center p-0.5">
              <Bot className="w-3.5 h-3.5 text-[#C6FF20]" />
            </div>
            <span className="tracking-wide">AI Copilot & Sub-Agents</span>
            <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
          </button>
        )}
      </div>

      {/* Floating Flyout Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[480px] h-[620px] max-h-[85vh] rounded-3xl bg-[#090b11]/95 text-white border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-white/30 flex items-center justify-center p-1">
                <Bot className="w-3.5 h-3.5 text-[#C6FF20]" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
                  <span>DevCommand Copilot</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20]" />
                  <span>3 Sub-Agents Active • Qdrant RAG</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-white/10 transition-colors"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/chat');
                }}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/60 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[#C6FF20]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Ask Anything or Pitch an Idea</h4>
                  <p className="text-[11px] text-white/60 mt-1 max-w-xs">
                    Our 3 sub-agents automatically research competitors, judge viability, and draft blueprints.
                  </p>
                </div>
                <div className="w-full space-y-1.5 pt-2">
                  <button
                    onClick={() => handleSendMessage('Should we add biometric authentication to our application?')}
                    className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 transition-colors"
                  >
                    💡 Should we add biometric authentication?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Evaluate building an automated subscription billing system')}
                    className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 transition-colors"
                  >
                    💳 Evaluate automated subscription billing
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
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="text-[10px] font-mono text-white/40 px-1">
                      {msg.role === 'user' ? 'You' : 'DevCommand AI'}
                    </div>

                    <div
                      className={`rounded-2xl p-3.5 max-w-[92%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white border border-blue-400/40'
                          : 'bg-white text-slate-900 border border-white/30 shadow-xl'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="space-y-3">
                          {/* If Sub-Agents executed */}
                          {isPipeline && sub.judge && (
                            <div className="space-y-2.5">
                              {/* Executive Score Header */}
                              <div className="p-3 rounded-xl bg-slate-950 text-white border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                                    THE JUDGE
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-sm text-white">
                                      {sub.judge.score}/100
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
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
                                <p className="text-[11px] text-slate-300 leading-normal">
                                  {sub.judge.summary_verdict}
                                </p>
                              </div>

                              {/* Sub-Agent Tabs */}
                              <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5 text-[11px] font-mono">
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'judge' }))}
                                  className={`px-2 py-1 rounded-lg font-bold ${
                                    tab === 'judge' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Judge
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'researcher' }))}
                                  className={`px-2 py-1 rounded-lg font-bold ${
                                    tab === 'researcher' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Researcher
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'planner' }))}
                                  className={`px-2 py-1 rounded-lg font-bold ${
                                    tab === 'planner' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Planner
                                </button>
                              </div>

                              {/* Tab Content */}
                              {tab === 'judge' && (
                                <div className="space-y-2 text-[11px] text-slate-700">
                                  <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    {sub.judge.brutal_critique}
                                  </p>
                                  {sub.judge.what_to_build_instead && (
                                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 space-y-0.5">
                                      <div className="font-bold font-mono text-[10px] text-purple-700">ALTERNATIVE:</div>
                                      <div>{sub.judge.what_to_build_instead}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {tab === 'researcher' && sub.researcher && (
                                <div className="text-[11px] text-slate-700 bg-sky-50/50 p-2.5 rounded-lg border border-sky-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                                  {sub.researcher.content}
                                </div>
                              )}

                              {tab === 'planner' && sub.planner && (
                                <div className="text-[11px] text-slate-700 space-y-2">
                                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                                    {sub.pivot_plan ? sub.pivot_plan.content : sub.planner.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Conversational content if no subagent pipeline */}
                          {(!isPipeline || !sub?.judge) && (
                            <div className="whitespace-pre-wrap text-slate-900 leading-relaxed text-xs">
                              {msg.content}
                            </div>
                          )}

                          {/* Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-slate-500">
                              <span className="font-bold text-slate-700">Qdrant Context:</span>
                              {msg.citations.slice(0, 2).map((c, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
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

            {/* Submitting Stepper */}
            {isSubmitting && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#C6FF20]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-bold">Coordinating 3 Sub-Agents...</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div className={`p-1.5 rounded-lg border ${activeStep >= 2 ? 'bg-sky-950/60 border-sky-400 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    1. Researcher
                  </div>
                  <div className={`p-1.5 rounded-lg border ${activeStep >= 3 ? 'bg-rose-950/60 border-rose-400 text-rose-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    2. Judge
                  </div>
                  <div className={`p-1.5 rounded-lg border ${activeStep >= 4 ? 'bg-blue-950/60 border-blue-400 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    3. Planner
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white/[0.03] border-t border-white/10 space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pitch a feature idea or ask a codebase question..."
                className="flex-1 bg-black/40 border border-white/20 text-white placeholder-white/40 text-xs rounded-xl p-2.5 outline-none focus:border-[#C6FF20] resize-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isSubmitting || !inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-[#C6FF20] hover:bg-[#b2ee13] text-black font-bold flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
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
