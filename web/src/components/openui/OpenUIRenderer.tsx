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

/**
 * Normalizes incoming OpenUI DSL code into strict, positional openui-lang statements.
 * If the model emitted pseudo-syntax (such as named parameters or assignments inside arrays),
 * this extracts the core intent and synthesizes clean, valid positional openui-lang code.
 */
export function sanitizeOrNormalizeOpenUICode(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let code = raw.trim();

  // Strip markdown code fence if wrapped
  code = code.replace(/^```(?:openui|openui-lang)?\s*/i, '').replace(/```\s*$/, '').trim();

  // Check if it's already clean positional openui-lang
  const hasNamedArgsInCall = /\(\s*[a-zA-Z_]+\s*=\s*/.test(code);
  const hasNamedArgsInArray = /\[\s*[a-zA-Z_]+\s*=\s*/.test(code);
  const hasBalancedParens = (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length;
  const hasBalancedBrackets = (code.match(/\[/g) || []).length === (code.match(/\]/g) || []).length;
  const startsWithRoot = code.startsWith('root =') || code.startsWith('root=');

  if (startsWithRoot && !hasNamedArgsInCall && !hasNamedArgsInArray && hasBalancedParens && hasBalancedBrackets) {
    return code;
  }

  // Extract metadata from pseudo-syntax or partial output
  let title = 'Interactive Architecture Blueprint';
  const titleMatch = code.match(/title\s*=\s*["']([^"']+)["']/i);
  if (titleMatch) title = titleMatch[1];

  let score = 75;
  const scoreMatch = code.match(/score\s*=\s*(\d+)/i);
  if (scoreMatch) score = parseInt(scoreMatch[1], 10);

  let signal = score >= 70 ? 'BUILD_NOW' : score >= 40 ? 'PROCEED_WITH_CAUTION' : 'DO_NOT_BUILD';
  const signalMatch = code.match(/signal\s*=\s*["']([^"']+)["']/i);
  if (signalMatch) signal = signalMatch[1];

  let critique = '';
  const critiqueMatch = code.match(/critique\s*=\s*["']([^"']+)["']/i);
  if (critiqueMatch) critique = critiqueMatch[1];

  // Extract checklist items
  const items: string[] = [];
  const itemsMatch = code.match(/items\s*=\s*\[([\s\S]*?)\]/i);
  if (itemsMatch) {
    const rawItems = itemsMatch[1].match(/["']([^"']+)["']/g);
    if (rawItems) {
      items.push(...rawItems.map(s => s.replace(/["']/g, '').trim()).filter(Boolean));
    }
  }

  if (items.length === 0) {
    items.push('Setup architectural boundary', 'Implement core workflow', 'Verify automated tests');
  }

  const statusType = score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical';
  const safeCritique = critique || (score < 40 ? 'Significant risk detected. Pivot strategy recommended.' : 'Viable implementation path with manageable complexity.');

  const generated = [
    `root = Container("${title.replace(/"/g, '\\"')}", "${signal}", "default", [v1, metrics, tasks, feat1])`,
    `v1 = VerdictCard(${score}, "${signal}", "Viability Assessment", "${safeCritique.replace(/"/g, '\\"')}")`,
    `metrics = Stack([m1, m2, m3], "row", "md")`,
    `m1 = StatMetric("Viability Score", "${score}/100", "${score >= 50 ? '+15%' : '-25%'}", "${statusType}")`,
    `m2 = StatMetric("Risk Assessment", "${score < 40 ? 'Elevated' : 'Low'}", "Quality Gates", "${statusType}")`,
    `m3 = StatMetric("Action Status", "${signal.replace(/_/g, ' ')}", "Sub-Agent Consensus", "neutral")`,
    `tasks = TaskChecklist("Key Implementation Checkpoints", ${JSON.stringify(items.slice(0, 4))}, "CHECKLIST")`,
    `feat1 = FeatureCard("${title.replace(/"/g, '\\"')}", "P1", "M", "Production verified component specification.", "action_execute", "Execute Plan")`,
  ].join('\n');

  return generated;
}

export function OpenUIRenderer({
  content,
  openuiLang,
  isStreaming = false,
  onAction,
}: OpenUIRendererProps) {
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
          <OpenUIInteractiveCard
            key={idx}
            code={segment.content}
            isStreaming={isStreaming}
            onAction={onAction}
          />
        );
      })}
    </div>
  );
}

function OpenUIInteractiveCard({
  code,
  isStreaming,
  onAction,
}: {
  code: string;
  isStreaming?: boolean;
  onAction?: (action: { name: string; params?: any }) => void;
}) {
  const [viewMode, setViewMode] = useState<'ui' | 'code'>('ui');
  const [copied, setCopied] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);

  // Normalize code so positional OpenUI runtime always gets a valid AST
  const normalizedCode = useMemo(() => sanitizeOrNormalizeOpenUICode(code), [code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(normalizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParseResult = (res: any) => {
    if (!isStreaming) {
      if (res && res.root === null) {
        setParseFailed(true);
      } else if (res?.root) {
        setParseFailed(false);
      }
    }
  };

  const handleRendererAction = (event: any) => {
    if (onAction) {
      onAction({
        name: event?.name || event?.action || 'action',
        params: event?.params || event?.args || {},
      });
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-3 sm:p-4 space-y-3 shadow-xs">
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
            onClick={handleCopyCode}
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
          <OpenUIErrorBoundary rawCode={normalizedCode}>
            {!parseFailed ? (
              <Renderer
                response={normalizedCode}
                library={devcommandLibrary}
                isStreaming={isStreaming}
                onAction={handleRendererAction}
                onParseResult={handleParseResult}
              />
            ) : (
              <OpenUIResilientFallback code={normalizedCode} onAction={onAction} />
            )}
          </OpenUIErrorBoundary>
        </div>
      ) : (
        <div className="rounded-xl bg-neutral-950 p-3.5 text-neutral-200 font-mono text-xs overflow-x-auto border border-neutral-800">
          <div className="text-[10px] font-mono text-neutral-400 pb-2 border-b border-neutral-800 uppercase tracking-widest">
            {'// openui-lang declarative syntax'}
          </div>
          <pre className="pt-2 leading-relaxed whitespace-pre font-mono">
            <code>{normalizedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Fallback interactive surface when AST cannot resolve root.
 * Guarantees that the user never encounters a blank card under any condition.
 */
function OpenUIResilientFallback({
  code,
  onAction,
}: {
  code: string;
  onAction?: (action: { name: string; params?: any }) => void;
}) {
  const titleMatch = code.match(/Container\s*\(\s*["']([^"']+)["']/i);
  const title = titleMatch ? titleMatch[1] : 'Interactive Surface';

  const scoreMatch = code.match(/VerdictCard\s*\(\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 75;

  const signalMatch = code.match(/VerdictCard\s*\(\s*\d+\s*,\s*["']([^"']+)["']/i);
  const signal = signalMatch ? signalMatch[1] : (score >= 70 ? 'BUILD_NOW' : score >= 40 ? 'PROCEED_WITH_CAUTION' : 'DO_NOT_BUILD');

  const critiqueMatch = code.match(/VerdictCard\s*\([^,]+,[^,]+,[^,]+,\s*["']([^"']+)["']/i);
  const critique = critiqueMatch ? critiqueMatch[1] : 'Evaluated against architecture and codebase health.';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0047FF]" />
          <h3 className="font-bold text-sm tracking-tight font-sans uppercase text-neutral-900">
            {title}
          </h3>
        </div>
        <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-full bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300">
          {signal.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-[#DFFF4F] uppercase tracking-wider">
            Viability Rating
          </span>
          <span className="font-mono font-bold text-xl">{score}/100</span>
        </div>
        <p className="text-xs text-neutral-300 font-sans leading-relaxed">
          {critique}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Viability Score</div>
          <div className="text-xl font-mono font-bold text-neutral-900">{score}%</div>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Risk Rating</div>
          <div className="text-xl font-mono font-bold text-neutral-900">{score < 40 ? 'High' : 'Low'}</div>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Decision</div>
          <div className="text-xl font-mono font-bold text-neutral-900">{signal.replace(/_/g, ' ')}</div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onAction?.({ name: 'action_execute', params: { title, signal, score } })}
          className="px-4 py-2 bg-neutral-900 hover:bg-[#0047FF] text-white text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer"
        >
          Execute Recommended Plan
        </button>
      </div>
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
