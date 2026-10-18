'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType, FeaturePriority } from '@/types';
import { Check, X, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';

interface TriageModalProps {
  project: ProjectSummary;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export function TriageModal({ project, isOpen, onClose, onConfirmed }: TriageModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectType, setProjectType] = useState<ProjectType>(project.project_type);
  const [goal, setGoal] = useState<string>(project.goal || '');
  const [features, setFeatures] = useState<Array<{ title: string; priority: FeaturePriority; description?: string }>>([]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs p-4">
      <div className="gridster-panel bg-white border border-slate-300 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-[#0A5CFF] flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Autonomous Repository Triage</h2>
              <p className="text-xs text-slate-500">
                Synthesizing architecture & backlog for <span className="text-[#0A5CFF] font-mono font-bold">{project.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A5CFF] mb-3" />
            <p className="text-xs font-mono font-bold text-slate-800">Analyzing README & codebase context...</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Cascading: OpenRouter &rarr; Gemini &rarr; NVIDIA NIM</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {error}
              </div>
            )}

            {providerUsed && (
              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Inference Engine:</span>
                <strong className="text-[#0A5CFF] uppercase font-bold">{providerUsed}</strong>
              </div>
            )}

            {/* Project Type Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Project Classification</label>
              <div className="grid grid-cols-3 gap-3">
                {(['COLLEGE', 'RESUME', 'PRODUCTION'] as ProjectType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProjectType(t)}
                    className={`py-2 px-3 text-xs font-bold rounded-full border text-center transition cursor-pointer font-mono ${
                      projectType === t
                        ? 'bg-[#C6FF20] text-black border-[#C6FF20] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Target Deliverable Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="What is the objective or target milestone?"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A5CFF] focus:bg-white rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition resize-none"
              />
            </div>

            {/* Proposed Initial Features */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Synthesized Initial Features ({features.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{f.title}</p>
                      {f.description && <p className="text-[11px] text-slate-500 leading-relaxed">{f.description}</p>}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A5CFF] shrink-0">
                      {f.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline-white !py-1.5 !px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-lime !py-2 !px-5 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm & Import Features</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
