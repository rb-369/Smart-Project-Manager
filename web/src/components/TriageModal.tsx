'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType, FeaturePriority } from '@/types';
import { Check, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TriageModalProps {
  project: ProjectSummary;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

const CLASSIFICATIONS: { id: ProjectType; label: string }[] = [
  { id: 'COLLEGE', label: 'College' },
  { id: 'RESUME', label: 'Resume' },
  { id: 'PRODUCTION', label: 'Production' },
];

export function TriageModal({ project, isOpen, onClose, onConfirmed }: TriageModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectType, setProjectType] = useState<ProjectType>(project.project_type);
  const [goal, setGoal] = useState<string>(project.goal || '');
  const [features, setFeatures] = useState<
    Array<{ title: string; priority: FeaturePriority; description?: string }>
  >([]);
  const [providerUsed, setProviderUsed] = useState<string>('');

  const fetchAITriage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.post(`/ai/triage/${project.id}`);
      setProjectType(res.suggested_project_type || 'RESUME');
      setGoal(res.suggested_goal || '');
      setFeatures(res.suggested_initial_features || []);
      setProviderUsed(res.provider_used || 'ai');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI triage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAITriage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/projects/${project.id}/triage`, {
        project_type: projectType,
        goal: goal.trim() || undefined,
        initial_features: features.map((f) => ({
          title: f.title,
          priority: f.priority,
          description: f.description,
        })),
      });
      onConfirmed();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply triage settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Autonomous Repository Triage"
      description={
        <>
          Synthesizing architecture &amp; backlog for{' '}
          <span className="font-mono font-bold text-brand-blue-600">{project.name}</span>
        </>
      }
      icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={submitting || loading}
            iconLeft={
              submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )
            }
          >
            {submitting ? 'Applying…' : 'Confirm & import features'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <Loader2 className="mb-1 h-7 w-7 animate-spin text-brand-blue-500" aria-hidden="true" />
          <p className="font-mono text-[0.75rem] font-bold text-ink-800">
            Analyzing README &amp; codebase context…
          </p>
          <p className="font-mono text-[0.6875rem] text-ink-500">
            Cascading: OpenRouter → Gemini → NVIDIA NIM
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[0.75rem] text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              {error}
            </div>
          )}

          {providerUsed && (
            <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 font-mono text-[0.6875rem] text-ink-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>Inference engine:</span>
              <strong className="font-bold uppercase text-brand-blue-600">{providerUsed}</strong>
            </div>
          )}

          <div>
            <span className="mb-2 block text-[0.75rem] font-bold text-ink-800">
              Project classification
            </span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Project classification">
              {CLASSIFICATIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={projectType === t.id}
                  onClick={() => setProjectType(t.id)}
                  className={`cursor-pointer rounded-full border px-3 py-2 font-mono text-[0.6875rem] font-bold transition-colors ${
                    projectType === t.id
                      ? 'border-brand-lime-400 bg-brand-lime-400 text-black'
                      : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-brand-blue-500/30 hover:text-ink-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="triage-goal"
              className="mb-1.5 block text-[0.75rem] font-bold text-ink-800"
            >
              Target deliverable goal
            </label>
            <textarea
              id="triage-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="What is the objective or target milestone?"
              className="w-full resize-none rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 text-[0.8125rem] text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-[0.75rem] font-bold text-ink-800">
              Synthesized initial features ({features.length})
            </span>
            {features.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 px-3.5 py-6 text-center font-mono text-[0.75rem] text-ink-400">
                No features were proposed for this repository.
              </p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[0.75rem] font-bold text-ink-900">{f.title}</p>
                      {f.description && (
                        <p className="text-[0.6875rem] leading-relaxed text-ink-500">
                          {f.description}
                        </p>
                      )}
                    </div>
                    <Badge tone="blue" size="xs" className="shrink-0">
                      {f.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TriageModal;
