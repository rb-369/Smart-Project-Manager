'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ProjectType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTriageProject, setActiveTriageProject] = useState<ProjectSummary | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/projects');
      setProjects(res || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const needsReviewProjects = projects.filter((p) => p.needs_review);
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
  const avgProgress = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / projects.length)
    : 0;

  const filteredProjects = projects.filter((p) => {
    const matchesType = filterType === 'ALL' || p.project_type === filterType;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar onSyncSuccess={fetchProjects} />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-8">
          {/* Header Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Project Command Center
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Automated GitHub synchronization, prioritized backlogs, and AI intelligence.
              </p>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center font-bold">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Projects</p>
                <p className="text-xl font-bold text-white">{projects.length}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">In Progress</p>
                <p className="text-xl font-bold text-white">{activeProjects.length}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/15 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Average Completion</p>
                <p className="text-xl font-bold text-white">{avgProgress}%</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-600/15 text-amber-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Needs Review</p>
                <p className="text-xl font-bold text-white">{needsReviewProjects.length}</p>
              </div>
            </div>
          </div>

          {/* Needs Review Alert Tray */}
          {needsReviewProjects.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{needsReviewProjects.length} Newly Discovered GitHub Repositories Require Classification</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {needsReviewProjects.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-200">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.primary_language || 'Repo'}</p>
                    </div>
                    <button
                      onClick={() => setActiveTriageProject(p)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-200" />
                      Review AI
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'COLLEGE', 'RESUME', 'PRODUCTION'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap cursor-pointer ${
                    filterType === t
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {t === 'ALL' ? 'All Projects' : t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No projects found</p>
              <p className="text-xs text-slate-500 mt-1">Click "Sync GitHub" above to import your repositories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </main>
      </div>

      {activeTriageProject && (
        <TriageModal
          project={activeTriageProject}
          isOpen={!!activeTriageProject}
          onClose={() => setActiveTriageProject(null)}
          onConfirmed={fetchProjects}
        />
      )}
    </div>
  );
}
