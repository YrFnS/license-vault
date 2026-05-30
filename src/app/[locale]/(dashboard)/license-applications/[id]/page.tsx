'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  Upload,
  Trash2,
  Download,
  Loader2,
  ExternalLink,
  Calendar,
  DollarSign,
  Building2,
  User,
  ClipboardList,
  StickyNote,
  Send,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChecklistProgress } from '@/components/checklists/ChecklistProgress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  category: string;
  required: boolean;
  uploadedAt: string;
}

interface Application {
  id: string;
  orgId: string;
  userId: string | null;
  licenseType: string;
  state: string;
  applicantName: string;
  businessName: string | null;
  applicationType: string;
  status: string;
  boardName: string | null;
  boardUrl: string | null;
  submittedDate: string | null;
  targetDate: string | null;
  estimatedCost: number;
  actualCost: number;
  notes: string | null;
  denialReason: string | null;
  checklistData: string | null;
  formData: string | null;
  createdAt: string;
  updatedAt: string;
  documents: AppDocument[];
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  required: boolean;
  category: string;
  order: number;
}

const statusSteps = ['draft', 'submitted', 'under_review', 'approved'];

const statusConfig: Record<string, { color: string; icon: any; bg: string; label: string }> = {
  draft: { color: 'text-slate-600 dark:text-slate-400', icon: FileText, bg: 'bg-slate-100 dark:bg-slate-800', label: 'Draft' },
  submitted: { color: 'text-blue-600 dark:text-blue-400', icon: ArrowUpRight, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Submitted' },
  under_review: { color: 'text-amber-600 dark:text-amber-400', icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Under Review' },
  approved: { color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Approved' },
  denied: { color: 'text-red-600 dark:text-red-400', icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', label: 'Denied' },
  withdrawn: { color: 'text-gray-500 dark:text-gray-400', icon: AlertCircle, bg: 'bg-gray-100 dark:bg-gray-800', label: 'Withdrawn' },
};

export default function LicenseApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('licenseApplications');
  const tc = useTranslations('common');
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    params.then(p => setAppId(p.id));
  }, [params]);

  const fetchApp = useCallback(async () => {
    if (!appId) return;
    try {
      const res = await fetch(`/api/license-applications/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplication(data.application);
      setNotes(data.application.notes || '');
    } catch (err) {
      console.error('Fetch application error:', err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleChecklistToggle = async (itemId: string) => {
    if (!application?.checklistData) return;
    try {
      const checklist = JSON.parse(application.checklistData);
      const items = checklist.items.map((i: ChecklistItem) =>
        i.id === itemId ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i
      );
      const updatedChecklist = { ...checklist, items };

      const res = await fetch(`/api/license-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistData: JSON.stringify(updatedChecklist) }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplication(data.application);
      }
    } catch (err) {
      console.error('Toggle checklist error:', err);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/license-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        toast.success('Notes saved');
        const data = await res.json();
        setApplication(data.application);
      }
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/license-applications/${appId}/submit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit');
        return;
      }
      toast.success(t('submitSuccess'));
      fetchApp();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/license-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn' }),
      });
      if (res.ok) {
        toast.success(t('withdrawSuccess'));
        fetchApp();
      }
    } catch {
      toast.error('Failed to withdraw');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/license-applications/${appId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Application deleted');
        router.push('/license-applications');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'general');
      formData.append('required', 'false');

      const res = await fetch(`/api/license-applications/${appId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Document uploaded');
        fetchApp();
      }
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/license-applications/${appId}/documents?docId=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document removed');
        fetchApp();
      }
    } catch {
      toast.error('Failed to remove document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="size-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium">Application not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/license-applications')}>
          {tc('back')}
        </Button>
      </div>
    );
  }

  // Parse checklist
  let checklistItems: ChecklistItem[] = [];
  if (application.checklistData) {
    try {
      const parsed = JSON.parse(application.checklistData);
      checklistItems = parsed.items || [];
    } catch {}
  }
  const completedCount = checklistItems.filter(i => i.completed).length;
  const totalCount = checklistItems.length;

  // Status timeline
  const currentStepIndex = statusSteps.indexOf(application.status);
  const isDenied = application.status === 'denied';
  const isWithdrawn = application.status === 'withdrawn';

  const config = statusConfig[application.status] || statusConfig.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/license-applications')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {application.licenseType}
              <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>
                {t(application.status as any) || application.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{application.state} • {t(application.applicationType as any) || application.applicationType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {application.status === 'draft' && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t('submit')}
            </Button>
          )}
          {(application.status === 'submitted' || application.status === 'under_review') && (
            <Button variant="outline" onClick={handleWithdraw} disabled={withdrawing} className="gap-2">
              {withdrawing ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
              {t('withdraw')}
            </Button>
          )}
          {application.status === 'denied' && (
            <Button
              onClick={() => {
                fetch(`/api/license-applications/${appId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'draft' }),
                }).then(() => { fetchApp(); toast.success(t('resubmit')); });
              }}
              className="gap-2"
            >
              {t('resubmit')}
            </Button>
          )}
          {(application.status === 'draft' || application.status === 'withdrawn') && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="gap-1">
              <Trash2 className="size-3.5" />
              {tc('delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">{t('status')}</h3>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {statusSteps.map((s, idx) => {
              const sConfig = statusConfig[s];
              const SIcon = sConfig.icon;
              const isCompleted = idx <= currentStepIndex && !isDenied && !isWithdrawn;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <motion.div
                      initial={false}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 1 }}
                      className={cn(
                        "flex items-center justify-center size-10 rounded-full transition-colors",
                        isCompleted ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25" :
                        isCurrent ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 ring-2 ring-emerald-500/30" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="size-5" /> : <SIcon className="size-4" />}
                    </motion.div>
                    <span className={cn(
                      "text-[11px] mt-1.5 font-medium",
                      isCurrent ? "text-emerald-600 dark:text-emerald-400" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {t(s as any)}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={cn(
                      "w-8 md:w-16 h-[2px] mx-1 shrink-0",
                      idx < currentStepIndex && !isDenied && !isWithdrawn ? "bg-emerald-400" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
            {(isDenied || isWithdrawn) && (
              <>
                <div className="w-8 md:w-16 h-[2px] mx-1 shrink-0 bg-red-300" />
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="flex items-center justify-center size-10 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                    {isDenied ? <XCircle className="size-5" /> : <AlertCircle className="size-5" />}
                  </div>
                  <span className="text-[11px] mt-1.5 font-medium text-red-600 dark:text-red-400">
                    {isDenied ? t('denied') : t('withdrawn')}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info + Docs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck2 className="size-4 text-emerald-600" />
                {t('applicationInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('licenseType')}</span>
                  <p className="text-sm font-medium">{application.licenseType}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('state')}</span>
                  <p className="text-sm font-medium">{application.state}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('applicantName')}</span>
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">{application.applicantName}</p>
                  </div>
                </div>
                {application.businessName && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('businessName')}</span>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{application.businessName}</p>
                    </div>
                  </div>
                )}
                {application.boardName && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('boardInfo')}</span>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{application.boardName}</p>
                    </div>
                  </div>
                )}
                {application.boardUrl && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Board URL</span>
                    <a href={application.boardUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="size-3" />
                      Visit Board
                    </a>
                  </div>
                )}
                {application.submittedDate && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('submittedDate')}</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{new Date(application.submittedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {application.targetDate && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('targetDate')}</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{new Date(application.targetDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('estimatedCost')}</span>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">${application.estimatedCost.toFixed(2)}</p>
                  </div>
                </div>
                {application.actualCost > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('actualCost')}</span>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">${application.actualCost.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              {application.denialReason && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">{t('denialReason')}</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{application.denialReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-4 text-emerald-600" />
                {t('checklist')}
                <Badge variant="outline" className="text-[10px] ms-auto">
                  {completedCount}/{totalCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklistItems.length > 0 ? (
                <ChecklistProgress
                  items={checklistItems}
                  onToggle={handleChecklistToggle}
                  completedCount={completedCount}
                  totalCount={totalCount}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noChecklist')}</p>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-emerald-600" />
                {t('documents')}
                <Badge variant="outline" className="text-[10px] ms-auto">
                  {application.documents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upload area */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-colors">
                {uploading ? (
                  <Loader2 className="size-8 text-emerald-500 animate-spin mb-2" />
                ) : (
                  <Upload className="size-8 text-muted-foreground/40 mb-2" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload document'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
              </label>

              {/* Document list */}
              {application.documents.length > 0 && (
                <div className="space-y-2">
                  {application.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.required && (
                        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 shrink-0">
                          Required
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Notes + Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {application.status === 'draft' && (
                <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {t('submit')}
                </Button>
              )}
              {(application.status === 'submitted' || application.status === 'under_review') && (
                <Button variant="outline" className="w-full gap-2" onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                  {t('withdraw')}
                </Button>
              )}
              {application.status === 'denied' && (
                <Button className="w-full gap-2" onClick={() => {
                  fetch(`/api/license-applications/${appId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'draft', denialReason: null }),
                  }).then(() => { fetchApp(); toast.success(t('resubmit')); });
                }}>
                  {t('resubmit')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="size-4 text-emerald-600" />
                {t('notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={6}
                className="text-sm resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 w-full gap-2"
              >
                {savingNotes ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {tc('save')}
              </Button>
            </CardContent>
          </Card>

          {/* Application Meta */}
          <Card>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(application.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span>{new Date(application.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
