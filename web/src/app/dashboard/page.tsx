'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { TriageModal } from '@/components/TriageModal';
import {
  GitBranch,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Terminal,
  ShieldCheck
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

  const tickerItems = [
    '⚡ 100% REPO VISIBILITY',
    '⚡ MATHEMATICAL VELOCITY PHYSICS',
    '⚡ CONTINUOUS GITHUB SYNC',
    '⚡ ZERO STALE BACKLOGS',
    '⚡ MULTI-TIER AI INFERENCE',
    '⚡ AUTONOMOUS CODE REVIEW'
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#C6FF20] selection:text-black">
      
      {/* ====================================================================
          1. TOP HERO: ELECTRIC BLUE BLUEPRINT GRID (Matching Landing Page)
          ==================================================================== */}
      <section className="bg-blue-grid text-white pt-6 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Ambient Vignettes on Blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-[#C6FF20]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Island Navigation Header */}
        <Navbar onSyncSuccess={fetchProjects} onSearchChange={setSearchQuery} />

        {/* Hero Content Block */}
        <div className="max-w-6xl mx-auto text-center relative z-10 pt-20 pb-8">
          
          {/* Top Neon Badge Pill */}
          <div className="flex justify-center mb-5">
            <span className="lime-sticker text-xs font-black shadow-[0_4px_16px_rgba(198,255,32,0.4)]">
              ⚡ AUTONOMOUS REPO COMMAND CENTER
            </span>
          </div>

          {/* Massive Stacked White Headline */}
          <div className="relative inline-block max-w-5xl mx-auto px-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[0.95]">
              <div className="tracking-tight mb-2">WORKSPACE</div>
              <div className="flex items-center justify-center flex-wrap gap-3 mt-1 sm:mt-2">
                <span className="tracking-tight">TELEMETRY</span>
                <span className="inline-block bg-[#C6FF20] text-black px-4 py-1 sm:py-2 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl font-black shadow-[0_8px_30px_rgba(198,255,32,0.6)] -rotate-1 hover:rotate-0 transition-transform">
                  LIVE RADAR
                </span>
              </div>
            </h1>

            {/* Hand-Drawn SVG Neon Lime Arrow */}
            <div className="hidden md:block absolute -top-6 -right-10 text-[#C6FF20]">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-12">
                <path d="M20 70 C 35 30, 65 30, 75 40" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" />
                <path d="M60 28 L 78 40 L 70 58" stroke="#C6FF20" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Subtext */}
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto mt-5 leading-relaxed font-normal">
            Continuous GitHub branch telemetry, multi-tier AI AST decomposition, and mathematical velocity tracking for active codebases.
          </p>

          {/* Live Quick Counters Pills on Electric Blue */}
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C6FF20] pulse-lime" />
              <span>{projects.length} Total Repos</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <span className="text-[#C6FF20]">⚡</span>
              <span>{avgProgress}% Avg Velocity</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <span className="text-purple-300">AI</span>
              <span>{needsReviewProjects.length} Needs Triage</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
              <span className="text-sky-300">✓</span>
              <span>{completedFeatures}/{totalFeatures} Tasks Shipped</span>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          2. ACID LIME TICKER MARQUEE TAPE
          ==================================================================== */}
      <div className="w-full bg-[#C6FF20] text-black font-mono font-black text-xs sm:text-sm uppercase py-3 tracking-wider border-y-2 border-black/15 overflow-hidden select-none relative z-30 shadow-lg">
        <div className="animate-marquee gap-8">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              <span className="text-black/30 font-bold text-lg">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. CLEAN BRIGHT WHITE CURVED SHEET (Interactive Hub)
          ==================================================================== */}
      <main className="bg-white text-slate-900 rounded-t-[44px] sm:rounded-t-[60px] -mt-6 relative z-20 shadow-2xl pt-14 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        
        {/* Top Executive Bento Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Bento Card 1: Repository Health Telemetry with Illuminated Wave (5 cols) */}
          <div className="lg:col-span-5 gridster-panel p-6 bg-white border border-slate-200/90 shadow-md rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0038FF] pulse-blue" />
                  <span className="text-xs font-mono text-slate-800 uppercase tracking-wider font-extrabold">
                    Telemetry Waveform
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#0038FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-black">
                  SPECTRUM LIVE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-2xl font-black text-slate-950 font-mono num-tabular">98.5%</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 font-bold">Build Success</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-950 font-mono num-tabular">2.1 Hr</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 font-bold">Avg PR Review</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#0038FF] font-mono num-tabular">
                    {totalFeatures || 15}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 font-bold">Features</div>
                </div>
              </div>
            </div>

            {/* Glowing SVG Wave Line Chart (Blue to Lime to Violet on light container) */}
            <div className="relative pt-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              <svg viewBox="0 0 400 90" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="lightWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0038FF" />
                    <stop offset="50%" stopColor="#84CC16" />
                    <stop offset="100%" stopColor="#7020DD" />
                  </linearGradient>
                  <linearGradient id="lightWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0038FF" stopOpacity="0.18" />
                    <stop offset="50%" stopColor="#84CC16" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#7020DD" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Wave Fill Area */}
                <path
                  d="M 0,70 Q 50,25 100,55 T 200,30 T 300,45 T 400,15 L 400,90 L 0,90 Z"
                  fill="url(#lightWaveFill)"
                />
                {/* Wave Stroke Line */}
                <path
                  d="M 0,70 Q 50,25 100,55 T 200,30 T 300,45 T 400,15"
                  fill="none"
                  stroke="url(#lightWaveStroke)"
                  strokeWidth="3"
                />
              </svg>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 font-bold">
                <span>T-30d</span>
                <span className="text-[#0038FF] font-black">Active Gridster Cycle</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Dual Circular Gauges (4 cols) */}
          <div className="lg:col-span-4 gridster-panel p-6 bg-white border border-slate-200/90 shadow-md rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-purple-700 uppercase tracking-wider flex items-center gap-1.5 font-black">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                Velocity Physics
              </span>
              <span className="w-2 h-2 rounded-full bg-[#7020DD] pulse-violet" />
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
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0038FF"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - (avgProgress || 65) / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 shadow-sm"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-950 font-mono num-tabular">
                      {avgProgress || 42}%
                    </span>
                    <span className="text-[9px] font-mono text-[#0038FF] font-black">Velocity</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 mt-2 font-mono">Sprint Velocity</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">Weighted (4x/3x/2x/1x)</span>
              </div>

              {/* Code Coverage Gauge */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="text-slate-100"
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
                      className="transition-all duration-1000 shadow-sm"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-950 font-mono num-tabular">89%</span>
                    <span className="text-[9px] font-mono text-purple-700 font-black">Coverage</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 mt-2 font-mono">Test Coverage</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">Unit &amp; AST</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between font-bold">
              <span>Completed: {completedFeatures}/{totalFeatures}</span>
              <span className="text-[#0038FF]">{activeProjects.length} Active Repos</span>
            </div>
          </div>

          {/* Bento Card 3: Cascading AI Models Status & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 gridster-panel p-6 bg-white border border-slate-200/90 shadow-md rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-black">
                  <Cpu className="w-3.5 h-3.5 text-[#0038FF]" />
                  AI Cascade Matrix
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0038FF] font-black">
                  ONLINE
                </span>
              </div>

              {/* Engine Matrix list */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-900 font-mono text-[11px] font-bold">Gemini 2.5 Pro</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#0038FF] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0038FF] pulse-blue" />
                    Primary
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-900 font-mono text-[11px] font-bold">Claude 3.5 Sonnet</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-purple-700 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7020DD] pulse-violet" />
                    Fallback 1
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-mono text-[11px] font-medium">NVIDIA NIM</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 font-bold">
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
                  className="w-full btn-lime !py-2.5 !px-3 !justify-between text-xs font-black shadow-md cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Triage ({needsReviewProjects.length})</span>
                  </span>
                  <span>&rarr;</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-blue-900 font-mono py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0038FF]" />
                  <span>All repositories synchronized</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Segmented Filter Pills (Reference Style) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-full shadow-xs overflow-x-auto max-w-full">
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
                  className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#C6FF20] text-black font-black shadow-sm' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/80 font-bold'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] font-mono ml-1.5 px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/15 text-black font-black' : 'bg-slate-200 text-slate-600 font-bold'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-slate-500 font-bold">
            Showing <span className="text-[#0038FF] font-black">{filteredProjects.length}</span> of {projects.length} repos
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="py-28 text-center text-xs text-slate-500 font-mono animate-pulse">
            Hydrating repository intelligence matrix...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="gridster-panel p-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <GitBranch className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-base font-black text-slate-900">No repositories found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-mono">
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
