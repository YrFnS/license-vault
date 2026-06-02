'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CheckSquare, Square } from 'lucide-react';
import { US_STATES, SUBMISSION_TYPES, PRIORITIES } from './constants';
import type { Template } from './types';

interface SubmissionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: number;
  onStepChange: (s: number) => void;
  data: any;
  onDataChange: (data: any) => void;
  templates: Template[];
  selectedTemplate: Template | null;
  formFields: { name: string; label: string; value: string; required: boolean }[];
  onFormFieldsChange: (fields: { name: string; label: string; value: string; required: boolean }[]) => void;
  onFetchTemplates: (state: string, type: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  t: (key: string) => string;
  tc: (key: string) => string;
  getSubmissionTypeLabel: (type: string) => string;
  getPriorityLabel: (p: string) => string;
}

export function SubmissionWizard({
  open, onOpenChange, step, onStepChange, data, onDataChange,
  selectedTemplate, formFields, onFormFieldsChange,
  onFetchTemplates, onSubmit, onReset, t, tc,
  getSubmissionTypeLabel, getPriorityLabel,
}: SubmissionWizardProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onReset();
    onOpenChange(isOpen);
  };

  const handleNext = () => {
    if (step < 5) {
      if (step === 1 && data.state) {
        onFetchTemplates(data.state, data.submissionType);
      }
      onStepChange(step + 1);
    } else {
      onSubmit();
    }
  };

  const canProceed = !(step === 1 && (!data.state || !data.submissionType));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('newSubmission')}</DialogTitle>
          <DialogDescription>
            Step {step} of 5 — {step === 1 ? t('step1') : step === 2 ? t('step2') : step === 3 ? t('step3') : step === 4 ? t('step4') : t('step5')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5 px-1">
          {[1,2,3,4,5].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                s <= step ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-4">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <Label>{t('submissionType')} *</Label>
                  <Select value={data.submissionType} onValueChange={(v) => onDataChange({ ...data, submissionType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBMISSION_TYPES.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('state')} *</Label>
                  <Select value={data.state} onValueChange={(v) => onDataChange({ ...data, state: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectState')} /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('priority')}</Label>
                  <Select value={data.priority} onValueChange={(v) => onDataChange({ ...data, priority: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                {selectedTemplate ? (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">{selectedTemplate.boardName}</p>
                      {selectedTemplate.boardEmail && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="inline-block size-3">📧</span>{selectedTemplate.boardEmail}
                        </p>
                      )}
                      {selectedTemplate.boardPortalUrl && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="inline-block size-3">🌐</span>{selectedTemplate.boardPortalUrl}
                        </p>
                      )}
                    </div>
                    <Separator />
                    <p className="text-sm font-semibold">{t('formFields')}</p>
                    {formFields.map((field, idx) => (
                      <div key={field.name}>
                        <Label className="text-xs">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          className="mt-1"
                          placeholder={field.label}
                          value={field.value}
                          onChange={(e) => {
                            const updated = [...formFields];
                            updated[idx] = { ...updated[idx], value: e.target.value };
                            onFormFieldsChange(updated);
                          }}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('boardName')} *</Label>
                      <Input className="mt-1" value={data.boardName} onChange={(e) => onDataChange({ ...data, boardName: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('boardEmail')}</Label>
                      <Input className="mt-1" value={data.boardEmail} onChange={(e) => onDataChange({ ...data, boardEmail: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('boardPortal')}</Label>
                      <Input className="mt-1" value={data.boardPortalUrl} onChange={(e) => onDataChange({ ...data, boardPortalUrl: e.target.value })} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <p className="text-sm font-semibold">{t('requiredDocs')}</p>
                {(() => {
                  const checklist = data.checklistData ? JSON.parse(data.checklistData) : [];
                  if (checklist.length === 0) {
                    return <p className="text-sm text-muted-foreground">No required documents for this submission type.</p>;
                  }
                  return checklist.map((item: { item: string; completed: boolean }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        const updated = [...checklist];
                        updated[idx] = { ...updated[idx], completed: !updated[idx].completed };
                        onDataChange({ ...data, checklistData: JSON.stringify(updated) });
                      }}
                    >
                      {item.completed ? (
                        <CheckSquare className="size-4 text-emerald-500" />
                      ) : (
                        <Square className="size-4 text-muted-foreground" />
                      )}
                      <span className={cn('text-sm', item.completed && 'line-through text-muted-foreground')}>{item.item}</span>
                    </div>
                  ));
                })()}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <Label>{t('coverLetter')}</Label>
                  <Textarea
                    className="mt-1 min-h-32"
                    placeholder="Write a cover letter for your submission..."
                    value={data.coverLetter}
                    onChange={(e) => onDataChange({ ...data, coverLetter: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{tc('notes')}</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Additional notes..."
                    value={data.notes}
                    onChange={(e) => onDataChange({ ...data, notes: e.target.value })}
                  />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-semibold mb-3">{t('reviewSubmit')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{t('submissionType')}:</span><p className="font-medium">{getSubmissionTypeLabel(data.submissionType)}</p></div>
                    <div><span className="text-muted-foreground">{t('state')}:</span><p className="font-medium">{data.state}</p></div>
                    <div><span className="text-muted-foreground">{t('boardName')}:</span><p className="font-medium">{data.boardName}</p></div>
                    <div><span className="text-muted-foreground">{t('priority')}:</span><p className="font-medium">{getPriorityLabel(data.priority)}</p></div>
                    <div><span className="text-muted-foreground">{t('filingFee')}:</span><p className="font-medium">${data.filingFee}</p></div>
                    <div><span className="text-muted-foreground">{t('estimatedDays')}:</span><p className="font-medium">{data.estimatedDays} days</p></div>
                  </div>
                </div>
                {formFields.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{t('formFields')}</p>
                    {formFields.map((f) => (
                      <div key={f.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{f.label}:</span>
                        <span className="font-medium">{f.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.coverLetter && (
                  <div>
                    <p className="text-sm font-semibold">{t('coverLetter')}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{data.coverLetter}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => { if (step === 1) { onOpenChange(false); onReset(); } else onStepChange(step - 1); }}>
            {step === 1 ? tc('cancel') : tc('back')}
          </Button>
          {step === 1 && data.state && data.submissionType && (
            <Button variant="ghost" size="sm" onClick={() => onFetchTemplates(data.state, data.submissionType)} className="text-emerald-600">
              <Sparkles className="size-3.5 me-1" /> Auto-fill from template
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {step === 5 ? tc('submit') : tc('next')}
            {step < 5 && <ChevronRight className="size-4 ms-1" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
