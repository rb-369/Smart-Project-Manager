'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  CopilotMode,
  ChatMessage,
  QdrantStatus,
} from '@/types';
import {
  Sparkles,
  Layers,
  Search,
  Scale,
  Send,
  Loader2,
  X,
  Maximize2,
  Database,
  ThumbsUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';

function ChatLauncherContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>('judge');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qdrantStatus, setQdrantStatus] = useState<QdrantStatus | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If already on /chat, we don't need to pop up another overlay, but still allow expanding
  const isOnChatPage = pathname === '/chat';

  useEffect(() => {
    if (isOpen && isAuthenticated && !qdrantStatus) {
      api.getQdrantStatus().then(setQdrantStatus).catch(() => {});
    }
  }, [isOpen, isAuthenticated, qdrantStatus]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSubmitting]);

  // Don't render for unauthenticated users or on login/register pages
  if (!isAuthenticated || pathname === '/login' || pathname === '/register') {
    return null;
  }

  // If on /chat page, we can hide the launcher or show a small badge
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
      mode: mode,
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
        mode: mode,
        history,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        mode: res.mode,
        created_at: new Date().toISOString(),
        citations: res.citations,
        judge_verdict: res.judge_verdict,
        suggested_features: res.suggested_features,
        suggested_projects: res.suggested_projects,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err?.message || 'Failed to reach AI Copilot.'}`,
          mode: mode,
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
              <Sparkles className="w-3.5 h-3.5 text-[#C6FF20]" />
            </div>
            <span className="tracking-wide">AI Copilot & Judge</span>
            <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
          </button>
        )}
      </div>

      {/* Floating Flyout Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] rounded-3xl bg-[#090b11]/95 text-white border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#002AD4] border border-white/30 flex items-center justify-center p-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C6FF20]" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight flex items-center gap-1.5">
                  <span>DevCommand AI Copilot</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20]" />
                  <span>Qdrant Cloud RAG</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

          {/* Mode Switcher Pills */}
          <div className="px-3 py-2 bg-white/[0.02] border-b border-white/10 grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setMode('planner')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold font-mono flex items-center justify-center gap-1 transition-all ${
                mode === 'planner'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Planner</span>
            </button>
            <button
              onClick={() => setMode('researcher')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold font-mono flex items-center justify-center gap-1 transition-all ${
                mode === 'researcher'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Researcher</span>
            </button>
            <button
              onClick={() => setMode('judge')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold font-mono flex items-center justify-center gap-1 transition-all ${
                mode === 'judge'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <Scale className="w-3 h-3" />
              <span>The Judge</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Sparkles className="w-6 h-6 text-[#C6FF20]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">
                    {mode === 'judge'
                      ? 'The Judge is Ready'
                      : mode === 'researcher'
                      ? 'Research & Feasibility'
                      : 'Feature Planner'}
                  </h4>
                  <p className="text-[11px] text-white/60 leading-relaxed max-w-xs">
                    {mode === 'judge'
                      ? 'Get a brutal 0-100 score and clear signal on whether to build or drop a feature.'
                      : mode === 'researcher'
                      ? 'Find competitors and evaluate architectural feasibility.'
                      : 'Generate complete technical blueprints and breakdown.'}
                  </p>
                </div>
                <div className="w-full space-y-1.5 pt-2">
                  <button
                    onClick={() =>
                      handleSendMessage(
                        mode === 'judge'
                          ? 'Judge adding real-time collaborative editing to our project'
                          : mode === 'researcher'
                          ? 'Analyze competitors and feasibility of automated roadmap generators'
                          : 'Plan a user analytics and telemetry tracking subsystem'
                      )
                    }
                    className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 hover:text-white text-left transition-colors"
                  >
                    ⚡{' '}
                    {mode === 'judge'
                      ? 'Judge adding real-time collaborative editing'
                      : mode === 'researcher'
                      ? 'Analyze roadmap generator competitors'
                      : 'Plan telemetry tracking subsystem'}
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white/10 border border-white/15 text-white shadow-lg'
                    }`}
                  >
                    {/* Judge score card in launcher */}
                    {m.judge_verdict && (
                      <div className="mb-2 p-2.5 rounded-xl bg-black/60 border border-white/15 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/60">VERDICT</span>
                          <span className="text-xl font-black font-mono">
                            {m.judge_verdict.score}/100
                          </span>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase text-center ${
                            m.judge_verdict.verdict_signal === 'GREEN'
                              ? 'bg-emerald-500 text-black'
                              : m.judge_verdict.verdict_signal === 'YELLOW'
                              ? 'bg-amber-400 text-black'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {m.judge_verdict.verdict}
                        </div>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Citations pill */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] font-mono text-white/50 flex items-center gap-1 flex-wrap">
                        <Database className="w-2.5 h-2.5 text-[#C6FF20]" />
                        <span>RAG:</span>
                        {m.citations.map((c, i) => (
                          <span key={i} className="text-white/80 font-bold">
                            [{c.title}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isSubmitting && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-[11px] font-mono">Thinking & searching vectors...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white/[0.03] border-t border-white/10">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${mode === 'judge' ? 'The Judge' : mode}...`}
                className="flex-1 bg-black/40 border border-white/20 text-white placeholder-white/40 text-xs rounded-xl p-2.5 outline-none focus:border-[#C6FF20] transition-colors resize-none leading-relaxed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isSubmitting || !inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-[#C6FF20] text-black font-bold flex items-center justify-center shrink-0 hover:bg-[#b5ee10] transition-all disabled:opacity-40"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
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
