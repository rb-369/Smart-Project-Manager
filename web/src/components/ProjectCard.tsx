import Link from 'next/link';
import { ProjectSummary } from '@/types';
import { ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectSummary;
  onTriageClick?: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, onTriageClick }: ProjectCardProps) {
  const getLanguageColor = (lang: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'python':
        return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
      case 'typescript':
        return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]';
      case 'javascript':
        return 'bg-[#C6FF20] shadow-[0_0_8px_rgba(198,255,32,0.6)]';
      case 'dart':
        return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]';
      case 'go':
        return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]';
      case 'rust':
        return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]';
      default:
        return 'bg-zinc-500';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Active', dotColor: 'bg-[#C6FF20] pulse-lime' };
      case 'PAUSED':
        return { label: 'Paused', dotColor: 'bg-amber-400' };
      case 'COMPLETED':
        return { label: 'Complete', dotColor: 'bg-[#7020DD] pulse-violet' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-zinc-600' };
    }
  };

  const statusInfo = getStatusIndicator(project.status);

  return (
    <div className="gridster-panel group transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700">
      <div className="p-5 flex flex-col justify-between h-full bg-zinc-950/70">
        <div>
          {/* Top metadata row */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-zinc-700">&bull;</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                {project.project_type}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {project.needs_review && onTriageClick && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onTriageClick(project);
                  }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C6FF20]/15 border border-[#C6FF20]/40 text-[#C6FF20] hover:bg-[#C6FF20]/25 transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Triage
                </button>
              )}

              {project.html_url && (
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition p-1"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Project Name */}
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-bold text-base text-white group-hover:text-[#C6FF20] transition-colors mb-2 tracking-tight flex items-center justify-between">
              <span>{project.name}</span>
            </h3>
          </Link>

          {/* Description */}
          {project.description ? (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed font-light">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic mb-4">No description set</p>
          )}

          {/* Target Goal if available */}
          {project.goal && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-xs text-zinc-300 line-clamp-2">
                <span className="text-[#C6FF20] font-mono text-[11px] mr-1.5 font-bold">Target:</span>
                {project.goal}
              </p>
            </div>
          )}
        </div>

        <div>
          {/* Holographic Velocity Progress Bar */}
          <div className="mb-3.5 pt-1">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-zinc-500 font-mono text-[11px]">Velocity Progress</span>
              <span className="font-mono text-xs font-bold text-white num-tabular">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden p-px border border-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  project.progress_percentage === 100
                    ? 'bg-[#C6FF20] pulse-lime'
                    : project.progress_percentage > 50
                    ? 'bg-gradient-to-r from-[#7020DD] to-[#C6FF20]'
                    : 'bg-gradient-to-r from-zinc-700 to-[#7020DD]'
                }`}
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Card Footer with Details */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              {project.primary_language && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                  <span className={`w-2 h-2 rounded-full ${getLanguageColor(project.primary_language)}`} />
                  {project.primary_language}
                </span>
              )}
              <span className="font-mono text-[11px] text-zinc-500 num-tabular">
                {project.completed_features}/{project.total_features} feats
              </span>
            </div>

            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-1 text-xs font-bold text-[#C6FF20] hover:underline"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
