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
  Link2,
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
        return 'bg-blue-600 shadow-xs';
      case 'typescript':
        return 'bg-sky-500 shadow-xs';
      case 'javascript':
        return 'bg-amber-400 shadow-xs';
      case 'dart':
        return 'bg-teal-500 shadow-xs';
      case 'go':
        return 'bg-cyan-500 shadow-xs';
      case 'rust':
        return 'bg-orange-500 shadow-xs';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Active', dotColor: 'bg-[#C6FF20] pulse-lime' };
      case 'PAUSED':
        return { label: 'Paused', dotColor: 'bg-amber-400' };
      case 'COMPLETED':
        return { label: 'Complete', dotColor: 'bg-white' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-slate-300' };
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
      className={`gridster-panel group transition-all duration-300 hover:-translate-y-1 bg-white border ${
        project.is_starred
          ? 'border-amber-300/80 ring-2 ring-amber-400/30 shadow-lg'
          : project.is_hidden
          ? 'border-dashed border-slate-300 opacity-75'
          : 'border-slate-200/90 shadow-md hover:shadow-xl'
      } rounded-3xl p-5 flex flex-col justify-between h-full relative`}
    >
      {/* Top Banner Ribbon for Starred or Hidden repos */}
      {project.is_starred && (
        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-mono text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 z-20">
          <Star className="w-2.5 h-2.5 fill-black" />
          <span>MAIN / PINNED</span>
        </div>
      )}

      {project.is_hidden && (
        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-800 text-white font-mono text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1 z-20">
          <EyeOff className="w-2.5 h-2.5 text-slate-300" />
          <span>HIDDEN FROM DEFAULT VIEW</span>
        </div>
      )}

      <div>
        {/* Electric Blue Inner Box */}
        <div className="bg-[#0038FF] text-white rounded-2xl p-4 shadow-inner mb-3.5 relative overflow-hidden group/box">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-white/90 font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-white/40">&bull;</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20 font-bold">
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
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    project.is_starred
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                  title={project.is_starred ? 'Unstar (unpin)' : 'Star (pin to top)'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      project.is_starred ? 'fill-black text-black' : ''
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
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Project Name */}
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-black text-lg text-white group-hover/box:text-[#C6FF20] transition-colors tracking-tight flex items-center justify-between truncate">
              <span>{project.name}</span>
            </h3>
          </Link>

          {/* Language & Task Counter */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/80 pt-2 mt-2 border-t border-white/15">
            {project.primary_language ? (
              <span className="flex items-center gap-1.5 font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${getLanguageColor(
                    project.primary_language
                  )}`}
                />
                {project.primary_language}
              </span>
            ) : (
              <span>Codebase</span>
            )}
            <span className="text-[#C6FF20] font-bold num-tabular">
              {project.completed_features}/{project.total_features} TASKS
            </span>
          </div>
        </div>

        {/* Live URL Pill / Production Badge */}
        <div className="mb-3">
          {project.live_url ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-black text-emerald-700 hover:text-emerald-900 transition truncate"
                title={project.live_url}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {project.live_url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
              </a>

              <button
                onClick={() => {
                  setUrlInput(project.live_url || '');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[10px] font-mono text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                title="Edit Deployed URL"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1 text-slate-400">
                <Radio className="w-3 h-3 text-slate-300" />
                <span>No live deployment</span>
              </span>
              <button
                onClick={() => {
                  setUrlInput('');
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[#0038FF] hover:underline font-bold cursor-pointer text-[10px]"
              >
                + Add Vercel Link
              </button>
            </div>
          )}

          {/* Inline Edit URL Popover */}
          {isEditingUrl && (
            <form onSubmit={handleSaveLiveUrl} className="mt-2 p-2 rounded-xl bg-slate-100 border border-slate-300 flex items-center gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-2 py-1 outline-none focus:border-[#0038FF]"
                autoFocus
              />
              <button
                type="submit"
                disabled={urlSaving}
                className="px-2.5 py-1 rounded-lg bg-[#0038FF] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                {urlSaving ? '...' : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed font-normal">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-3.5">
            Autonomous repo ingested and synced.
          </p>
        )}

        {/* Target Goal if available */}
        {project.goal && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-700 line-clamp-2">
              <span className="text-[#0038FF] font-mono text-[11px] mr-1.5 font-bold">
                Target:
              </span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Holographic Velocity Progress Bar */}
        <div className="mb-3.5 pt-1">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-500 font-mono text-[11px] font-semibold">
              Velocity Progress
            </span>
            <span className="font-mono text-xs font-black text-slate-950 num-tabular">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.progress_percentage === 100
                  ? 'bg-[#C6FF20]'
                  : project.progress_percentage > 50
                  ? 'bg-gradient-to-r from-[#0038FF] to-[#C6FF20]'
                  : 'bg-gradient-to-r from-[#0038FF] to-violet-500'
              }`}
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Card Footer with Details, Triage, Hide, and Manual Reorder Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs gap-2">
          {/* Left Footer: Triage Button or Status Tag */}
          <div className="flex items-center gap-1.5">
            {project.needs_review && onTriageClick ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTriageClick(project);
                }}
                className="text-xs font-mono font-black px-3 py-1 rounded-full bg-[#C6FF20] text-black hover:bg-[#d5ff38] transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Triage</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                OPTIMIZED
              </span>
            )}

            {/* Manual Order Up / Down Arrows */}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {onMoveUp && (
                  <button
                    onClick={() => onMoveUp(project)}
                    disabled={!canMoveUp}
                    className="p-1 rounded text-slate-600 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Move higher in priority"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={() => onMoveDown(project)}
                    disabled={!canMoveDown}
                    className="p-1 rounded text-slate-600 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
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
                className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                  project.is_hidden
                    ? 'bg-blue-50 border-blue-200 text-[#0038FF] hover:bg-blue-100 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'
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
                    <span>Restore</span>
                  </>
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            )}

            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-1 text-xs font-black text-[#0038FF] hover:underline"
            >
              <span>Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
