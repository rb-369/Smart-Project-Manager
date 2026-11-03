'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  ChatMessage,
  QdrantStatus,
} from '@/types';
import { OpenUIRenderer } from '@/components/openui/OpenUIRenderer';
import {
  Bot,
  Send,
  Loader2,
  X,
  Maximize2,
  Trash2,
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
            className="group flex items-center gap-2.5 px-4 py-3 bg-neutral-900 hover:bg-[#0047FF] text-white font-mono font-bold text-xs rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border border-neutral-750"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center p-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="uppercase tracking-wider">AI COPILOT &bull; 3 AGENTS</span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </button>
        )}
      </div>

      {/* Floating Flyout Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[480px] h-[620px] max-h-[85vh] bg-[#F6F3EC] text-neutral-900 rounded-2xl border border-neutral-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-neutral-200/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0047FF] text-white flex items-center justify-center p-1 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-tight flex items-center gap-1.5 text-neutral-900">
                  <span>DEVCOMMAND COPILOT</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>3 SUB-AGENTS &bull; QDRANT RAG</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-rose-50 text-neutral-500 hover:text-rose-700 transition cursor-pointer"
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
                className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition cursor-pointer"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-neutral-900 hover:text-white text-neutral-600 transition cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#F6F3EC]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200/90 flex items-center justify-center shadow-xs">
                  <Bot className="w-6 h-6 text-[#0047FF]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 uppercase tracking-tight">PITCH AN IDEA OR QUERY REPOS</h4>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-xs font-sans">
                    Our 3 sub-agents automatically research competitors, judge viability, and draft blueprints.
                  </p>
                </div>
                <div className="w-full space-y-2 pt-2">
                  <button
                    onClick={() => handleSendMessage('Should we add biometric authentication to our application?')}
                    className="w-full text-left p-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/90 text-xs font-sans text-neutral-800 transition shadow-xs cursor-pointer"
                  >
                    💡 Should we add biometric authentication?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Evaluate building an automated subscription billing system')}
                    className="w-full text-left p-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/90 text-xs font-sans text-neutral-800 transition shadow-xs cursor-pointer"
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
                    <div className="text-[10px] font-mono text-neutral-400 font-medium px-1">
                      {msg.role === 'user' ? 'YOU' : 'COPILOT AI'}
                    </div>

                    <div
                      className={`p-3.5 max-w-[92%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-2xl rounded-tr-xs bg-neutral-900 text-white shadow-xs border border-neutral-800'
                          : 'rounded-2xl rounded-tl-xs bg-white text-neutral-900 border border-neutral-200/90 shadow-xs'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>
                      ) : (
                        <div className="space-y-3">
                          {/* If Sub-Agents executed */}
                          {isPipeline && sub.judge && (
                            <div className="space-y-2.5">
                              {/* Executive Score Header */}
                              <div className="p-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 shadow-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-[#DFFF4F] uppercase font-bold">
                                    THE JUDGE VERDICT
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-sm text-white">
                                      {sub.judge.score}/100
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                                        sub.judge.verdict_signal === 'BUILD_NOW'
                                          ? 'bg-emerald-500 text-white'
                                          : sub.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                          ? 'bg-amber-400 text-black'
                                          : 'bg-rose-500 text-white'
                                      }`}
                                    >
                                      {sub.judge.verdict_signal.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-neutral-300 leading-normal font-sans">
                                  {sub.judge.summary_verdict}
                                </p>
                              </div>

                              {/* Sub-Agent Tabs */}
                              <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-[11px] font-mono font-bold">
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'judge' }))}
                                  className={`px-2.5 py-1 rounded-md uppercase cursor-pointer transition-all ${
                                    tab === 'judge' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                                  }`}
                                >
                                  Judge
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'researcher' }))}
                                  className={`px-2.5 py-1 rounded-md uppercase cursor-pointer transition-all ${
                                    tab === 'researcher' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                                  }`}
                                >
                                  Researcher
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'planner' }))}
                                  className={`px-2.5 py-1 rounded-md uppercase cursor-pointer transition-all ${
                                    tab === 'planner' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                                  }`}
                                >
                                  Planner
                                </button>
                              </div>

                              {/* Tab Content */}
                              {tab === 'judge' && (
                                <div className="space-y-2 text-[11px] text-neutral-800">
                                  <p className="leading-relaxed bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 font-sans">
                                    {sub.judge.brutal_critique}
                                  </p>
                                  {sub.judge.what_to_build_instead && (
                                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-blue-950 space-y-0.5">
                                      <div className="font-mono text-[10px] text-[#0047FF] font-bold uppercase">ALTERNATIVE PROPOSAL:</div>
                                      <div className="font-sans">{sub.judge.what_to_build_instead}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {tab === 'researcher' && sub.researcher && (
                                <div className="text-[11px] text-neutral-800 bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans">
                                  {sub.researcher.content}
                                </div>
                              )}

                              {tab === 'planner' && sub.planner && (
                                <div className="text-[11px] text-neutral-800 space-y-2">
                                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono">
                                    {sub.pivot_plan ? sub.pivot_plan.content : sub.planner.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Conversational content with OpenUI support */}
                          {(!isPipeline || !sub?.judge) && (
                            <OpenUIRenderer
                              content={msg.content}
                              openuiLang={msg.openui_lang || sub?.openui_lang}
                            />
                          )}

                          {/* Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-neutral-500 font-medium">
                              <span className="text-neutral-700 font-bold uppercase">QDRANT CONTEXT:</span>
                              {msg.citations.slice(0, 2).map((c, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-neutral-50 rounded-md border border-neutral-200 text-neutral-800">
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
              <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/90 shadow-sm text-neutral-900 space-y-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-900 font-bold uppercase">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0047FF]" />
                  <span>COORDINATING 3 SUB-AGENTS...</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold uppercase">
                  <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 2 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    1. RESEARCH
                  </div>
                  <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 3 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    2. JUDGE
                  </div>
                  <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 4 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    3. PLAN
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-neutral-200/90 space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pitch a feature idea or ask a codebase question..."
                className="flex-1 bg-neutral-50 border border-neutral-200/90 rounded-xl text-neutral-900 placeholder-neutral-400 text-xs font-sans p-2.5 outline-none focus:bg-white focus:border-[#0047FF] transition-all resize-none leading-relaxed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isSubmitting || !inputValue.trim()}
                className="w-10 h-10 bg-neutral-900 hover:bg-[#0047FF] text-white font-bold rounded-xl shadow-xs active:translate-y-0.5 flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer"
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
