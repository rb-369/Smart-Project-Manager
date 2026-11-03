'use client';

import React, { useState, useMemo } from 'react';
import { Renderer } from '@openuidev/react-lang';
import { devcommandLibrary } from './openui-library';
import { Sparkles, Code2, LayoutDashboard, AlertCircle, Copy, Check } from 'lucide-react';

interface OpenUIRendererProps {
  content: string;
  openuiLang?: string | null;
  isStreaming?: boolean;
  onAction?: (action: { name: string; params?: any }) => void;
}

interface ParsedSegment {
  type: 'text' | 'openui';
  content: string;
}

export function OpenUIRenderer({
  content,
  openuiLang,
  isStreaming = false,
  onAction,
}: OpenUIRendererProps) {
  const [viewMode, setViewMode] = useState<'ui' | 'code'>('ui');
  const [copied, setCopied] = useState(false);

  // Parse message into text segments and embedded openui codeblocks
  const segments = useMemo<ParsedSegment[]>(() => {
    // If openuiLang is passed explicitly
    if (openuiLang && openuiLang.trim()) {
      return [
        { type: 'text', content: content.replace(/```(?:openui|openui-lang)?[\s\S]*?```/g, '').trim() },
        { type: 'openui', content: openuiLang.trim() },
      ];
    }

    // Check if the content is pure openui-lang code (starts with root = or identifier =)
    const trimmed = content.trim();
    if (trimmed.startsWith('root =') || trimmed.startsWith('root=')) {
      return [{ type: 'openui', content: trimmed }];
    }

    // Otherwise look for ```openui ... ``` or ```openui-lang ... ``` blocks
    const regex = /```(?:openui|openui-lang)\s*([\s\S]*?)```/g;
    const result: ParsedSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textPart = content.slice(lastIndex, match.index).trim();
        if (textPart) {
          result.push({ type: 'text', content: textPart });
        }
      }
      result.push({ type: 'openui', content: match[1].trim() });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) {
        result.push({ type: 'text', content: remaining });
      }
    }

    if (result.length === 0) {
      return [{ type: 'text', content }];
    }

    return result;
  }, [content, openuiLang]);

  const handleAction = (event: any) => {
    if (onAction) {
      onAction({
        name: event.name || event.action || 'action',
        params: event.params || event.args || {},
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 w-full">
      {segments.map((segment, idx) => {
        if (segment.type === 'text') {
          return (
            <div
              key={idx}
              className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-800"
            >
              {segment.content}
            </div>
          );
        }

        // OpenUI Generative UI Block
        return (
          <div
            key={idx}
            className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-3 sm:p-4 space-y-3 shadow-xs"
          >
            {/* Generative UI Header Dock */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200/80">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#0047FF] text-white flex items-center justify-center p-0.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono uppercase tracking-tight text-neutral-900">
                    OpenUI Interactive Surface
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#DFFF4F] text-neutral-900 border border-amber-300">
                    OUI-1
                  </span>
                </div>
              </div>

              {/* View Switcher & Copy */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center p-0.5 bg-white border border-neutral-200/90 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setViewMode('ui')}
                    className={`px-2 py-1 text-[11px] font-mono font-bold uppercase rounded flex items-center gap-1 transition cursor-pointer ${
                      viewMode === 'ui'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <LayoutDashboard className="w-3 h-3" />
                    <span>Live UI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('code')}
                    className={`px-2 py-1 text-[11px] font-mono font-bold uppercase rounded flex items-center gap-1 transition cursor-pointer ${
                      viewMode === 'code'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>DSL</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(segment.content)}
                  className="p-1 rounded-lg bg-white border border-neutral-200/90 text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                  title="Copy openui-lang DSL"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Interactive Rendering or DSL Code */}
            {viewMode === 'ui' ? (
              <div className="w-full openui-container">
                <OpenUIErrorBoundary rawCode={segment.content}>
                  <Renderer
                    response={segment.content}
                    library={devcommandLibrary}
                    isStreaming={isStreaming}
                    onAction={handleAction}
                  />
                </OpenUIErrorBoundary>
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-950 p-3.5 text-neutral-200 font-mono text-xs overflow-x-auto border border-neutral-800">
                <div className="text-[10px] font-mono text-neutral-400 pb-2 border-b border-neutral-800 uppercase tracking-widest">
                  // openui-lang declarative syntax
                </div>
                <pre className="pt-2 leading-relaxed whitespace-pre font-mono">
                  <code>{segment.content}</code>
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple Error Boundary for resilient Generative UI parsing
class OpenUIErrorBoundary extends React.Component<
  { children: React.ReactNode; rawCode: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; rawCode: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('[OpenUI Render Exception]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-mono font-bold uppercase text-[11px] text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>OpenUI Streaming Reconciliation</span>
          </div>
          <p className="font-sans text-neutral-700 leading-normal">
            The generative UI program is reconciling stream statements. Raw openui-lang code:
          </p>
          <pre className="p-2.5 rounded bg-white/80 border border-amber-200 font-mono text-[11px] overflow-x-auto">
            {this.props.rawCode}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
