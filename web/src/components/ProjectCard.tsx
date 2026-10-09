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
        return 'bg-[#3572A5] shadow-[0_0_8px_#3572A5]';
      case 'typescript':
        return 'bg-[#3178c6] shadow-[0_0_8px_#3178c6]';
      case 'javascript':
        return 'bg-[#f1e05a] shadow-[0_0_8px_#f1e05a]';
      case 'dart':
        return 'bg-[#00B4AB] shadow-[0_0_8px_#00B4AB]';
      case 'go':
        return 'bg-[#00ADD8] shadow-[0_0_8px_#00ADD8]';
      case 'rust':
        return 'bg-[#dea584] shadow-[0_0_8px_#dea584]';
      default:
        return 'bg-[#64748b]';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Active', dotColor: 'bg-emerald-400 glow-emerald' };
      case 'PAUSED':
        return { label: 'Paused', dotColor: 'bg-amber-400 glow-amber' };
      case 'COMPLETED':
        return { label: 'Complete', dotColor: 'bg-cyan-400 glow-cyan' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-slate-500' };
    }
  };

  const statusInfo = getStatusIndicator(project.status);

  return (
    <div className="glass-shell group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
      <div className="glass-core p-5 flex flex-col justify-between h-full">
        <div>
          {/* Top metadata row */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[#cbd5e1] font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-white/20">&bull;</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[#94a3b8] border border-white/[0.08]">
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
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer flex items-center gap-1"
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
                  className="text-[#64748b] hover:text-[#e2e8f0] transition p-1"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Project Name */}
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-semibold text-base text-[#f8fafc] group-hover:text-indigo-300 transition-colors mb-2 tracking-tight flex items-center justify-between">
              <span>{project.name}</span>
            </h3>
          </Link>

          {/* Description */}
          {project.description ? (
            <p className="text-xs text-[#94a3b8] line-clamp-2 mb-4 leading-relaxed font-light">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-[#475569] italic mb-4">No description set</p>
          )}

          {/* Target Goal if available */}
          {project.goal && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-[#cbd5e1] line-clamp-2">
                <span className="text-indigo-400 font-mono text-[11px] mr-1.5 font-medium">Target:</span>
                {project.goal}
              </p>
            </div>
          )}
        </div>

        <div>
          {/* Holographic Velocity Progress Bar */}
          <div className="mb-3.5 pt-1">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#64748b] font-medium text-[11px]">Velocity Progress</span>
              <span className="font-mono text-xs font-semibold text-[#f8fafc] num-tabular">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-px border border-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  project.progress_percentage === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 glow-emerald'
                    : project.progress_percentage > 50
                    ? 'bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                    : 'bg-gradient-to-r from-slate-600 via-indigo-500 to-cyan-500'
                }`}
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Card Footer with Details */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-[#94a3b8]">
            <div className="flex items-center gap-3">
              {project.primary_language && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#e2e8f0]">
                  <span className={`w-2 h-2 rounded-full ${getLanguageColor(project.primary_language)}`} />
                  {project.primary_language}
                </span>
              )}
              <span className="font-mono text-[11px] text-[#64748b] num-tabular">
                {project.completed_features}/{project.total_features} feats
              </span>
            </div>

            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
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

