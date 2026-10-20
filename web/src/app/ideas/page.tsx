'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FutureProject, FutureProjectPriority, ProjectType, SuggestedProject } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer, PageHeader } from '@/components/AppShell';
import { IdeaCard } from '@/components/IdeaCard';
import { ConceptImportModal } from '@/components/ConceptImportModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { Plus, Cpu, Loader2, Lightbulb, MessageSquareText, Check } from 'lucide-react';

const PRIORITY_TRACKS: {
  id: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;
  dot: string;
}[] = [
  {
    id: 'P0',
    title: 'Next immediate build',
    description: 'Ship these first',
    dot: 'bg-rose-500',
  },
  {
    id: 'P1',
    title: 'Upcoming priority',
    description: 'Queue behind P0',
    dot: 'bg-amber-500',
  },
  {
    id: 'P2',
    title: 'Research backlog',
    description: 'Explore when there is room',
    dot: 'bg-brand-blue-500',
  },
];

/**
 * Offline ids need to be unique but stable across renders. Generating them
 * in a module-scope helper keeps the component body pure.
 */
let offlineCounter = 0;
function nextOfflineId(): string {
  offlineCounter += 1;
  return `offline-${Date.now()}-${offlineCounter}`;
}

export default function IdeasPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, sessionError } = useAuth();
  const [ideas, setIdeas] = useState<FutureProject[]>([]);
  const [, setLoading] = useState(true);

  // New manual idea form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [techStack, setTechStack] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('RESUME');
  const [priority, setPriority] = useState<FutureProjectPriority>('P1');
  const [notes, setNotes] = useState('');

  // Smart WhatsApp / Raw Note Concept Import state
  const [showImportModal, setShowImportModal] = useState(false);

  // AI Discover Projects modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedProject[]>([]);
  const [backendOffline, setBackendOffline] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !sessionError) {
      router.push('/login?next=/ideas');
    }
  }, [authLoading, isAuthenticated, sessionError, router]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const fetchIdeas = async () => {
    if (!api.isAuthenticated()) return;
    try {
      setLoading(true);
      setBackendOffline(false);
      const res: any = await api.get('/future-projects');
      setIdeas(res || []);
    } catch (err: any) {
      console.warn('Unable to load ideas from backend:', err?.message || err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdeas();
    }
  }, [isAuthenticated, user]);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await api.post<FutureProject>('/future-projects', {
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority: priority,
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      setShowAddModal(false);
      showNotification(`"${title.trim()}" added to the backlog.`);
      if (created && created.id) {
        setIdeas((prev) => [created, ...prev]);
      } else {
        fetchIdeas();
      }
    } catch (err: any) {
      console.warn('Backend unavailable, saving idea in local state:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: nextOfflineId(),
        title: title.trim(),
        elevator_pitch: elevatorPitch.trim() || undefined,
        target_tech_stack: techStack.trim() || undefined,
        project_type: projectType,
        priority: priority,
        notes: notes.trim() || undefined,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setTitle('');
      setElevatorPitch('');
      setTechStack('');
      setNotes('');
      setShowAddModal(false);
      showNotification(`Saved "${title.trim()}" locally.`);
    }
  };

  const handlePromote = async (id: string, ideaTitle: string) => {
    try {
      await api.post(`/future-projects/${id}/promote`);
      showNotification(`"${ideaTitle}" promoted to an active repository.`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to promote idea:', err?.message || err);
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'PROMOTED' } : i)),
      );
      showNotification(`"${ideaTitle}" marked as promoted.`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/future-projects/${id}`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to delete idea:', err?.message || err);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleFetchAiProjects = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res: any = await api.post('/ai/suggest-projects');
      setAiSuggestions(res.projects || []);
    } catch (err: any) {
      console.warn('AI suggestions backend unavailable:', err?.message || err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiProject = async (p: SuggestedProject) => {
    try {
      await api.post('/future-projects', {
        title: p.title,
        elevator_pitch: p.elevator_pitch,
        target_tech_stack: p.target_tech_stack,
        project_type: p.project_type,
        priority: p.priority,
      });
      setAiSuggestions((prev) => prev.filter((item) => item.title !== p.title));
      showNotification(`Added "${p.title}" to the backlog.`);
      fetchIdeas();
    } catch (err: any) {
      console.warn('Unable to add suggested project:', err?.message || err);
      const fallbackIdea: FutureProject = {
        id: nextOfflineId(),
        title: p.title,
        elevator_pitch: p.elevator_pitch,
        target_tech_stack: p.target_tech_stack,
        project_type: p.project_type,
        priority: p.priority,
        status: 'IDEA',
        created_at: new Date().toISOString(),
      };
      setIdeas((prev) => [fallbackIdea, ...prev]);
      setAiSuggestions((prev) => prev.filter((item) => item.title !== p.title));
    }
  };

  const totalIdeas = ideas.filter((i) => i.status !== 'PROMOTED').length;

  return (
    <AppShell>
      <Navbar />

      {successToast && (
        <div className="fixed right-4 top-20 z-[60] sm:right-6">
          <Toast message={successToast} onDismiss={() => setSuccessToast(null)} />
        </div>
      )}

      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-lime-300">
              Future projects backlog
            </span>
          }
          title={
            <span className="flex flex-wrap items-center gap-3">
              Concept Radar
              {totalIdeas > 0 && (
                <Badge tone="lime" size="sm">
                  {totalIdeas} queued
                </Badge>
              )}
            </span>
          }
          description="Incubate and prioritise software concepts whose repositories do not exist yet. Paste a raw note and DevCommand structures it into a ranked backlog item."
          actions={
            <>
              <Button
                size="sm"
                onClick={() => setShowImportModal(true)}
                iconLeft={<MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Import a concept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchAiProjects}
                iconLeft={<Cpu className="h-3.5 w-3.5" aria-hidden="true" />}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                AI suggestions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                iconLeft={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Add manually
              </Button>
            </>
          }
        />

        {backendOffline && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50/95 px-4 py-3 font-mono text-[0.75rem] text-amber-900"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              The workspace API is unreachable, so this backlog may be out of date. Your
              concepts are still safe — reconnect to sync.
            </span>
          </div>
        )}

        {/* Priority tracks */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRIORITY_TRACKS.map((track) => {
            const columnIdeas = ideas.filter(
              (i) => i.priority === track.id && i.status !== 'PROMOTED',
            );

            return (
              <section key={track.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/12 bg-ink-950/25 px-3.5 py-2.5 backdrop-blur-md">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${track.dot}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[0.6875rem] font-black text-white">
                          {track.id}
                        </span>
                        <span className="truncate font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-white/80">
                          {track.title}
                        </span>
                      </div>
                      <span className="font-mono text-[0.625rem] text-white/50">
                        {track.description}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[0.625rem] font-black text-white">
                    {columnIdeas.length}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {columnIdeas.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-8 text-center font-mono text-[0.6875rem] text-white/50 backdrop-blur-md">
                      Nothing in this track yet.
                    </div>
                  ) : (
                    columnIdeas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onPromote={handlePromote}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </PageContainer>

      {/* Smart Concept Import */}
      <ConceptImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSaved={fetchIdeas}
        onNotify={showNotification}
      />

      {/* Manual Add */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add a concept manually"
        description="Capture an idea without going through the extractor."
        icon={<Plus className="h-4 w-4" aria-hidden="true" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateIdea} iconLeft={<Check className="h-3.5 w-3.5" aria-hidden="true" />}>
              Create concept
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateIdea} className="space-y-3.5">
          <TextField
            label="Concept title"
            required
            placeholder="e.g. Distributed Task Orchestrator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label
              htmlFor="manual-pitch"
              className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
            >
              Elevator pitch
            </label>
            <textarea
              id="manual-pitch"
              rows={2}
              placeholder="Brief description of goals, mechanics, and value proposition"
              value={elevatorPitch}
              onChange={(e) => setElevatorPitch(e.target.value)}
              className="w-full resize-none rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 text-[0.8125rem] text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
            />
          </div>

          <TextField
            label="Target tech stack"
            placeholder="e.g. Go, gRPC, Redis, Docker"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="manual-type"
                className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
              >
                Category
              </label>
              <select
                id="manual-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full cursor-pointer rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 font-mono text-[0.75rem] font-bold text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              >
                <option value="RESUME">Resume portfolio</option>
                <option value="COLLEGE">Academic / college</option>
                <option value="PRODUCTION">Production SaaS</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="manual-priority"
                className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
              >
                Priority track
              </label>
              <select
                id="manual-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as FutureProjectPriority)}
                className="w-full cursor-pointer rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 font-mono text-[0.75rem] font-bold text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              >
                <option value="P0">P0 — next immediate</option>
                <option value="P1">P1 — upcoming</option>
                <option value="P2">P2 — research backlog</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="manual-notes"
              className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
            >
              Notes / MVP features
            </label>
            <textarea
              id="manual-notes"
              rows={2}
              placeholder="Bullet points or key technical milestones"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 font-mono text-[0.75rem] text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
            />
          </div>
        </form>
      </Modal>

      {/* AI Concept Engine */}
      <Modal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI concept engine"
        description="Suggestions generated from your existing repositories and velocity history."
        icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />}
        size="lg"
      >
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <Loader2 className="mb-1 h-7 w-7 animate-spin text-brand-blue-500" aria-hidden="true" />
            <p className="font-mono text-[0.75rem] text-ink-600">
              Synthesizing high-impact project concepts…
            </p>
          </div>
        ) : aiSuggestions.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />}
            title="No suggestions returned"
            description="The AI engine could not find a strong candidate right now. Try again after syncing more repositories."
          />
        ) : (
          <ul className="space-y-3">
            {aiSuggestions.map((p, idx) => (
              <li
                key={idx}
                className="flex items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3.5 transition-colors hover:border-brand-blue-500/30"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="blue" size="xs">
                      {p.project_type}
                    </Badge>
                    <PriorityBadge priority={p.priority as 'P0' | 'P1' | 'P2' | 'P3'} size="xs" />
                    <h3 className="truncate text-[0.8125rem] font-extrabold text-ink-900">
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-[0.75rem] leading-relaxed text-ink-600">{p.elevator_pitch}</p>
                  {p.target_tech_stack && (
                    <p className="font-mono text-[0.625rem] font-bold text-brand-violet-600">
                      {p.target_tech_stack}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddAiProject(p)}
                  iconLeft={<Plus className="h-3 w-3" aria-hidden="true" />}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </AppShell>
  );
}
