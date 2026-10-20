'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ParsedConcept, ProjectType, FutureProjectPriority } from '@/types';
import { CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

interface ConceptImportModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Called after a successful save so the caller can surface a toast. */
  onNotify?: (message: string) => void;
}

/**
 * Smart extraction of a raw chat note into a structured concept. This
 * existed as two near-identical ~150 line copies in the dashboard and the
 * ideas page; it is now a single modal on the shared primitive.
 */
export function ConceptImportModal({
  open,
  onClose,
  onSaved,
  onNotify,
}: ConceptImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedConcept | null>(null);

  const reset = () => {
    setRawText('');
    setParsedPreview(null);
    setExtractError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleExtractConcept = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res: any = await api.post('/future-projects/parse-concept', {
        raw_text: rawText.trim(),
      });
      setParsedPreview(res);
    } catch (err: any) {
      setExtractError(err?.message || 'AI extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveImportedConcept = async () => {
    if (!parsedPreview || !parsedPreview.title.trim()) return;
    setIsSaving(true);
    try {
      await api.post('/future-projects', {
        title: parsedPreview.title.trim(),
        elevator_pitch: parsedPreview.elevator_pitch?.trim() || undefined,
        target_tech_stack: parsedPreview.target_tech_stack?.trim() || undefined,
        project_type: parsedPreview.project_type,
        priority: parsedPreview.priority,
        notes: parsedPreview.notes?.trim() || undefined,
        raw_message: parsedPreview.raw_message || rawText.trim() || undefined,
      });
      onNotify?.(`Concept "${parsedPreview.title.trim()}" added to the backlog.`);
      handleClose();
      onSaved();
    } catch (err: any) {
      setExtractError(err?.message || 'Failed to save the imported concept.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import a concept"
      description="Paste a WhatsApp message or voice-note transcript. DevCommand structures it into a prioritized backlog item."
      icon={<Zap className="h-4 w-4" aria-hidden="true" />}
      size="lg"
      footer={
        parsedPreview ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParsedPreview(null)}
              iconLeft={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Paste new text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveImportedConcept}
              loading={isSaving}
              iconLeft={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Save to backlog
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExtractConcept}
              disabled={isExtracting || !rawText.trim()}
              loading={isExtracting}
              iconLeft={!isExtracting ? <Zap className="h-3.5 w-3.5" aria-hidden="true" /> : undefined}
            >
              {isExtracting ? 'Extracting…' : 'Smart extract'}
            </Button>
          </>
        )
      }
    >
      {extractError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 font-mono text-[0.75rem] text-rose-700"
        >
          {extractError}
        </div>
      )}

      {!parsedPreview ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="concept-raw-text"
              className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
            >
              Paste WhatsApp text or voice transcript
            </label>
            <textarea
              id="concept-raw-text"
              rows={6}
              autoFocus
              placeholder="e.g. bro what if we build a bot that automatically tweets git commits using python and fastapi, top priority asap. We could add discord alerts too."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full resize-none rounded-2xl border border-brand-blue-500/15 bg-brand-blue-50/60 p-3.5 font-mono text-[0.8125rem] leading-relaxed text-ink-900 placeholder:text-ink-400 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
            />
            <p className="mt-1.5 text-[0.6875rem] text-ink-500">
              Slang, typos and bullet points are all supported.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-brand-blue-500/15 bg-brand-blue-50/70 p-3.5 text-[0.75rem] text-brand-blue-800">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue-600" aria-hidden="true" />
            <p className="text-[0.6875rem] leading-relaxed">
              <strong>Smart extraction:</strong> DevCommand reads your note, infers a title, a
              crisp pitch, a modern stack and a priority — no repository required.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[0.75rem] text-emerald-800">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Concept extracted — review before saving</span>
            </div>
            {parsedPreview.provider_used && (
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[0.625rem] font-bold text-emerald-900">
                {parsedPreview.provider_used}
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            <TextField
              label="Concept title"
              value={parsedPreview.title}
              onChange={(e) => setParsedPreview({ ...parsedPreview, title: e.target.value })}
            />

            <div>
              <label
                htmlFor="concept-pitch"
                className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
              >
                Elevator pitch
              </label>
              <textarea
                id="concept-pitch"
                rows={2}
                value={parsedPreview.elevator_pitch}
                onChange={(e) =>
                  setParsedPreview({ ...parsedPreview, elevator_pitch: e.target.value })
                }
                className="w-full resize-none rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 text-[0.8125rem] text-ink-900 transition-colors focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              />
            </div>

            <TextField
              label="Target tech stack"
              value={parsedPreview.target_tech_stack}
              onChange={(e) =>
                setParsedPreview({ ...parsedPreview, target_tech_stack: e.target.value })
              }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="concept-type"
                  className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
                >
                  Category
                </label>
                <select
                  id="concept-type"
                  value={parsedPreview.project_type}
                  onChange={(e) =>
                    setParsedPreview({
                      ...parsedPreview,
                      project_type: e.target.value as ProjectType,
                    })
                  }
                  className="w-full cursor-pointer rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 font-mono text-[0.75rem] font-bold text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
                >
                  <option value="RESUME">Resume portfolio</option>
                  <option value="COLLEGE">Academic / college</option>
                  <option value="PRODUCTION">Production SaaS</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="concept-priority"
                  className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
                >
                  Priority track
                </label>
                <select
                  id="concept-priority"
                  value={parsedPreview.priority}
                  onChange={(e) =>
                    setParsedPreview({
                      ...parsedPreview,
                      priority: e.target.value as FutureProjectPriority,
                    })
                  }
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
                htmlFor="concept-notes"
                className="mb-1.5 block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-600"
              >
                Notes &amp; starter MVP features
              </label>
              <textarea
                id="concept-notes"
                rows={3}
                value={parsedPreview.notes || ''}
                onChange={(e) => setParsedPreview({ ...parsedPreview, notes: e.target.value })}
                className="w-full resize-none rounded-xl border border-brand-blue-500/15 bg-brand-blue-50/60 px-3.5 py-2.5 font-mono text-[0.75rem] text-ink-900 focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500"
              />
            </div>

            {parsedPreview.raw_message && (
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-2.5">
                <span className="mb-1 block font-mono text-[0.625rem] font-bold text-ink-500">
                  Original message (saved)
                </span>
                <p className="max-h-20 overflow-y-auto rounded-lg border border-ink-200 bg-white p-2 font-mono text-[0.6875rem] italic text-ink-700">
                  &ldquo;{parsedPreview.raw_message}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ConceptImportModal;
