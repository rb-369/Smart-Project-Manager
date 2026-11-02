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
  Radio
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
        return { label: 'ACTIVE', dotColor: 'bg-[#DFFF4F]' };
      case 'PAUSED':
        return { label: 'PAUSED', dotColor: 'bg-amber-400' };
      case 'COMPLETED':
        return { label: 'COMPLETE', dotColor: 'bg-white' };
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
      className={`group transition-all duration-200 hover:-translate-y-1 bg-white border-2 border-black flex flex-col justify-between h-full relative p-5 ${
        project.is_starred
          ? 'shadow-[6px_6px_0px_#000000] ring-2 ring-[#0047FF]/40'
          : project.is_hidden
          ? 'shadow-[3px_3px_0px_#000000] border-dashed opacity-75'
          : 'shadow-[4px_4px_0px_#000000] hover:shadow-[7px_7px_0px_#000000]'
      }`}
    >
      {/* Top Banner Ribbon for Starred or Hidden repos */}
      {project.is_starred && (
        <div className="absolute -top-3.5 left-5 px-3 py-0.5 bg-[#DFFF4F] text-black font-mono text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 z-20">
          <Star className="w-3 h-3 fill-black text-black" />
          <span>MAIN / PINNED</span>
        </div>
      )}

      {project.is_hidden && (
        <div className="absolute -top-3.5 left-5 px-3 py-0.5 bg-black text-white font-mono text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 z-20">
          <EyeOff className="w-3 h-3 text-neutral-300" />
          <span>HIDDEN ARCHIVE</span>
        </div>
      )}

      <div>
        {/* Cobalt Blue / Ink Black Inner Header Block */}
        <div className="bg-[#0047FF] text-white border-2 border-black p-4 shadow-[3px_3px_0px_#000000] mb-3.5 relative overflow-hidden group/box">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-white font-mono font-black uppercase tracking-wider">
                <span className={`w-2 h-2 rounded-full border border-black ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-white/40">&bull;</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-[#DFFF4F] border border-black font-black uppercase tracking-wider">
                {project.project_type}
              </span>
            </div>

            {/* Quick Actions in Inner Box: Star & GitHub */}
            <div className="flex items-center gap-1.5">
              {/* Star Button */}
              {onStarToggle && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onStarToggle(project);
                  }}
                  className={`p-1.5 border-2 border-black transition-all cursor-pointer ${
                    project.is_starred
                      ? 'bg-[#DFFF4F] text-black shadow-[2px_2px_0px_#000000]'
                      : 'bg-white text-black hover:bg-[#F6F3EC] shadow-[1px_1px_0px_#000000]'
                  }`}
                  title={project.is_starred ? 'Unstar (unpin)' : 'Star (pin to top)'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      project.is_starred ? 'fill-black text-black' : 'text-black'
                    }`}
                  />
                </button>
              )}

              {/* GitHub Link */}
              {project.html_url && (
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white text-black border-2 border-black hover:bg-[#DFFF4F] shadow-[1px_1px_0px_#000000] transition"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Project Name */}
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-black text-lg text-white group-hover/box:text-[#DFFF4F] transition-colors tracking-tight flex items-center justify-between truncate">
              <span>{project.name}</span>
            </h3>
          </Link>

          {/* Language & Task Counter */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white/90 pt-2.5 mt-2.5 border-t border-white/20">
            {project.primary_language ? (
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span
                  className={`w-2 h-2 rounded-full border border-black ${getLanguageColor(
                    project.primary_language
                  )}`}
                />
                {project.primary_language}
              </span>
            ) : (
              <span className="uppercase tracking-wider">Codebase</span>
            )}
            <span className="bg-[#DFFF4F] text-black px-2 py-0.5 border border-black font-black num-tabular text-[10px]">
              {project.completed_features}/{project.total_features} TASKS
            </span>
          </div>
        </div>

        {/* Live URL Pill / Production Badge */}
        <div className="mb-3">
          {project.live_url ? (
            <div className="flex items-center justify-between gap-2 p-2 bg-[#BBF7D0] border-2 border-black text-black shadow-[2px_2px_0px_#000000]">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-black text-black hover:underline truncate"
                title={project.live_url}
              >
                <Globe className="w-3.5 h-3.5 shrink-0 text-black" />
                <span className="truncate">
                  {project.live_url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
              </a>

              <button
                onClick={() => {
                  setUrlInput(project.live_url || '');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[10px] font-mono font-black uppercase text-black hover:bg-black hover:text-[#DFFF4F] px-1.5 py-0.5 border border-black transition cursor-pointer"
                title="Edit Deployed URL"
              >
                EDIT
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 px-1 py-0.5">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-neutral-400" />
                <span>NO LIVE DEPLOY</span>
              </span>
              <button
                onClick={() => {
                  setUrlInput('');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[#0047FF] hover:underline font-black cursor-pointer text-[10px] uppercase tracking-wider"
              >
                + ADD LIVE URL
              </button>
            </div>
          )}

          {/* Inline Edit URL Popover */}
          {isEditingUrl && (
            <form onSubmit={handleSaveLiveUrl} className="mt-2 p-2 bg-[#F6F3EC] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="flex-1 bg-white border-2 border-black text-black text-xs font-mono px-2 py-1 outline-none focus:bg-[#FAF7EE]"
                autoFocus
              />
              <button
                type="submit"
                disabled={urlSaving}
                className="px-2.5 py-1 bg-[#0047FF] text-white text-xs font-black border-2 border-black hover:bg-black transition cursor-pointer"
              >
                {urlSaving ? '...' : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="p-1 bg-white border-2 border-black text-black hover:bg-neutral-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-xs text-neutral-700 line-clamp-2 mb-3.5 leading-relaxed font-normal">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic mb-3.5 font-mono">
            Autonomous repository ingested and synchronized.
          </p>
        )}

        {/* Target Goal if available */}
        {project.goal && (
          <div className="mb-4 px-3 py-2 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
            <p className="text-xs text-neutral-900 line-clamp-2">
              <span className="text-[#0047FF] font-mono text-[11px] mr-1.5 font-black uppercase">
                TARGET:
              </span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Velocity Progress Bar */}
        <div className="mb-3.5 pt-1">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-700 font-mono text-[11px] font-black uppercase tracking-wider">
              VELOCITY PROGRESS
            </span>
            <span className="font-mono text-xs font-black text-black num-tabular bg-[#DFFF4F] px-1.5 py-0.2 border border-black">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-[#FAF7EE] border-2 border-black overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-500 border-r-2 border-black ${
                project.progress_percentage === 100
                  ? 'bg-[#DFFF4F]'
                  : project.progress_percentage > 50
                  ? 'bg-[#0047FF]'
                  : 'bg-[#FF5533]'
              }`}
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Card Footer with Details, Triage, Hide, and Manual Reorder Controls */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-black text-xs gap-2">
          {/* Left Footer: Triage Button or Status Tag */}
          <div className="flex items-center gap-1.5">
            {project.needs_review && onTriageClick ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTriageClick(project);
                }}
                className="text-xs font-mono font-black px-3 py-1 bg-[#DFFF4F] text-black border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#DFFF4F] transition cursor-pointer flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>TRIAGE</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono text-black font-black bg-[#BBF7D0] px-2 py-0.5 border-2 border-black uppercase tracking-wider">
                OPTIMIZED
              </span>
            )}

            {/* Manual Order Up / Down Arrows */}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center bg-[#FAF7EE] border-2 border-black">
                {onMoveUp && (
                  <button
                    onClick={() => onMoveUp(project)}
                    disabled={!canMoveUp}
                    className="p-1 text-black hover:bg-[#DFFF4F] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-r border-black"
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
            {/* Soft-Hide or Restore Button */}
            {onHideToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onHideToggle(project);
                }}
                className={`p-1.5 border-2 border-black shadow-[1px_1px_0px_#000000] transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                  project.is_hidden
                    ? 'bg-[#0047FF] text-white hover:bg-black font-black'
                    : 'bg-white text-neutral-600 hover:text-black hover:bg-[#FAF7EE]'
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
              className="flex items-center gap-1 text-xs font-mono font-black text-black hover:text-[#0047FF] hover:translate-x-0.5 transition-all"
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
