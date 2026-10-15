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
        return 'bg-blue-600 shadow-xs';
      case 'typescript':
        return 'bg-sky-600 shadow-xs';
      case 'javascript':
        return 'bg-amber-500 shadow-xs';
      case 'dart':
        return 'bg-teal-600 shadow-xs';
      case 'go':
        return 'bg-cyan-600 shadow-xs';
      case 'rust':
        return 'bg-orange-600 shadow-xs';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Active', dotColor: 'bg-[#0A5CFF] pulse-blue' };
      case 'PAUSED':
        return { label: 'Paused', dotColor: 'bg-amber-500' };
      case 'COMPLETED':
        return { label: 'Complete', dotColor: 'bg-[#7020DD] pulse-violet' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-slate-400' };
    }
  };

  const statusInfo = getStatusIndicator(project.status);

  return (
    <div className="gridster-panel group transition-all duration-300 hover:-translate-y-1 bg-white border border-slate-200">
      <div className="p-5 flex flex-col justify-between h-full">
        <div>
          {/* Top metadata row */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
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
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-lime-100 border border-lime-300 text-lime-800 hover:bg-lime-200 transition cursor-pointer flex items-center gap-1"
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
                  className="text-slate-400 hover:text-slate-800 transition p-1"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Project Name */}
          <Link href={`/projects/${project.id}`}>
            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0A5CFF] transition-colors mb-2 tracking-tight flex items-center justify-between">
              <span>{project.name}</span>
            </h3>
          </Link>

          {/* Description */}
          {project.description ? (
            <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-light">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic mb-4">No description set</p>
          )}

          {/* Target Goal if available */}
          {project.goal && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs text-slate-700 line-clamp-2">
                <span className="text-[#0A5CFF] font-mono text-[11px] mr-1.5 font-bold">Target:</span>
                {project.goal}
              </p>
            </div>
          )}
        </div>

        <div>
          {/* Holographic Velocity Progress Bar */}
          <div className="mb-3.5 pt-1">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-500 font-mono text-[11px]">Velocity Progress</span>
              <span className="font-mono text-xs font-bold text-slate-900 num-tabular">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-px border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  project.progress_percentage === 100
                    ? 'bg-[#C6FF20] pulse-lime'
                    : project.progress_percentage > 50
                    ? 'bg-gradient-to-r from-[#0A5CFF] to-[#C6FF20]'
                    : 'bg-gradient-to-r from-slate-400 to-[#0A5CFF]'
                }`}
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Card Footer with Details */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {project.primary_language && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-slate-700 font-medium">
                  <span className={`w-2 h-2 rounded-full ${getLanguageColor(project.primary_language)}`} />
                  {project.primary_language}
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-400 num-tabular">
                {project.completed_features}/{project.total_features} feats
              </span>
            </div>

            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-1 text-xs font-bold text-[#0A5CFF] hover:underline"
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
