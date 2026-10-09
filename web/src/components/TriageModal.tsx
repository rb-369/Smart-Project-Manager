'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProjectSummary, ProjectType, FeaturePriority } from '@/types';
import { Cpu, Check, X, Loader2, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#111218] border border-[#252838] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1d28] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#181a24] border border-[#282a3b] text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#f4f4f7]">Repository Triage</h2>
              <p className="text-xs text-[#7c8091]">
                Classify architecture & roadmap for <span className="text-[#f4f4f7] font-mono">{project.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#64687a] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
            <p className="text-xs font-mono text-[#c5c8d6]">Analyzing README & repository metadata...</p>
            <p className="text-[11px] text-[#6b6f80] mt-1 font-mono">Cascading: OpenRouter &rarr; Gemini &rarr; NVIDIA</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {error}
              </div>
            )}

            {providerUsed && (
              <div className="text-[11px] font-mono text-[#6e7285] flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#14151f] border border-[#1e202c]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Inference provider: <strong className="text-[#a0a4b5] uppercase">{providerUsed}</strong>
              </div>
            )}

            {/* Project Type Picker */}
            <div>
              <label className="block text-xs font-medium text-[#8b8f9e] mb-1.5">Project Classification</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['COLLEGE', 'RESUME', 'PRODUCTION'] as ProjectType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProjectType(t)}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition cursor-pointer font-mono ${
                      projectType === t
                        ? 'bg-[#181a26] border-blue-500/50 text-[#f4f4f7] font-semibold shadow-sm'
                        : 'bg-[#0f1016] border-[#222433] text-[#6e7285] hover:text-[#c4c7d6]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Input */}
            <div>
              <label className="block text-xs font-medium text-[#8b8f9e] mb-1.5">Target Objective</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="What is the deliverable or goal for this project?"
                className="w-full bg-[#0d0e14] border border-[#222433] rounded-md px-3 py-1.5 text-xs text-[#f4f4f7] placeholder-[#555866] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Proposed Initial Features */}
            <div>
              <label className="block text-xs font-medium text-[#8b8f9e] mb-1.5">
                Synthesized Initial Features ({features.length})
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-md bg-[#13141e] border border-[#1f212e] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-[#f4f4f7]">{f.title}</p>
                      {f.description && <p className="text-[11px] text-[#7c8091]">{f.description}</p>}
                    </div>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#181a26] border border-[#252838] text-[#8b8f9e] shrink-0">
                      {f.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1c1d28]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#8b8f9e] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm"
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
