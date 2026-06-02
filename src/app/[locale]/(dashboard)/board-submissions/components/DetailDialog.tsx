'use client';

import { Mail, Globe, ExternalLink, Building2, FileText, ClipboardCheck, History, MessageSquare, CheckSquare, Square, Send, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BoardSubmission } from './types';
import { getStatusColor, getPriorityColor, formatDate, getSubmissionTypeLabel, getPriorityLabel } from './helpers';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: BoardSubmission | null;
  onSubmitToBoard: (sub: BoardSubmission) => void;
  onDelete: (sub: BoardSubmission) => void;
  onMarkStatus: (sub: BoardSubmission, status: string) => void;
  onToggleChecklist: (sub: BoardSubmission, index: number) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
  getStatusLabel: (s: string) => string;
}

export function DetailDialog({
  open, onOpenChange, submission,
  onSubmitToBoard, onDelete, onMarkStatus, onToggleChecklist,
  t, tc, getStatusLabel,
}: DetailDialogProps) {
  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{submission.boardName}</DialogTitle>
            <Badge className={cn('text-xs', getStatusColor(submission.status))}>
              {getStatusLabel(submission.status)}
            </Badge>
            <Badge className={cn('text-xs', getPriorityColor(submission.priority))}>
              {getPriorityLabel(submission.priority)}
            </Badge>
          </div>
          <DialogDescription>
            {getSubmissionTypeLabel(submission.submissionType)} — {submission.state}
            {submission.trackingNumber && ` • ${submission.trackingNumber}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-5">
            {/* Key info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{t('filingFee')}</p>
                <p className="font-semibold">${submission.filingFee}</p>
                <p className="text-xs text-muted-foreground">{submission.feePaid ? '✓ Paid' : 'Unpaid'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{t('estimatedDays')}</p>
                <p className="font-semibold">{submission.estimatedDays} days</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-semibold text-sm">{formatDate(submission.submittedAt)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-semibold text-sm">{formatDate(submission.createdAt)}</p>
              </div>
            </div>

            {/* Board info */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="size-4" />Board Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {submission.boardName}</p>
                {submission.boardEmail && <p className="flex items-center gap-1"><Mail className="size-3 text-muted-foreground" />{submission.boardEmail}</p>}
                {submission.boardPortalUrl && (
                  <p className="flex items-center gap-1">
                    <Globe className="size-3 text-muted-foreground" />
                    <a href={submission.boardPortalUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                      {t('boardPortal')} <ExternalLink className="size-3" />
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            {submission.applicationForm && (() => {
              const form = JSON.parse(submission.applicationForm);
              return form.fields?.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="size-4" />{t('formFields')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {form.fields.map((f: any) => (
                        <div key={f.name}>
                          <p className="text-xs text-muted-foreground">{f.label}{f.required && ' *'}</p>
                          <p className="font-medium">{f.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Checklist */}
            {submission.checklistData && (() => {
              const checklist = JSON.parse(submission.checklistData);
              return checklist.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="size-4" />{t('checklist')}</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {checklist.map((item: { item: string; completed: boolean }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onToggleChecklist(submission, idx)}
                      >
                        {item.completed ? <CheckSquare className="size-4 text-emerald-500" /> : <Square className="size-4 text-muted-foreground" />}
                        <span className={cn('text-sm', item.completed && 'line-through text-muted-foreground')}>{item.item}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      {checklist.filter((c: any) => c.completed).length}/{checklist.length} completed
                    </p>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Cover Letter */}
            {submission.coverLetter && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="size-4" />{t('coverLetter')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{submission.coverLetter}</p></CardContent>
              </Card>
            )}

            {/* Board Response */}
            {submission.boardResponse && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="size-4" />{t('boardResponse')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{submission.boardResponse}</p></CardContent>
              </Card>
            )}

            {/* Audit Trail */}
            {submission.auditTrail && (() => {
              const trail = JSON.parse(submission.auditTrail);
              return trail.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="size-4" />{t('auditTrail')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trail.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div>
                            <p className="font-medium capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                            {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Notes */}
            {submission.notes && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{tc('notes')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{submission.notes}</p></CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 pt-2 border-t flex-wrap">
          {(submission.status === 'draft' || submission.status === 'ready') && (
            <Button
              onClick={() => onSubmitToBoard(submission)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Send className="size-4 me-2" />{t('submitToBoard')}
            </Button>
          )}
          {submission.status === 'submitted' && (
            <Button variant="outline" onClick={() => onMarkStatus(submission, 'under_review')}>
              <Clock className="size-4 me-2" />Mark Under Review
            </Button>
          )}
          {(submission.status === 'submitted' || submission.status === 'under_review') && (
            <>
              <Button variant="outline" className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => onMarkStatus(submission, 'approved')}>
                <CheckCircle2 className="size-4 me-2" />{t('markApproved')}
              </Button>
              <Button variant="outline" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onMarkStatus(submission, 'rejected')}>
                <XCircle className="size-4 me-2" />{t('markRejected')}
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Button variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(submission)}>
            <Trash2 className="size-4 me-2" />{t('deleteSubmission')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
