import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import type { BoardSubmission, SubmissionStats, StatusCounts, Template } from './types';
import { US_STATES } from './constants';

const emptyStats: SubmissionStats = { totalSubmissions: 0, pendingReview: 0, approved: 0, rejected: 0 };
const emptyStatusCounts: StatusCounts = { all: 0, draft: 0, ready: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0, returned: 0 };

const initialWizardData = {
  submissionType: 'new_license',
  state: '',
  boardName: '',
  boardEmail: '',
  boardPortalUrl: '',
  priority: 'normal',
  applicationForm: '',
  coverLetter: '',
  filingFee: 0,
  estimatedDays: 30,
  notes: '',
  checklistData: '',
};

export function useBoardSubmissions() {
  const t = useTranslations('boardSubmissions');
  const tc = useTranslations('common');
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<BoardSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>(emptyStats);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(emptyStatusCounts);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<any>({ ...initialWizardData });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formFields, setFormFields] = useState<{ name: string; label: string; value: string; required: boolean }[]>([]);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BoardSubmission | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardSubmission | null>(null);

  // Submit dialog
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<BoardSubmission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (search) params.set('search', search);
      if (filterState !== 'all') params.set('state', filterState);
      if (filterType !== 'all') params.set('submissionType', filterType);
      if (filterPriority !== 'all') params.set('priority', filterPriority);

      const res = await fetch(`/api/board-submissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setStats(data.stats);
        setStatusCounts(data.statusCounts);
      }
    } catch {
      console.error('Fetch submissions error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, filterState, filterType, filterPriority]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const fetchTemplates = async (state: string, type: string) => {
    try {
      const res = await fetch(`/api/board-submissions/templates?state=${state}&submissionType=${type}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          const tmpl = data.templates[0];
          setSelectedTemplate(tmpl);
          setWizardData((prev: any) => ({
            ...prev,
            boardName: tmpl.boardName,
            boardEmail: tmpl.boardEmail || '',
            boardPortalUrl: tmpl.boardPortalUrl || '',
            filingFee: tmpl.filingFee,
            estimatedDays: tmpl.estimatedDays,
          }));
          setFormFields(tmpl.fields.map((f: any) => ({ ...f })));
          const checklist = tmpl.requiredDocs.map((doc: string) => ({ item: doc, completed: false }));
          setWizardData((prev: any) => ({ ...prev, checklistData: JSON.stringify(checklist) }));
        }
      }
    } catch {
      console.error('Fetch templates error');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/board-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wizardData,
          applicationForm: JSON.stringify({ fields: formFields }),
        }),
      });
      if (res.ok) {
        toast({ title: t('submissionSuccess'), description: '' });
        setWizardOpen(false);
        resetWizard();
        fetchSubmissions();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create submission', variant: 'destructive' });
    }
  };

  const handleSubmitToBoard = async () => {
    if (!submitTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/board-submissions/${submitTarget.id}/submit`, { method: 'POST' });
      if (res.ok) {
        toast({ title: t('submissionSuccess'), description: '' });
        setSubmitConfirmOpen(false);
        setSubmitTarget(null);
        fetchSubmissions();
        if (detailOpen && selectedSubmission?.id === submitTarget.id) {
          setSelectedSubmission(null);
          setDetailOpen(false);
        }
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/board-submissions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted', description: '' });
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (detailOpen && selectedSubmission?.id === deleteTarget.id) {
          setDetailOpen(false);
          setSelectedSubmission(null);
        }
        fetchSubmissions();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleMarkStatus = async (submission: BoardSubmission, newStatus: string) => {
    try {
      const res = await fetch(`/api/board-submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: `Status updated to ${newStatus}`, description: '' });
        fetchSubmissions();
        if (detailOpen && selectedSubmission?.id === submission.id) {
          const updated = await (await fetch(`/api/board-submissions/${submission.id}`)).json();
          setSelectedSubmission(updated.submission);
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const toggleChecklistItem = async (submission: BoardSubmission, index: number) => {
    const checklist = submission.checklistData ? JSON.parse(submission.checklistData) : [];
    checklist[index].completed = !checklist[index].completed;
    try {
      await fetch(`/api/board-submissions/${submission.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistData: JSON.stringify(checklist) }),
      });
      fetchSubmissions();
      if (detailOpen && selectedSubmission?.id === submission.id) {
        const updated = await (await fetch(`/api/board-submissions/${submission.id}`)).json();
        setSelectedSubmission(updated.submission);
      }
    } catch {}
  };

  const resetWizard = () => {
    setWizardStep(1);
    setWizardData({ ...initialWizardData });
    setFormFields([]);
    setSelectedTemplate(null);
    setTemplates([]);
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: t('draft'),
      ready: 'Ready',
      submitted: t('submitted'),
      under_review: t('underReview'),
      approved: t('approved'),
      rejected: t('rejected'),
      returned: t('returned'),
    };
    return map[s] || s;
  };

  const statCards = [
    { label: t('totalSubmissions'), value: stats.totalSubmissions, icon: 'Send' as const, gradient: 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10', iconBg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-600 dark:text-teal-400', borderAccent: 'border-s-teal-500' },
    { label: t('pendingReview'), value: stats.pendingReview, icon: 'Clock' as const, gradient: 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', borderAccent: 'border-s-amber-500' },
    { label: t('approved'), value: stats.approved, icon: 'CheckCircle2' as const, gradient: 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', borderAccent: 'border-s-emerald-500' },
    { label: t('rejected'), value: stats.rejected, icon: 'XCircle' as const, gradient: 'from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10', iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-600 dark:text-red-400', borderAccent: 'border-s-red-500' },
  ];

  const tabs = [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'draft', label: t('draft'), count: statusCounts.draft },
    { value: 'submitted', label: t('submitted'), count: statusCounts.submitted },
    { value: 'under_review', label: t('underReview'), count: statusCounts.under_review },
    { value: 'approved', label: t('approved'), count: statusCounts.approved },
    { value: 'rejected', label: t('rejected'), count: statusCounts.rejected },
  ];

  return {
    // Data
    submissions, stats, statusCounts, loading,
    // Filters
    activeTab, setActiveTab, search, setSearch,
    filterState, setFilterState, filterType, setFilterType,
    filterPriority, setFilterPriority,
    // Wizard
    wizardOpen, setWizardOpen, wizardStep, setWizardStep,
    wizardData, setWizardData, templates, selectedTemplate,
    formFields, setFormFields,
    // Detail
    detailOpen, setDetailOpen, selectedSubmission, setSelectedSubmission,
    // Delete
    deleteOpen, setDeleteOpen, deleteTarget, setDeleteTarget,
    // Submit
    submitConfirmOpen, setSubmitConfirmOpen, submitTarget, setSubmitTarget,
    submitting,
    // Actions
    fetchSubmissions, fetchTemplates, handleCreate, handleSubmitToBoard,
    handleDelete, handleMarkStatus, toggleChecklistItem, resetWizard,
    // Derived
    getStatusLabel, statCards, tabs,
    // Translations
    t, tc,
    US_STATES,
  };
}
