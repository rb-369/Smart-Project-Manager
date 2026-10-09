'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import {
  Search,
  Sparkles,
  AlertCircle,
  GitBranch,
  Layers,
  Activity,
  Flame,
  ArrowUpRight,
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

  const totalFeatures = projects.reduce((acc, p) => acc + p.total_features, 0);
  const completedFeatures = projects.reduce((acc, p) => acc + p.completed_features, 0);

  const filteredProjects = projects.filter((p) => {
    const matchesType = filterType === 'ALL' || p.project_type === filterType;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col">
      <Navbar onSyncSuccess={fetchProjects} />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-7">
          {/* Top Bento Header Row (3 Asymmetric Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bento Card 1: Velocity & Execution Health */}
            <div className="bento-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">
                  Engineering Pulse
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald animate-pulse" />
                  Live
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight num-tabular">
                    {avgProgress}%
                  </span>
                  <span className="text-xs text-[#94a3b8]">average completion</span>
                </div>
                <div className="w-full h-1.5 bg-[#171a27] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b] pt-3 mt-2 border-t border-white/[0.05] font-mono">
                <span>{completedFeatures}/{totalFeatures} features shipped</span>
                <span className="text-indigo-400">{activeProjects.length} active repos</span>
              </div>
            </div>

            {/* Bento Card 2: AI Roadmap Status */}
            <div className="bento-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  AI Intelligence
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  Multi-Tier
                </span>
              </div>

              <div className="space-y-1.5 my-auto">
                <p className="text-sm font-semibold text-white">Autonomous Roadmap Engine</p>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  OpenRouter &rarr; Gemini &rarr; NVIDIA NIM cascade ensures uninterrupted repo classification and feature backlog synthesis.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05] text-[11px] font-mono text-[#64748b]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Zero rate-limit latency</span>
              </div>
            </div>

            {/* Bento Card 3: Actionable Triage Notification or Repo Counter */}
            {needsReviewProjects.length > 0 ? (
              <div className="bento-card p-5 flex flex-col justify-between border-amber-500/30 bg-gradient-to-br from-[#1c1815]/80 to-[#12141f]/80 shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Action Required
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
                    {needsReviewProjects.length} Pending
                  </span>
                </div>

                <div className="space-y-1 my-2">
                  <h4 className="text-sm font-bold text-white">Unclassified Repositories</h4>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    Imported from GitHub. Run AI triage to generate initial goals and backlog.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                    className="w-full bento-btn-primary py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-white cursor-pointer"
                  >
                    <span>Triage {needsReviewProjects[0].name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bento-card p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">
                    Repository Catalog
                  </span>
                  <GitBranch className="w-4 h-4 text-sky-400" />
                </div>

                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold text-white tracking-tight num-tabular">
                      {projects.length}
                    </span>
                    <span className="text-xs text-[#94a3b8]">total synced repositories</span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                    All repositories verified and synchronized with latest commits.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.05] text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
                  <span>All repositories triaged</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Controls & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {/* Search Input with Holographic Focus */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects or stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0f18]/80 backdrop-blur-md border border-white/[0.08] focus:border-indigo-500/50 rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>

            {/* Segmented Bento Filter Tabs */}
            <div className="flex items-center p-1 bg-[#0d0f18]/80 backdrop-blur-md border border-white/[0.08] rounded-xl text-xs font-medium shadow-inner">
              {(['ALL', 'RESUME', 'COLLEGE', 'PRODUCTION'] as const).map((tab) => {
                const isSelected = filterType === tab;
                const label = tab === 'ALL' ? 'All Projects' : tab.charAt(0) + tab.slice(1).toLowerCase();
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`relative px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/15 text-white font-semibold border border-indigo-500/40 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
                        : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.03]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Bento Grid */}
          {loading ? (
            <div className="py-24 text-center text-xs text-[#94a3b8] font-mono animate-pulse">
              Hydrating repository matrix...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bento-card p-14 text-center space-y-3">
              <GitBranch className="w-9 h-9 text-[#64748b] mx-auto" />
              <p className="text-sm font-semibold text-white">No repositories matching criteria</p>
              <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                {searchQuery
                  ? 'Try adjusting your search terms or category filter.'
                  : 'Click "Sync GitHub" in the top bar to import your repositories.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onTriageClick={(proj) => setActiveTriageProject(proj)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Triage Modal */}
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
