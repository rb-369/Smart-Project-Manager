'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProjectSummary } from '@/types';
import {
  ExternalLink,
  ArrowRight,
  SlidersHorizontal,
  Star,
  EyeOff,
  RotateCcw,
  Globe,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Radio,
  GitBranch,
  Layers,
  Sparkles
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectSummary;
  onTriageClick?: (project: ProjectSummary) => void;
  onStarToggle?: (project: ProjectSummary) => void;
  onHideToggle?: (project: ProjectSummary) => void;
  onUpdateLiveUrl?: (project: ProjectSummary, url: string) => Promise<void>;
  onMoveUp?: (project: ProjectSummary) => void;
  onMoveDown?: (project: ProjectSummary) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function ProjectCard({
  project,
  onTriageClick,
  onStarToggle,
  onHideToggle,
  onUpdateLiveUrl,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: ProjectCardProps) {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(project.live_url || '');
  const [urlSaving, setUrlSaving] = useState(false);

  const getLanguageMeta = (lang?: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'python':
        return { color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50', code: 'PY' };
      case 'typescript':
        return { color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50', code: 'TS' };
      case 'javascript':
        return { color: 'bg-amber-400', text: 'text-amber-800', bg: 'bg-amber-50', code: 'JS' };
      case 'dart':
        return { color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50', code: 'DART' };
      case 'go':
        return { color: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50', code: 'GO' };
      case 'rust':
        return { color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', code: 'RS' };
      default:
        return { color: 'bg-neutral-800', text: 'text-neutral-700', bg: 'bg-neutral-50', code: 'CODE' };
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'ACTIVE', dotColor: 'bg-[#10B981]' };
      case 'PAUSED':
        return { label: 'PAUSED', dotColor: 'bg-amber-400' };
      case 'COMPLETED':
        return { label: 'COMPLETE', dotColor: 'bg-[#0047FF]' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-neutral-400' };
    }
  };

  const statusInfo = getStatusIndicator(project.status);
  const langMeta = getLanguageMeta(project.primary_language);

  const handleSaveLiveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateLiveUrl) return;
    try {
      setUrlSaving(true);
      await onUpdateLiveUrl(project, urlInput.trim());
      setIsEditingUrl(false);
    } finally {
      setUrlSaving(false);
    }
  };

  return (
    <div
      className={`group transition-all duration-200 bg-white rounded-2xl flex flex-col justify-between h-full relative p-5 hover:-translate-y-1 shadow-xs hover:shadow-lg hover:shadow-neutral-200/60 border ${
        project.is_starred
          ? 'border-[#0047FF]/40 ring-1 ring-[#0047FF]/20 bg-gradient-to-b from-blue-50/15 via-white to-white'
          : project.is_hidden
          ? 'border-dashed border-neutral-300 opacity-75 bg-neutral-50/60'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Pinned top accent subtle line */}
      {project.is_starred && (
        <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[#0047FF] via-sky-400 to-[#0047FF] rounded-b-full" />
      )}

      <div>
        {/* Top Meta Bar: Status Pill, Type Badge, Pinned Tag, and Actions */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Live Status Indicator */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/70 text-neutral-800">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${project.status === 'IN_PROGRESS' ? 'animate-pulse' : ''}`} />
              {statusInfo.label}
            </span>

            {/* Project Classification Badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-100 font-bold uppercase tracking-wider">
              {project.project_type}
            </span>

            {/* Pinned Ribbon if Starred */}
            {project.is_starred && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DFFF4F]/90 text-neutral-900 border border-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-black text-black" />
                <span>PINNED</span>
              </span>
            )}
          </div>

          {/* Quick Actions: Star & GitHub */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onStarToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onStarToggle(project);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  project.is_starred
                    ? 'bg-[#DFFF4F] text-black border-amber-300 hover:bg-neutral-900 hover:text-[#DFFF4F]'
                    : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-neutral-800 hover:bg-white hover:border-neutral-300'
                }`}
                title={project.is_starred ? 'Unpin from top' : 'Pin to top of dashboard'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    project.is_starred ? 'fill-black text-black' : 'currentColor'
                  }`}
                />
              </button>
            )}

            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-neutral-50 text-neutral-500 border border-neutral-200 hover:border-neutral-300 hover:text-[#0047FF] hover:bg-white transition"
                title="View on GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Repository Identity Block: Monogram Icon + Title + Task Count */}
        <div className="pt-3.5 pb-2">
          <div className="flex items-start gap-3">
            {/* Architectural Monogram Badge */}
            <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-mono font-bold text-xs text-[#0047FF] shrink-0 group-hover:bg-[#0047FF] group-hover:text-white transition-colors shadow-xs">
              <GitBranch className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-bold text-base text-neutral-900 hover:text-[#0047FF] transition-colors tracking-tight truncate group-hover:text-[#0047FF]">
                  {project.name}
                </h3>
              </Link>

              {/* Language & Tasks Metadata Strip */}
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-500">
                {project.primary_language ? (
                  <span className="flex items-center gap-1 font-semibold text-neutral-700 uppercase tracking-wider">
                    <span className={`w-2 h-2 rounded-full ${langMeta.color}`} />
                    {project.primary_language}
                  </span>
                ) : (
                  <span className="uppercase text-neutral-400">Codebase</span>
                )}

                <span className="text-neutral-300">&bull;</span>

                <span className="font-semibold text-neutral-600">
                  <strong className="text-neutral-900">{project.completed_features}</strong>/{project.total_features} TASKS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Production URL / Deployed App Capsule */}
        <div className="my-2.5">
          {project.live_url ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-neutral-900">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-950 hover:underline truncate"
                title={project.live_url}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">
                  {project.live_url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
              </a>

              <button
                onClick={() => {
                  setUrlInput(project.live_url || '');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[10px] font-mono font-bold uppercase text-neutral-500 hover:text-black hover:underline px-1 py-0.5 transition cursor-pointer shrink-0"
                title="Edit Deployed URL"
              >
                EDIT
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 px-3 py-2 rounded-xl bg-neutral-50/60 border border-dashed border-neutral-200">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-neutral-400" />
                <span>NO LIVE DEPLOY</span>
              </span>
              <button
                onClick={() => {
                  setUrlInput('');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[#0047FF] hover:underline font-semibold cursor-pointer text-[10px] uppercase tracking-wider"
              >
                + ADD LIVE URL
              </button>
            </div>
          )}

          {/* Inline Edit URL Popover */}
          {isEditingUrl && (
            <form onSubmit={handleSaveLiveUrl} className="mt-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="flex-1 bg-white rounded-lg border border-neutral-300 text-black text-xs font-mono px-2.5 py-1.5 outline-none focus:border-[#0047FF]"
                autoFocus
              />
              <button
                type="submit"
                disabled={urlSaving}
                className="px-2.5 py-1.5 bg-[#0047FF] text-white text-xs font-bold rounded-lg hover:bg-neutral-900 transition cursor-pointer"
              >
                {urlSaving ? '...' : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="p-1.5 bg-white rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Project Description */}
        {project.description ? (
          <p className="text-xs text-neutral-600 line-clamp-2 mb-3 leading-relaxed font-normal min-h-[34px]">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic mb-3 font-mono min-h-[34px]">
            Autonomous repository ingested and synchronized with DevCommand.
          </p>
        )}

        {/* Target Goal (if present) */}
        {project.goal && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-neutral-50 border-l-2 border-[#0047FF] border-r border-t border-b border-neutral-200/60">
            <p className="text-xs text-neutral-700 line-clamp-2 font-mono">
              <span className="text-[#0047FF] font-bold text-[10px] mr-1.5 uppercase">
                GOAL:
              </span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Engineered Velocity Progress Track */}
        <div className="mb-3 pt-1">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-500 font-mono text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#0047FF]" />
              <span>VELOCITY PROGRESS</span>
            </span>
            <span className="font-mono text-xs font-bold text-neutral-800 num-tabular px-1.5 py-0.2 rounded-md bg-neutral-100 border border-neutral-200/80">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-100 border border-neutral-200/80 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.progress_percentage === 100
                  ? 'bg-emerald-500'
                  : project.progress_percentage > 50
                  ? 'bg-[#0047FF]'
                  : 'bg-[#FF5533]'
              }`}
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Card Footer: Triage, Up/Down, Archive, and Primary ROADMAP Button */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs gap-2">
          {/* Left Footer: Triage Button or Status Tag + Reorder Controls */}
          <div className="flex items-center gap-1.5">
            {project.needs_review && onTriageClick ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTriageClick(project);
                }}
                className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-[#FF5533] hover:text-white transition cursor-pointer flex items-center gap-1 uppercase"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>TRIAGE</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                OPTIMIZED
              </span>
            )}

            {/* Manual Order Up / Down Arrows */}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
                {onMoveUp && (
                  <button
                    onClick={() => onMoveUp(project)}
                    disabled={!canMoveUp}
                    className="p-1 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-r border-neutral-200"
                    title="Move higher in priority"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={() => onMoveDown(project)}
                    disabled={!canMoveDown}
                    className="p-1 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Move lower in priority"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Footer: Hide/Restore Action & Tactile ROADMAP CTA */}
          <div className="flex items-center gap-2">
            {onHideToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onHideToggle(project);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                  project.is_hidden
                    ? 'bg-[#0047FF] text-white border-[#0047FF] hover:bg-neutral-900 font-bold'
                    : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-neutral-800 hover:bg-white hover:border-neutral-300'
                }`}
                title={
                  project.is_hidden
                    ? 'Restore to active dashboard'
                    : 'Hide repository from DevCommand (soft delete)'
                }
              >
                {project.is_hidden ? (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span className="font-bold uppercase">RESTORE</span>
                  </>
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            )}

            <Link
              href={`/projects/${project.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white hover:bg-[#0047FF] hover:text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs active:translate-y-0.5"
            >
              <span>ROADMAP</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
