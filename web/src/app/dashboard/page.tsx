'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import {
  Search,
  Sparkles,
  AlertCircle,
  GitBranch,
  Activity,
  Plus,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
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
    <div className="min-h-screen bg-[#050508] text-[#f8fafc] relative overflow-hidden flex flex-col">
      {/* ====================================================================
          ATMOSPHERIC CHROMATIC LIGHT ORBS (DIFFUSING UNDER REAL FROSTED GLASS)
          ==================================================================== */}
      <div className="liquid-glow-orb-purple -top-40 left-1/4" />
      <div className="liquid-glow-orb-cyan top-48 -right-40" />
      <div className="liquid-glow-orb-emerald -bottom-20 left-1/3" />
      <div className="liquid-glow-orb-magenta bottom-96 -left-32" />

      {/* Floating Island Navigation */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Main Spacious Container */}
      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* ==================================================================
            REFERENCE A: TOP EXECUTIVE BENTO ROW (DOUBLE-BEZEL MACHINED GLASS)
            ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Bento Card 1: Repository Health Telemetry with Illuminated Wave (5 cols) */}
          <div className="lg:col-span-5 glass-shell">
            <div className="glass-core p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
                    <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">
                      Repository Health Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b]">Commit Activity</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white num-tabular">98.5%</div>
                    <div className="text-[11px] text-[#64748b] leading-tight mt-0.5">Build Success</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white num-tabular">2.1 Hr</div>
                    <div className="text-[11px] text-[#64748b] leading-tight mt-0.5">Avg PR Review</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white num-tabular">
                      {totalFeatures || 15}
                    </div>
                    <div className="text-[11px] text-[#64748b] leading-tight mt-0.5">Tracked Features</div>
                  </div>
                </div>
              </div>

              {/* Glowing SVG Wave Line Chart */}
              <div className="relative pt-2">
                <svg viewBox="0 0 400 90" className="w-full h-20 overflow-visible">
                  <defs>
                    <linearGradient id="waveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Wave Fill Area */}
                  <path
                    d="M 0,70 Q 50,30 100,55 T 200,35 T 300,50 T 400,20 L 400,90 L 0,90 Z"
                    fill="url(#waveFill)"
                  />
                  {/* Wave Stroke Line */}
                  <path
                    d="M 0,70 Q 50,30 100,55 T 200,35 T 300,50 T 400,20"
                    fill="none"
                    stroke="url(#waveStroke)"
                    strokeWidth="2.5"
                    filter="url(#neonGlow)"
                  />
                </svg>

                <div className="flex justify-between items-center text-[10px] font-mono text-[#64748b] pt-1">
                  <span>T-30d</span>
                  <span>Active Cycle</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Holographic Velocity Circular Gauges (4 cols) */}
          <div className="lg:col-span-4 glass-shell">
            <div className="glass-core p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                  Holographic Velocity Gauges
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 glow-violet animate-pulse" />
              </div>

              {/* Dual Concentric Circular Gauges */}
              <div className="grid grid-cols-2 gap-4 my-auto py-2">
                {/* Sprint Velocity Gauge */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="text-white/10"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="url(#waveStroke)"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - (avgProgress || 65) / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white num-tabular">
                        {avgProgress || 42}%
                      </span>
                      <span className="text-[9px] font-mono text-[#94a3b8]">Velocity</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#cbd5e1] mt-2">Sprint Velocity</span>
                  <span className="text-[10px] text-[#64748b]">Story Points</span>
                </div>

                {/* Code Coverage Gauge */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="text-white/10"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - 0.89)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 shadow-[0_0_12px_#10b981]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white num-tabular">89%</span>
                      <span className="text-[9px] font-mono text-emerald-400">Coverage</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#cbd5e1] mt-2">Code Coverage</span>
                  <span className="text-[10px] text-[#64748b]">Unit & Widget</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#94a3b8] pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span>Completed: {completedFeatures}/{totalFeatures}</span>
                <span className="text-emerald-400 font-semibold">{activeProjects.length} Active Repos</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Cascading AI Models Status & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 glass-shell">
            <div className="glass-core p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Cascading AI Engine
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    Live
                  </span>
                </div>

                {/* Engine Matrix list */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[#cbd5e1] font-mono text-[11px]">Gemini 2.5 Pro</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[#cbd5e1] font-mono text-[11px]">Claude 3.5 Sonnet</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 glow-cyan" />
                      Ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[#cbd5e1] font-mono text-[11px]">DeepSeek R1</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-violet-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 glow-violet" />
                      Fallback
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {needsReviewProjects.length > 0 ? (
                  <button
                    onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                    className="w-full glass-pill-btn !justify-between bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Triage ({needsReviewProjects.length})</span>
                    </span>
                    <span className="glass-btn-icon bg-amber-500/20 text-amber-300">&rarr;</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All repositories synchronized</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            CATEGORY FILTER PILLS & SEARCH BAR
            ================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-full shadow-inner overflow-x-auto max-w-full">
            {(['ALL', 'RESUME', 'COLLEGE', 'PRODUCTION'] as const).map((tab) => {
              const isSelected = filterType === tab;
              const count =
                tab === 'ALL'
                  ? projects.length
                  : projects.filter((p) => p.project_type === tab).length;
              const label = tab === 'ALL' ? 'All Repositories' : tab.charAt(0) + tab.slice(1).toLowerCase();
              return (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`glass-nav-pill ${isSelected ? 'active' : ''}`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/[0.05] text-[#64748b]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-[#64748b]">
            Showing <span className="text-white font-semibold">{filteredProjects.length}</span> of {projects.length} projects
          </div>
        </div>

        {/* ==================================================================
            PROJECT GRID (DOUBLE-BEZEL GLASS PANES)
            ================================================================== */}
        {loading ? (
          <div className="py-28 text-center text-xs text-[#94a3b8] font-mono animate-pulse">
            Hydrating repository intelligence matrix...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="glass-shell">
            <div className="glass-core p-16 text-center space-y-3">
              <GitBranch className="w-10 h-10 text-[#64748b] mx-auto" />
              <p className="text-base font-semibold text-white">No repositories found</p>
              <p className="text-xs text-[#94a3b8] max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? 'No results matched your search term. Try adjusting filters.'
                  : 'Click "Sync" in the top floating island to pull repositories from GitHub.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

