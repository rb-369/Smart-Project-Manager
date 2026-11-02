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
            className="group flex items-center gap-2.5 px-4 py-3 bg-[#DFFF4F] text-black font-mono font-black text-xs border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <div className="w-6 h-6 bg-black text-[#DFFF4F] border border-black flex items-center justify-center p-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="uppercase tracking-wider">AI COPILOT &amp; SUB-AGENTS</span>
            <span className="w-2 h-2 rounded-full bg-black border border-black" />
          </button>
        )}
      </div>

      {/* Floating Flyout Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[480px] h-[620px] max-h-[85vh] bg-[#F6F3EC] text-black border-3 border-black shadow-[12px_12px_0px_#000000] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b-2 border-black flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#0047FF] text-[#DFFF4F] border-2 border-black flex items-center justify-center p-1 shadow-[2px_2px_0px_#000000]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-tight flex items-center gap-1.5">
                  <span>DEVCOMMAND COPILOT</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF]" />
                  <span>3 SUB-AGENTS &bull; QDRANT RAG</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 bg-[#FAF7EE] border border-black hover:bg-rose-50 text-neutral-700 hover:text-rose-700 transition"
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
                className="p-1.5 bg-[#FAF7EE] border border-black hover:bg-neutral-200 text-black transition"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-[#FAF7EE] border border-black hover:bg-black hover:text-white transition"
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
                <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000000]">
                  <Bot className="w-6 h-6 text-[#0047FF]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-black uppercase tracking-tight">PITCH AN IDEA OR QUERY REPOS</h4>
                  <p className="text-[11px] text-neutral-600 mt-1 max-w-xs font-mono">
                    Our 3 sub-agents automatically research competitors, judge viability, and draft blueprints.
                  </p>
                </div>
                <div className="w-full space-y-2 pt-2">
                  <button
                    onClick={() => handleSendMessage('Should we add biometric authentication to our application?')}
                    className="w-full text-left p-2.5 bg-white hover:bg-[#DFFF4F] border-2 border-black text-[11px] font-mono font-bold text-black transition shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    💡 Should we add biometric authentication?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Evaluate building an automated subscription billing system')}
                    className="w-full text-left p-2.5 bg-white hover:bg-[#DFFF4F] border-2 border-black text-[11px] font-mono font-bold text-black transition shadow-[2px_2px_0px_#000000] cursor-pointer"
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
                    <div className="text-[10px] font-mono text-neutral-600 uppercase font-black px-1">
                      {msg.role === 'user' ? 'YOU' : 'DEVCOMMAND AI'}
                    </div>

                    <div
                      className={`p-3.5 max-w-[92%] leading-relaxed border-2 border-black ${
                        msg.role === 'user'
                          ? 'bg-[#0047FF] text-white shadow-[3px_3px_0px_#000000]'
                          : 'bg-white text-black shadow-[4px_4px_0px_#000000]'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                      ) : (
                        <div className="space-y-3">
                          {/* If Sub-Agents executed */}
                          {isPipeline && sub.judge && (
                            <div className="space-y-2.5">
                              {/* Executive Score Header */}
                              <div className="p-3 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000000] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-[#DFFF4F] uppercase font-black">
                                    THE JUDGE VERDICT
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-sm text-white">
                                      {sub.judge.score}/100
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 text-[9px] font-mono font-black border border-black uppercase ${
                                        sub.judge.verdict_signal === 'BUILD_NOW'
                                          ? 'bg-[#DFFF4F] text-black'
                                          : sub.judge.verdict_signal === 'PROCEED_WITH_CAUTION'
                                          ? 'bg-amber-400 text-black'
                                          : 'bg-rose-500 text-white'
                                      }`}
                                    >
                                      {sub.judge.verdict_signal.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-neutral-200 leading-normal font-mono">
                                  {sub.judge.summary_verdict}
                                </p>
                              </div>

                              {/* Sub-Agent Tabs */}
                              <div className="flex items-center gap-1 border-b-2 border-black pb-1.5 text-[11px] font-mono font-black">
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'judge' }))}
                                  className={`px-2 py-1 border-2 border-black uppercase cursor-pointer ${
                                    tab === 'judge' ? 'bg-[#FF5533] text-black shadow-[2px_2px_0px_#000000]' : 'bg-[#FAF7EE] text-black hover:bg-neutral-200'
                                  }`}
                                >
                                  Judge
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'researcher' }))}
                                  className={`px-2 py-1 border-2 border-black uppercase cursor-pointer ${
                                    tab === 'researcher' ? 'bg-[#0047FF] text-white shadow-[2px_2px_0px_#000000]' : 'bg-[#FAF7EE] text-black hover:bg-neutral-200'
                                  }`}
                                >
                                  Researcher
                                </button>
                                <button
                                  onClick={() => setActiveTabPerMessage((p) => ({ ...p, [msg.id]: 'planner' }))}
                                  className={`px-2 py-1 border-2 border-black uppercase cursor-pointer ${
                                    tab === 'planner' ? 'bg-[#DFFF4F] text-black shadow-[2px_2px_0px_#000000]' : 'bg-[#FAF7EE] text-black hover:bg-neutral-200'
                                  }`}
                                >
                                  Planner
                                </button>
                              </div>

                              {/* Tab Content */}
                              {tab === 'judge' && (
                                <div className="space-y-2 text-[11px] text-neutral-800">
                                  <p className="leading-relaxed bg-[#FAF7EE] p-2.5 border-2 border-black font-mono">
                                    {sub.judge.brutal_critique}
                                  </p>
                                  {sub.judge.what_to_build_instead && (
                                    <div className="p-2.5 bg-amber-50 border-2 border-black text-black space-y-0.5">
                                      <div className="font-mono text-[10px] text-[#0047FF] font-black uppercase">ALTERNATIVE PROPOSAL:</div>
                                      <div className="font-mono">{sub.judge.what_to_build_instead}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {tab === 'researcher' && sub.researcher && (
                                <div className="text-[11px] text-black bg-[#FAF7EE] p-2.5 border-2 border-black whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono">
                                  {sub.researcher.content}
                                </div>
                              )}

                              {tab === 'planner' && sub.planner && (
                                <div className="text-[11px] text-black space-y-2">
                                  <div className="bg-[#FAF7EE] p-2.5 border-2 border-black whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono">
                                    {sub.pivot_plan ? sub.pivot_plan.content : sub.planner.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Conversational content if no subagent pipeline */}
                          {(!isPipeline || !sub?.judge) && (
                            <div className="whitespace-pre-wrap text-black leading-relaxed text-xs">
                              {msg.content}
                            </div>
                          )}

                          {/* Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-2 border-t-2 border-black flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-neutral-600 font-bold">
                              <span className="text-black uppercase">QDRANT CONTEXT:</span>
                              {msg.citations.slice(0, 2).map((c, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-[#FAF7EE] border border-black text-black">
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
              <div className="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] text-black space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-black font-black uppercase">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0047FF]" />
                  <span>COORDINATING 3 SUB-AGENTS...</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-black uppercase">
                  <div className={`p-1.5 border-2 border-black ${activeStep >= 2 ? 'bg-[#0047FF] text-white' : 'bg-[#FAF7EE] text-neutral-400'}`}>
                    1. RESEARCH
                  </div>
                  <div className={`p-1.5 border-2 border-black ${activeStep >= 3 ? 'bg-[#FF5533] text-black' : 'bg-[#FAF7EE] text-neutral-400'}`}>
                    2. JUDGE
                  </div>
                  <div className={`p-1.5 border-2 border-black ${activeStep >= 4 ? 'bg-[#DFFF4F] text-black' : 'bg-[#FAF7EE] text-neutral-400'}`}>
                    3. PLAN
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t-2 border-black space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pitch a feature idea or ask a codebase question..."
                className="flex-1 bg-[#FAF7EE] border-2 border-black text-black placeholder-neutral-500 text-xs font-mono p-2.5 outline-none focus:bg-white resize-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isSubmitting || !inputValue.trim()}
                className="w-10 h-10 bg-[#DFFF4F] hover:bg-black hover:text-[#DFFF4F] text-black font-black border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer"
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
