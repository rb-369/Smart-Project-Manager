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
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Plus,
  GitBranch,
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
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f7] flex flex-col">
      <Navbar onSyncSuccess={fetchProjects} />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          {/* Engineering Header & Status Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1c1d28]">
            <div>
              <h1 className="text-xl font-semibold text-[#f4f4f7] tracking-tight">
                Repository Command Center
              </h1>
              <p className="text-xs text-[#7c8091] mt-0.5">
                Automated GitHub synchronization, prioritized roadmaps, and AI recommendations.
              </p>
            </div>

            {/* High-Density Metric Strip (Replacing Cheesy Stat Boxes) */}
            <div className="flex items-center gap-4 text-xs font-mono bg-[#111218] border border-[#222433] px-3.5 py-1.5 rounded-md">
              <div className="flex items-center gap-1.5">
                <span className="text-[#64687a]">Total:</span>
                <span className="font-semibold text-[#f4f4f7] num-tabular">{projects.length}</span>
              </div>
              <span className="text-[#26283a]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#64687a]">Active:</span>
                <span className="font-semibold text-emerald-400 num-tabular">{activeProjects.length}</span>
              </div>
              <span className="text-[#26283a]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#64687a]">Velocity:</span>
                <span className="font-semibold text-blue-400 num-tabular">{avgProgress}%</span>
              </div>
            </div>
          </div>

          {/* Actionable Triage Notification Inbox if any repos need review */}
          {needsReviewProjects.length > 0 && (
            <div className="p-3.5 rounded-lg bg-[#15131a] border border-amber-900/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-200">
                    {needsReviewProjects.length} newly ingested {needsReviewProjects.length === 1 ? 'repository requires' : 'repositories require'} triage
                  </p>
                  <p className="text-[11px] text-[#8b8a96]">
                    Classify project category and initial feature backlogs via AI or manual review.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {needsReviewProjects.slice(0, 2).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveTriageProject(p)}
                    className="text-xs font-medium px-2.5 py-1 rounded bg-[#201c24] hover:bg-[#2c2633] text-amber-300 border border-amber-700/40 transition cursor-pointer"
                  >
                    Triage {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Precision Controls Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#555866] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111218] border border-[#222433] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#f4f4f7] placeholder-[#555866] focus:outline-none focus:border-blue-500 transition font-sans"
              />
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex items-center p-0.5 bg-[#111218] border border-[#222433] rounded-md text-xs font-medium">
              {(['ALL', 'RESUME', 'COLLEGE', 'PRODUCTION'] as const).map((tab) => {
                const isSelected = filterType === tab;
                const label = tab === 'ALL' ? 'All Repos' : tab.charAt(0) + tab.slice(1).toLowerCase();
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1 rounded transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#1e202d] text-[#ffffff] font-semibold'
                        : 'text-[#6e7285] hover:text-[#c4c7d6]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project List / Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#6e7285] font-mono">
              Fetching repositories...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="craft-panel p-12 rounded-lg text-center space-y-3">
              <GitBranch className="w-8 h-8 text-[#4a4e60] mx-auto" />
              <p className="text-sm font-medium text-[#c4c7d6]">No matching repositories found</p>
              <p className="text-xs text-[#6e7285] max-w-sm mx-auto">
                {searchQuery
                  ? 'Try adjusting your search query or filter settings.'
                  : 'Click "Sync GitHub" in the top bar to fetch your public & private repositories.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* AI Triage Review Modal */}
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
