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
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col bg-grid-pattern selection:bg-[#C6FF20] selection:text-black">
      {/* Gridster Ambient Lighting */}
      <div className="ambient-glow-blue -top-40 left-1/4" />
      <div className="ambient-glow-lime top-60 -right-40" />
      <div className="ambient-glow-violet bottom-32 left-1/3" />

      {/* Floating Island Navigation */}
      <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

      {/* Main Spacious Container */}
      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Executive Bento Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Bento Card 1: Repository Health Telemetry with Illuminated Wave (5 cols) */}
          <div className="lg:col-span-5 gridster-panel gridster-panel-blue">
            <div className="p-6 h-full flex flex-col justify-between bg-zinc-950/80">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0A5CFF] pulse-blue" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                      Telemetry Waveform
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#0A5CFF] bg-[#0A5CFF]/15 px-2 py-0.5 rounded-full border border-[#0A5CFF]/30 font-bold">
                    SPECTRUM LIVE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="text-2xl font-black text-white font-mono num-tabular">98.5%</div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Build Success</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono num-tabular">2.1 Hr</div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Avg PR Review</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#C6FF20] font-mono num-tabular">
                      {totalFeatures || 15}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Features</div>
                  </div>
                </div>
              </div>

              {/* Glowing SVG Wave Line Chart (Blue to Lime to Violet) */}
              <div className="relative pt-2">
                <svg viewBox="0 0 400 90" className="w-full h-20 overflow-visible">
                  <defs>
                    <linearGradient id="limeWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0A5CFF" />
                      <stop offset="50%" stopColor="#C6FF20" />
                      <stop offset="100%" stopColor="#7020DD" />
                    </linearGradient>
                    <linearGradient id="limeWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0A5CFF" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#C6FF20" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#7020DD" stopOpacity="0" />
                    </linearGradient>
                    <filter id="limeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Wave Fill Area */}
                  <path
                    d="M 0,70 Q 50,25 100,55 T 200,30 T 300,45 T 400,15 L 400,90 L 0,90 Z"
                    fill="url(#limeWaveFill)"
                  />
                  {/* Wave Stroke Line */}
                  <path
                    d="M 0,70 Q 50,25 100,55 T 200,30 T 300,45 T 400,15"
                    fill="none"
                    stroke="url(#limeWaveStroke)"
                    strokeWidth="2.5"
                    filter="url(#limeGlow)"
                  />
                </svg>

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-1">
                  <span>T-30d</span>
                  <span className="text-[#C6FF20]">Active Gridster Cycle</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Dual Circular Gauges in Lime & Violet (4 cols) */}
          <div className="lg:col-span-4 gridster-panel gridster-panel-violet">
            <div className="p-6 h-full flex flex-col justify-between bg-zinc-950/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Velocity Gauges
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#7020DD] pulse-violet" />
              </div>

              {/* Dual Concentric Circular Gauges */}
              <div className="grid grid-cols-2 gap-4 my-auto py-2">
                {/* Sprint Velocity Gauge (Acid Lime) */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="text-zinc-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#C6FF20"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - (avgProgress || 65) / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 shadow-[0_0_12px_#C6FF20]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white font-mono num-tabular">
                        {avgProgress || 42}%
                      </span>
                      <span className="text-[9px] font-mono text-[#C6FF20]">Velocity</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-200 mt-2 font-mono">Sprint Velocity</span>
                  <span className="text-[10px] font-mono text-zinc-500">Weighted</span>
                </div>

                {/* Code Coverage Gauge (Electric Violet) */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="text-zinc-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#7020DD"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - 0.89)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 shadow-[0_0_12px_#7020DD]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white font-mono num-tabular">89%</span>
                      <span className="text-[9px] font-mono text-purple-300">Coverage</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-200 mt-2 font-mono">Test Coverage</span>
                  <span className="text-[10px] font-mono text-zinc-500">Unit & Spec</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span>Completed: {completedFeatures}/{totalFeatures}</span>
                <span className="text-[#C6FF20] font-bold">{activeProjects.length} Active Repos</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Cascading AI Models Status & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 gridster-panel">
            <div className="p-6 h-full flex flex-col justify-between bg-zinc-950/80">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <Cpu className="w-3.5 h-3.5 text-[#C6FF20]" />
                    AI Cascade Matrix
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#C6FF20]/15 border border-[#C6FF20]/30 text-[#C6FF20] font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Engine Matrix list */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-200 font-mono text-[11px]">Gemini 2.5 Pro</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#C6FF20] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF20] pulse-lime" />
                      Primary
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-200 font-mono text-[11px]">Claude 3.5 Sonnet</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7020DD] pulse-violet" />
                      Fallback 1
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-200 font-mono text-[11px]">NVIDIA NIM</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      Fallback 2
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {needsReviewProjects.length > 0 ? (
                  <button
                    onClick={() => setActiveTriageProject(needsReviewProjects[0])}
                    className="w-full btn-lime !py-2.5 !px-3 !justify-between text-xs font-bold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Triage ({needsReviewProjects.length})</span>
                    </span>
                    <span>&rarr;</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#C6FF20] font-mono py-1.5 px-2.5 rounded-lg bg-[#C6FF20]/10 border border-[#C6FF20]/25">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All repositories synchronized</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-full shadow-inner overflow-x-auto max-w-full">
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                    isSelected 
                      ? 'bg-[#C6FF20] text-black font-bold shadow-[0_0_15px_rgba(198,255,32,0.3)]' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] font-mono ml-1.5 px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-white/[0.08] text-zinc-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-zinc-500">
            Showing <span className="text-white font-bold">{filteredProjects.length}</span> of {projects.length} repos
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="py-28 text-center text-xs text-zinc-400 font-mono animate-pulse">
            Hydrating repository intelligence matrix...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="gridster-panel p-16 text-center space-y-3 bg-zinc-950/80">
            <GitBranch className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-base font-bold text-white">No repositories found</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-mono">
              {searchQuery
                ? 'No results matched your search term. Try adjusting filters.'
                : 'Click "Sync" in the top bar to pull repositories from GitHub.'}
            </p>
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
