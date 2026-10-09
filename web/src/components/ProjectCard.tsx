import Link from 'next/link';
import { ProjectSummary } from '@/types';
import { GitBranch, Star, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const typeBadgeColors = {
    COLLEGE: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
    RESUME: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40',
    PRODUCTION: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
  };

  const statusBadgeColors = {
    IDEATION: 'bg-slate-800 text-slate-300',
    IN_PROGRESS: 'bg-blue-950/60 text-blue-300 border border-blue-800/40',
    PAUSED: 'bg-amber-950/60 text-amber-300 border border-amber-800/40',
    COMPLETED: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40',
    ARCHIVED: 'bg-slate-900 text-slate-500',
  };

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col justify-between border border-slate-800/80 hover:border-indigo-500/30 transition group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadgeColors[project.project_type] || 'bg-slate-800'}`}>
              {project.project_type}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadgeColors[project.status] || 'bg-slate-800'}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>

          {project.html_url && (
            <a
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition"
              title="View on GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <Link href={`/projects/${project.id}`}>
          <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition mb-1">
            {project.name}
          </h3>
        </Link>

        {project.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {project.goal && (
          <div className="mb-4 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-0.5">Primary Goal</p>
            <p className="text-xs text-slate-300 font-medium line-clamp-2">{project.goal}</p>
          </div>
        )}
      </div>

      <div>
        {/* Progress bar */}
        <div className="mb-3.5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Completion Progress</span>
            <span className="font-bold text-indigo-300">{project.progress_percentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Footer info & Link */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            {project.primary_language && (
              <span className="font-medium text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                {project.primary_language}
              </span>
            )}
            <span title="Features done / total">
              {project.completed_features}/{project.total_features} feats
            </span>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
