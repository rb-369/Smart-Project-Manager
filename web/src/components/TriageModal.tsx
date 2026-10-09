'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType, FeaturePriority } from '@/types';
import { Cpu, Check, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      fetchAITriage();
    }
  }, [isOpen]);

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

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/projects/${project.id}/confirm-triage`, {
        project_type: projectType,
        goal: goal,
        initial_features: features,
      });
      onConfirmed();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm project');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bento-card bg-[#0e101a] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Autonomous Repository Triage</h2>
              <p className="text-xs text-[#94a3b8]">
                Synthesizing architecture & backlog for <span className="text-white font-mono font-semibold">{project.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#64748b] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mb-3" />
            <p className="text-xs font-mono text-white">Analyzing README & codebase context...</p>
            <p className="text-[11px] text-[#94a3b8] mt-1 font-mono">Cascading: OpenRouter &rarr; Gemini &rarr; NVIDIA</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {error}
              </div>
            )}

            {providerUsed && (
              <div className="text-[11px] font-mono text-[#94a3b8] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-emerald" />
                <span>Inference Engine:</span>
                <strong className="text-indigo-300 uppercase">{providerUsed}</strong>
              </div>
            )}

            {/* Project Type Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-2">Project Classification</label>
              <div className="grid grid-cols-3 gap-3">
                {(['COLLEGE', 'RESUME', 'PRODUCTION'] as ProjectType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProjectType(t)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer font-mono ${
                      projectType === t
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/15 border-indigo-500/40 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#64748b] hover:text-[#cbd5e1]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Input */}
            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Target Deliverable Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="What is the objective or target milestone?"
                className="w-full bg-[#0c0e15] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none"
              />
            </div>

            {/* Proposed Initial Features */}
            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                Synthesized Initial Features ({features.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">{f.title}</p>
                      {f.description && <p className="text-[11px] text-[#94a3b8]">{f.description}</p>}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[#a5b4fc] shrink-0">
                      {f.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-[#94a3b8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="bento-btn-primary px-4 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm & Import Features
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
