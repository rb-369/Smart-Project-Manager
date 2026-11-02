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

  const getLanguageColor = (lang: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'python':
        return 'bg-blue-600';
      case 'typescript':
        return 'bg-sky-500';
      case 'javascript':
        return 'bg-amber-400';
      case 'dart':
        return 'bg-teal-500';
      case 'go':
        return 'bg-cyan-500';
      case 'rust':
        return 'bg-orange-500';
      default:
        return 'bg-neutral-800';
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
      className={`group transition-all duration-200 bg-white flex flex-col justify-between h-full relative p-5.5 hover:-translate-y-1 shadow-sm hover:shadow-md ${
        project.is_starred
          ? 'border-2 border-black border-t-4 border-t-[#0047FF]'
          : project.is_hidden
          ? 'border-2 border-dashed border-neutral-400 opacity-75 bg-[#FAF7EE]/60'
          : 'border-2 border-black hover:border-[#0047FF]'
      }`}
    >
      <div>
        {/* Top Meta Header: Status, Type, Pinned Badge, and Actions */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Status Indicator */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider text-black">
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ${project.status === 'IN_PROGRESS' ? 'animate-pulse' : ''}`} />
              {statusInfo.label}
            </span>

            {/* Project Classification */}
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF7EE] text-neutral-800 border border-neutral-300 font-bold uppercase tracking-wider">
              {project.project_type}
            </span>

            {/* Pinned Ribbon if Starred */}
            {project.is_starred && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#DFFF4F] text-black border border-black font-black uppercase tracking-wider flex items-center gap-1">
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
                className={`p-1.5 border transition cursor-pointer ${
                  project.is_starred
                    ? 'bg-[#DFFF4F] text-black border-black hover:bg-black hover:text-[#DFFF4F]'
                    : 'bg-[#FAF7EE] text-neutral-400 border-neutral-300 hover:text-black hover:bg-white hover:border-black'
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
                className="p-1.5 bg-[#FAF7EE] text-neutral-600 border border-neutral-300 hover:border-black hover:text-[#0047FF] hover:bg-white transition"
                title="View on GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Project Name Heading */}
        <div className="pt-3.5 pb-2">
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-black text-xl text-black hover:text-[#0047FF] transition-colors tracking-tight truncate flex items-center gap-2 group-hover:text-[#0047FF]">
              <span>{project.name}</span>
            </h3>
          </Link>
        </div>

        {/* Primary Language & Task Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-600 pb-3">
          {project.primary_language ? (
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-black">
              <span
                className={`w-2 h-2 rounded-full ${getLanguageColor(
                  project.primary_language
                )}`}
              />
              {project.primary_language}
            </span>
          ) : (
            <span className="uppercase tracking-wider text-neutral-400">Codebase</span>
          )}

          <span className="bg-[#FAF7EE] text-black px-2 py-0.5 border border-neutral-300 font-bold num-tabular text-[11px]">
            {project.completed_features}/{project.total_features} TASKS
          </span>
        </div>

        {/* Live URL Pill / Production Deployed Badge */}
        <div className="mb-3">
          {project.live_url ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#BBF7D0]/40 border border-[#10B981]/50 text-black">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-black hover:underline truncate"
                title={project.live_url}
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <Globe className="w-3.5 h-3.5 shrink-0 text-neutral-700" />
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
                className="text-[10px] font-mono font-black uppercase text-neutral-700 hover:text-black hover:underline px-1 py-0.5 transition cursor-pointer shrink-0"
                title="Edit Deployed URL"
              >
                EDIT
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 px-1 py-0.5">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-neutral-400" />
                <span>NO LIVE DEPLOY</span>
              </span>
              <button
                onClick={() => {
                  setUrlInput('');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[#0047FF] hover:underline font-bold cursor-pointer text-[10px] uppercase tracking-wider"
              >
                + ADD LIVE URL
              </button>
            </div>
          )}

          {/* Inline Edit URL Popover */}
          {isEditingUrl && (
            <form onSubmit={handleSaveLiveUrl} className="mt-2 p-2 bg-[#FAF7EE] border border-neutral-300 flex items-center gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="flex-1 bg-white border border-neutral-400 text-black text-xs font-mono px-2 py-1 outline-none focus:border-[#0047FF]"
                autoFocus
              />
              <button
                type="submit"
                disabled={urlSaving}
                className="px-2.5 py-1 bg-[#0047FF] text-white text-xs font-bold border border-[#0047FF] hover:bg-black transition cursor-pointer"
              >
                {urlSaving ? '...' : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="p-1 bg-white border border-neutral-300 text-black hover:bg-neutral-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Project Description */}
        {project.description ? (
          <p className="text-xs text-neutral-600 line-clamp-2 mb-3.5 leading-relaxed font-normal min-h-[32px]">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic mb-3.5 font-mono min-h-[32px]">
            Autonomous repository ingested and synchronized.
          </p>
        )}

        {/* Target Goal (if present) */}
        {project.goal && (
          <div className="mb-3.5 px-3 py-2 bg-[#FAF7EE] border-l-2 border-[#0047FF]">
            <p className="text-xs text-neutral-800 line-clamp-2">
              <span className="text-[#0047FF] font-mono text-[10px] mr-1.5 font-black uppercase">
                TARGET:
              </span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Velocity Progress Bar */}
        <div className="mb-3 pt-1">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-600 font-mono text-[10px] font-bold uppercase tracking-wider">
              VELOCITY PROGRESS
            </span>
            <span className="font-mono text-xs font-bold text-black num-tabular">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#FAF7EE] border border-neutral-300 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                project.progress_percentage === 100
                  ? 'bg-[#10B981]'
                  : project.progress_percentage > 50
                  ? 'bg-[#0047FF]'
                  : 'bg-[#FF5533]'
              }`}
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Card Footer with Details, Triage, Hide, and Manual Reorder Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs gap-2">
          {/* Left Footer: Triage Button or Status Tag */}
          <div className="flex items-center gap-1.5">
            {project.needs_review && onTriageClick ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTriageClick(project);
                }}
                className="text-xs font-mono font-black px-2.5 py-1 bg-[#FF5533] text-black border border-black hover:bg-black hover:text-[#DFFF4F] transition cursor-pointer flex items-center gap-1.5 uppercase"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>TRIAGE</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-800 font-black bg-[#BBF7D0]/60 px-2 py-0.5 border border-emerald-400 uppercase tracking-wider">
                OPTIMIZED
              </span>
            )}

            {/* Manual Order Up / Down Arrows */}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center bg-[#FAF7EE] border border-neutral-300">
                {onMoveUp && (
                  <button
                    onClick={() => onMoveUp(project)}
                    disabled={!canMoveUp}
                    className="p-1 text-black hover:bg-[#DFFF4F] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-r border-neutral-300"
                    title="Move higher in priority"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={() => onMoveDown(project)}
                    disabled={!canMoveDown}
                    className="p-1 text-black hover:bg-[#DFFF4F] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Move lower in priority"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Footer: Hide/Restore Action & Roadmap Link */}
          <div className="flex items-center gap-2">
            {onHideToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onHideToggle(project);
                }}
                className={`p-1.5 border transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                  project.is_hidden
                    ? 'bg-[#0047FF] text-white border-black hover:bg-black font-black'
                    : 'bg-[#FAF7EE] text-neutral-500 border-neutral-300 hover:text-black hover:border-black'
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
              className="flex items-center gap-1 text-xs font-mono font-black text-black hover:text-[#0047FF] hover:translate-x-1 transition-all"
            >
              <span>ROADMAP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
