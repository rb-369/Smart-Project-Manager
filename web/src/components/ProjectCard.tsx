import Link from 'next/link';
import { ProjectSummary } from '@/types';
import { Star, ExternalLink, ArrowRight, GitFork } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectSummary;
  onTriageClick?: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, onTriageClick }: ProjectCardProps) {
  const getLanguageColor = (lang: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'python':
        return 'bg-[#3572A5]';
      case 'typescript':
        return 'bg-[#3178c6]';
      case 'javascript':
        return 'bg-[#f1e05a]';
      case 'dart':
        return 'bg-[#00B4AB]';
      case 'go':
        return 'bg-[#00ADD8]';
      case 'rust':
        return 'bg-[#dea584]';
      default:
        return 'bg-[#6e7681]';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Active', dotColor: 'bg-emerald-400' };
      case 'PAUSED':
        return { label: 'Paused', dotColor: 'bg-amber-400' };
      case 'COMPLETED':
        return { label: 'Complete', dotColor: 'bg-blue-400' };
      default:
        return { label: status.replace('_', ' '), dotColor: 'bg-slate-500' };
    }
  };

  const statusInfo = getStatusIndicator(project.status);

  return (
    <div className="craft-card rounded-lg p-4 flex flex-col justify-between group">
      <div>
        {/* Top metadata strip */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#8b8f9e]">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
            <span className="text-[#3a3e52]">&bull;</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#161722] text-[#8b8f9e] border border-[#222433]">
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
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
              >
                Needs Review
              </button>
            )}

            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#555866] hover:text-[#c5c8d6] transition"
                title="Open in GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Project Name */}
        <Link href={`/projects/${project.id}`}>
          <h3 className="font-semibold text-sm text-[#f4f4f7] group-hover:text-blue-400 transition mb-1.5 tracking-tight">
            {project.name}
          </h3>
        </Link>

        {/* Description or Objective */}
        {project.description ? (
          <p className="text-xs text-[#7c8091] line-clamp-2 mb-3 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-[#4b4e5e] italic mb-3">No description provided</p>
        )}

        {project.goal && (
          <div className="mb-3 px-2.5 py-1.5 rounded bg-[#14151e] border border-[#1e202c]">
            <p className="text-xs text-[#a0a4b5] line-clamp-2">
              <span className="text-[#5c6072] font-medium mr-1.5">Target:</span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Precision Progress Bar */}
        <div className="mb-3 pt-1">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-[#64687a] font-medium">Progress</span>
            <span className="font-mono text-xs font-semibold text-[#f4f4f7] num-tabular">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1b1c26] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                project.progress_percentage === 100
                  ? 'bg-emerald-400'
                  : project.progress_percentage > 50
                  ? 'bg-blue-500'
                  : 'bg-[#4b5563]'
              }`}
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#1c1d28] text-xs text-[#6e7285]">
          <div className="flex items-center gap-3">
            {project.primary_language && (
              <span className="flex items-center gap-1.5 text-[#8b8f9e]">
                <span className={`w-2 h-2 rounded-full ${getLanguageColor(project.primary_language)}`} />
                {project.primary_language}
              </span>
            )}
            <span className="font-mono text-[11px] num-tabular">
              {project.completed_features}/{project.total_features} done
            </span>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1 text-xs font-medium text-[#8b8f9e] hover:text-white transition"
          >
            <span>Open</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
