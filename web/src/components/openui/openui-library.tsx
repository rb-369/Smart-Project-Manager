'use client';

import React, { useState } from 'react';
import { defineComponent, createLibrary, useTriggerAction } from '@openuidev/react-lang';
import { z } from 'zod/v4';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Play,
  Copy,
  RefreshCw,
  Plus,
  Sparkles,
  Database,
  Server,
  Globe,
  Cpu,
  Lock,
  Scale,
} from 'lucide-react';

// ============================================================================
// 1. Container Component (Root / Section Card)
// ============================================================================
export const Container = defineComponent({
  name: 'Container',
  description: 'Top-level container card with a header title, status badge, visual variant, and child elements',
  props: z.object({
    title: z.string().describe('Container card title'),
    badge: z.string().optional().describe('Optional badge in header'),
    variant: z.enum(['default', 'highlight', 'dark', 'glass', 'warning']).optional().describe('Visual variant style'),
    children: z.array(z.any()).describe('Child components to render inside the container'),
  }),
  component: ({ props, renderNode }) => {
    const isDark = props.variant === 'dark';
    const isHighlight = props.variant === 'highlight';
    const isWarning = props.variant === 'warning';

    const bgClass = isDark
      ? 'bg-neutral-900 text-white border-neutral-800'
      : isHighlight
      ? 'bg-blue-50/40 border-blue-200 text-neutral-900'
      : isWarning
      ? 'bg-amber-50/40 border-amber-200 text-neutral-900'
      : 'bg-white border-neutral-200/90 text-neutral-900';

    return (
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 transition-all ${bgClass}`}>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-inherit/20">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#DFFF4F]' : 'bg-[#0047FF]'}`} />
            <h3 className="font-bold text-sm tracking-tight font-sans uppercase">
              {props.title}
            </h3>
          </div>
          {props.badge && (
            <span
              className={`px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-full tracking-wider ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300'
              }`}
            >
              {props.badge}
            </span>
          )}
        </div>
        <div className="space-y-3.5">{renderNode(props.children)}</div>
      </div>
    );
  },
});

