import Link from 'next/link';
import { ProjectSummary } from '@/types';
import { ExternalLink, ArrowRight, Sparkles, GitBranch } from 'lucide-react';

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

  return (
    <div className="gridster-panel group transition-all duration-300 hover:-translate-y-1 bg-white border border-slate-200/90 shadow-md hover:shadow-xl rounded-3xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Electric Blue Inner Box (Matching Card 1 & 2 in User Reference) */}
        <div className="bg-[#0038FF] text-white rounded-2xl p-4 shadow-inner mb-4 relative overflow-hidden group/box">
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

            <div className="flex items-center gap-1.5">
              {project.html_url && (
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition p-1"
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

          {/* Language and features micro pill */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/80 pt-2 mt-2 border-t border-white/15">
            {project.primary_language ? (
              <span className="flex items-center gap-1.5 font-bold">
                <span className={`w-2 h-2 rounded-full ${getLanguageColor(project.primary_language)}`} />
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

        {/* Description */}
        {project.description ? (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed font-normal">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-3.5">Autonomous repo ingested and synced.</p>
        )}

        {/* Target Goal if available */}
        {project.goal && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-700 line-clamp-2">
              <span className="text-[#0038FF] font-mono text-[11px] mr-1.5 font-bold">Target:</span>
              {project.goal}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Holographic Velocity Progress Bar */}
        <div className="mb-3.5 pt-1">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-500 font-mono text-[11px] font-semibold">Velocity Progress</span>
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

        {/* Card Footer with Details & Triage */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          {project.needs_review && onTriageClick ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTriageClick(project);
              }}
              className="text-xs font-mono font-black px-3 py-1 rounded-full bg-[#C6FF20] text-black hover:bg-[#d5ff38] transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>Triage</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              OPTIMIZED
            </span>
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
  );
}
