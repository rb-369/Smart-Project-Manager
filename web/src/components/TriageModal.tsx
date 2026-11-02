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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DFFF4F] border border-black text-black flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-black uppercase tracking-tight">Repository AI Triage</h2>
              <p className="text-xs text-neutral-600 font-mono">
                Synthesizing architecture & backlog for <span className="text-[#0047FF] font-bold">{project.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-[#FAF7EE] border border-neutral-300 text-black hover:bg-black hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0047FF] mb-3" />
            <p className="text-xs font-mono font-black text-black uppercase tracking-wider">Analyzing README & codebase context...</p>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono">Cascading: OpenRouter &rarr; Gemini &rarr; NVIDIA NIM</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border-2 border-black text-xs text-rose-800 flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {error}
              </div>
            )}

            {providerUsed && (
              <div className="text-[11px] font-mono text-black flex items-center gap-2 px-3 py-1.5 bg-[#FAF7EE] border-2 border-black shadow-[2px_2px_0px_#000000]">
                <span className="w-2 h-2 rounded-full bg-[#DFFF4F] border border-black" />
                <span className="font-bold">INFERENCE ENGINE:</span>
                <strong className="text-[#0047FF] uppercase font-black">{providerUsed}</strong>
              </div>
            )}

            {/* Project Type Picker */}
            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-2">Project Classification</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['COLLEGE', 'RESUME', 'PRODUCTION'] as ProjectType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProjectType(t)}
                    className={`py-2 px-3 text-xs font-mono font-black border text-center transition cursor-pointer ${
                      projectType === t
                        ? 'bg-[#DFFF4F] text-black border-black shadow-sm'
                        : 'bg-[#FAF7EE] text-neutral-700 hover:bg-white border-neutral-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Input */}
            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1.5">Target Deliverable Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="What is the objective or target milestone?"
                className="w-full bg-[#FAF7EE] border border-neutral-300 focus:border-[#0047FF] focus:bg-white p-3 text-xs text-black placeholder-neutral-400 focus:outline-none transition resize-none font-mono"
              />
            </div>

            {/* Proposed Initial Features */}
            <div>
              <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1.5">
                Synthesized Initial Features ({features.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#FAF7EE] border border-neutral-300 flex items-start justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-black">{f.title}</p>
                      {f.description && <p className="text-[11px] text-neutral-600 leading-relaxed font-mono">{f.description}</p>}
                    </div>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-black text-[#DFFF4F] border border-black shrink-0">
                      {f.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 text-xs font-mono font-black bg-[#FAF7EE] border border-neutral-300 text-black hover:bg-neutral-200 transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="py-2 px-5 text-xs font-mono font-black bg-[#DFFF4F] text-black border border-black flex items-center gap-1.5 shadow-sm hover:bg-black hover:text-[#DFFF4F] transition cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>CONFIRM &amp; IMPORT FEATURES</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