// ============================================================================
// 2. Stack Layout Component
// ============================================================================
export const Stack = defineComponent({
  name: 'Stack',
  description: 'Flex layout for arranging child components vertically or horizontally',
  props: z.object({
    children: z.array(z.any()).describe('Child components to arrange'),
    direction: z.enum(['col', 'row']).optional().describe('Flex direction (col or row)'),
    gap: z.enum(['xs', 'sm', 'md', 'lg']).optional().describe('Spacing gap size'),
    wrap: z.boolean().optional().describe('Allow items to wrap onto next line'),
  }),
  component: ({ props, renderNode }) => {
    const isRow = props.direction === 'row';
    const gapClass =
      props.gap === 'xs'
        ? 'gap-1.5'
        : props.gap === 'sm'
        ? 'gap-2.5'
        : props.gap === 'lg'
        ? 'gap-5'
        : 'gap-3.5';

    return (
      <div
        className={`flex ${isRow ? 'flex-col sm:flex-row sm:items-stretch' : 'flex-col'} ${
          props.wrap ? 'flex-wrap' : ''
        } ${gapClass} w-full`}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

// ============================================================================
// 3. StatMetric Component
// ============================================================================
export const StatMetric = defineComponent({
  name: 'StatMetric',
  description: 'High-visibility telemetry card displaying KPI value, trend, and health status',
  props: z.object({
    label: z.string().describe('Metric name, e.g. Sprint Velocity'),
    value: z.string().describe('Primary value, e.g. 94% or 12ms'),
    change: z.string().optional().describe('Delta trend, e.g. +8% vs baseline'),
    status: z.enum(['healthy', 'warning', 'critical', 'neutral']).optional().describe('Health status'),
    subtitle: z.string().optional().describe('Optional context text'),
  }),
  component: ({ props }) => {
    const isHealthy = props.status === 'healthy';
    const isWarning = props.status === 'warning';
    const isCritical = props.status === 'critical';

    const statusBg = isHealthy
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : isWarning
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : isCritical
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-neutral-100 text-neutral-700 border-neutral-200';

    return (
      <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-1.5 transition-all hover:border-neutral-300">
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-neutral-500 font-bold uppercase tracking-wider">
          <span className="truncate">{props.label}</span>
          {props.status && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'}`} />
          )}
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
          {props.value}
        </div>
        {(props.change || props.subtitle) && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {props.change && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusBg}`}>
                {props.change}
              </span>
            )}
            {props.subtitle && (
              <span className="text-[11px] text-neutral-500 font-sans truncate">
                {props.subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
});

// ============================================================================
// 4. VerdictCard Component
// ============================================================================
export const VerdictCard = defineComponent({
  name: 'VerdictCard',
  description: 'Executive verdict rating card from The Judge sub-agent with score, signal badge, and critique',
  props: z.object({
    score: z.number().describe('Score from 0 to 100'),
    signal: z.enum(['BUILD_NOW', 'PROCEED_WITH_CAUTION', 'DO_NOT_BUILD']).describe('Verdict decision signal'),
    title: z.string().describe('Verdict headline summary'),
    critique: z.string().optional().describe('Executive critique notes'),
  }),
  component: ({ props }) => {
    const isBuild = props.signal === 'BUILD_NOW';
    const isCaution = props.signal === 'PROCEED_WITH_CAUTION';

    return (
      <div className="p-4 sm:p-5 rounded-xl bg-neutral-900 text-white border border-neutral-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#DFFF4F]" />
            <span className="text-[10px] font-mono text-[#DFFF4F] uppercase tracking-widest font-bold">
              THE JUDGE SUB-AGENT VERDICT
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xl font-bold font-mono text-white num-tabular">{props.score}/100</span>
            <span
              className={`px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-full ${
                isBuild
                  ? 'bg-emerald-500 text-white'
                  : isCaution
                  ? 'bg-amber-400 text-black'
                  : 'bg-[#FF5533] text-white'
              }`}
            >
              {props.signal.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="text-sm font-bold tracking-tight text-white uppercase">
          {props.title}
        </div>
        {props.critique && (
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {props.critique}
          </p>
        )}
      </div>
    );
  },
});

// ============================================================================
// 5. TaskChecklist Component (Interactive Checkable State!)
// ============================================================================
function TaskChecklistRenderer({ props }: { props: any }) {
  const [checkedState, setCheckedState] = useState<{ [index: number]: boolean }>({});

  const toggleItem = (idx: number) => {
    setCheckedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalCount = props.items.length;
  const completedCount = Object.values(checkedState).filter(Boolean).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0047FF]" />
          <h4 className="font-bold text-xs uppercase tracking-tight text-neutral-900">
            {props.title}
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
          <span>
            {completedCount}/{totalCount} completed
          </span>
          {props.category && (
            <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold uppercase">
              {props.category}
            </span>
          )}
        </div>
      </div>

      {/* Live Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full bg-[#0047FF] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-1.5 pt-1">
        {props.items.map((task: string, idx: number) => {
          const isChecked = !!checkedState[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleItem(idx)}
              className={`w-full text-left p-2.5 rounded-lg border flex items-start gap-2.5 transition cursor-pointer ${
                isChecked
                  ? 'bg-emerald-50/60 border-emerald-200 text-neutral-500 line-through'
                  : 'bg-neutral-50/60 hover:bg-neutral-100/70 border-neutral-200/70 text-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-neutral-400 bg-white'
                }`}
              >
                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-sans leading-relaxed">{task}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const TaskChecklist = defineComponent({
  name: 'TaskChecklist',
  description: 'Interactive checklist where items can be checked on/off with live progress calculation',
  props: z.object({
    title: z.string().describe('Checklist section title'),
    items: z.array(z.string()).describe('List of task strings to display'),
    category: z.string().optional().describe('Category badge, e.g. SPRINT or ARCHITECTURE'),
  }),
  component: TaskChecklistRenderer,
});

// ============================================================================
// 6. FeatureCard Component (Actionable Blueprint Card)
// ============================================================================
function FeatureCardRenderer({ props }: { props: any }) {
  const triggerAction = useTriggerAction();
  const [isTriggered, setIsTriggered] = useState(false);

  const handleAction = () => {
    setIsTriggered(true);
    if (props.actionId) {
      try {
        triggerAction(props.actionId);
      } catch {
        // Fallback if not inside interactive action plan
      }
    }
  };

  const isP0 = props.priority === 'P0';
  const isP1 = props.priority === 'P1';

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-3 transition-all hover:border-neutral-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
              isP0
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isP1
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {props.priority}
          </span>
          {props.complexity && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-100 rounded border border-neutral-200">
              SIZE: {props.complexity}
            </span>
          )}
          <h4 className="font-bold text-xs uppercase tracking-tight text-neutral-900">
            {props.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={handleAction}
          disabled={isTriggered}
          className={`px-3 py-1.5 text-xs font-bold font-mono uppercase shrink-0 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            isTriggered
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-neutral-900 hover:bg-[#0047FF] text-white shadow-xs active:translate-y-0.5'
          }`}
        >
          {isTriggered ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Added to Roadmap</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{props.actionLabel || 'Add to Roadmap'}</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed font-sans">
        {props.description}
      </p>
    </div>
  );
}

export const FeatureCard = defineComponent({
  name: 'FeatureCard',
  description: 'Detailed feature blueprint card with priority badge, complexity, and an interactive action button',
  props: z.object({
    title: z.string().describe('Feature name'),
    priority: z.enum(['P0', 'P1', 'P2', 'P3']).describe('Priority level'),
    complexity: z.enum(['S', 'M', 'L', 'XL']).optional().describe('Complexity estimate'),
    description: z.string().describe('Technical description of the feature'),
    actionId: z.string().optional().describe('Identifier for action callback'),
    actionLabel: z.string().optional().describe('Label on the button, e.g. Add to Roadmap'),
  }),
  component: FeatureCardRenderer,
});

// ============================================================================
// 7. ActionButton Component
// ============================================================================
function ActionButtonRenderer({ props }: { props: any }) {
  const triggerAction = useTriggerAction();
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 2000);
    try {
      triggerAction(props.actionId || props.label);
    } catch {
      // Fallback
    }
  };

  const isPrimary = !props.variant || props.variant === 'primary';
  const isSuccess = props.variant === 'success';
  const isDanger = props.variant === 'danger';

  const btnClass = isPrimary
    ? 'bg-neutral-900 hover:bg-[#0047FF] text-white shadow-xs'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-2 transition cursor-pointer active:scale-95 ${btnClass}`}
    >
      {clicked ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Triggered</span>
        </>
      ) : (
        <>
          {props.icon === 'zap' && <Zap className="w-3.5 h-3.5" />}
          {props.icon === 'play' && <Play className="w-3.5 h-3.5" />}
          {props.icon === 'refresh' && <RefreshCw className="w-3.5 h-3.5" />}
          {props.icon === 'arrow' && <ArrowRight className="w-3.5 h-3.5" />}
          {(!props.icon || props.icon === 'plus') && <Plus className="w-3.5 h-3.5" />}
          <span>{props.label}</span>
        </>
      )}
    </button>
  );
}

export const ActionButton = defineComponent({
  name: 'ActionButton',
  description: 'Interactive button triggering an action callback when clicked',
  props: z.object({
    label: z.string().describe('Button label text'),
    actionId: z.string().describe('Unique action ID to trigger'),
    variant: z.enum(['primary', 'secondary', 'danger', 'success']).optional().describe('Visual style'),
    icon: z.enum(['plus', 'check', 'play', 'zap', 'copy', 'refresh', 'arrow']).optional().describe('Icon'),
  }),
  component: ActionButtonRenderer,
});

// ============================================================================
// 8. CodePreview Component
// ============================================================================
function CodePreviewRenderer({ props }: { props: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(props.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-neutral-950 text-neutral-100 border border-neutral-800 overflow-hidden text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 text-[11px] text-neutral-400">
        <span>{props.filename || props.language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-[11px] font-mono text-neutral-200">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}

export const CodePreview = defineComponent({
  name: 'CodePreview',
  description: 'Code snippet box with syntax preview and copy-to-clipboard functionality',
  props: z.object({
    code: z.string().describe('Code content to render'),
    language: z.string().optional().describe('Programming language, e.g. typescript, python'),
    filename: z.string().optional().describe('Optional filename header'),
  }),
  component: CodePreviewRenderer,
});

// ============================================================================
// 9. TechBadge Component
// ============================================================================
export const TechBadge = defineComponent({
  name: 'TechBadge',
  description: 'Color-coded technology badge indicating architecture stack layer and status',
  props: z.object({
    label: z.string().describe('Tech name, e.g. FastAPI, Next.js, Qdrant'),
    category: z.enum(['frontend', 'backend', 'database', 'ai', 'infra', 'auth']).optional().describe('Stack layer category'),
    status: z.string().optional().describe('Status indicator, e.g. Verified or Active'),
  }),
  component: ({ props }) => {
    const cat = props.category;
    const catStyle =
      cat === 'frontend'
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : cat === 'backend'
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
        : cat === 'database'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : cat === 'ai'
        ? 'bg-purple-50 text-purple-800 border-purple-200'
        : cat === 'infra'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200';

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${catStyle}`}>
        {cat === 'database' && <Database className="w-3 h-3 text-emerald-600" />}
        {cat === 'backend' && <Server className="w-3 h-3 text-indigo-600" />}
        {cat === 'frontend' && <Globe className="w-3 h-3 text-sky-600" />}
        {cat === 'ai' && <Cpu className="w-3 h-3 text-purple-600" />}
        {cat === 'auth' && <Lock className="w-3 h-3 text-neutral-600" />}
        <span>{props.label}</span>
        {props.status && <span className="text-[10px] opacity-75 font-normal">&bull; {props.status}</span>}
      </div>
    );
  },
});

// ============================================================================
// 10. Callout Component
// ============================================================================
export const Callout = defineComponent({
  name: 'Callout',
  description: 'Alert and highlight callout box for architectural warnings and critical notices',
  props: z.object({
    title: z.string().describe('Callout header'),
    message: z.string().describe('Callout body text'),
    type: z.enum(['info', 'warning', 'success', 'critical']).optional().describe('Visual tone of the callout'),
  }),
  component: ({ props }) => {
    const isWarning = props.type === 'warning';
    const isCritical = props.type === 'critical';
    const isSuccess = props.type === 'success';

    const boxStyle = isCritical
      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
      : isWarning
      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
      : isSuccess
      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      : 'bg-blue-50/70 border-blue-200 text-blue-950';

    return (
      <div className={`p-4 rounded-xl border space-y-1 shadow-xs ${boxStyle}`}>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase">
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#0047FF]" />
          )}
          <span>{props.title}</span>
        </div>
        <p className="text-xs font-sans leading-relaxed text-inherit opacity-90">
          {props.message}
        </p>
      </div>
    );
  },
});

// ============================================================================
// DevCommand OpenUI Component Library Definition
// ============================================================================
export const devcommandLibrary = createLibrary({
  components: [
    Container,
    Stack,
    StatMetric,
    VerdictCard,
    TaskChecklist,
    FeatureCard,
    ActionButton,
    CodePreview,
    TechBadge,
    Callout,
  ],
});
