'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Search, Filter, FileText, Clock, CheckCircle2,
  XCircle, AlertTriangle, ChevronRight, ChevronLeft, Trash2,
  Edit3, Eye, ArrowUpRight, Shield, MapPin, Building2,
  Receipt, CalendarDays, ClipboardCheck, History, ExternalLink,
  Mail, Globe, BadgeCheck, CircleDot, RotateCcw, CheckSquare,
  Square, Sparkles, Loader2, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types
interface BoardSubmission {
  id: string;
  orgId: string;
  submissionType: string;
  licenseId: string | null;
  qualifierId: string | null;
  state: string;
  boardName: string;
  boardEmail: string | null;
  boardPortalUrl: string | null;
  applicationForm: string | null;
  supportingDocs: string | null;
  coverLetter: string | null;
  submissionData: string | null;
  status: string;
  trackingNumber: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  responseDate: string | null;
  boardResponse: string | null;
  filingFee: number;
  feePaid: boolean;
  paymentRef: string | null;
  estimatedDays: number;
  priority: string;
  notes: string | null;
  checklistData: string | null;
  auditTrail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionStats {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

interface StatusCounts {
  all: number;
  draft: number;
  ready: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  returned: number;
}

interface Template {
  state: string;
  submissionType: string;
  boardName: string;
  boardEmail: string;
  boardPortalUrl: string;
  filingFee: number;
  estimatedDays: number;
  fields: { name: string; label: string; value: string; required: boolean }[];
  requiredDocs: string[];
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY',
];

const SUBMISSION_TYPES = [
  { value: 'new_license', label: 'New License' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'reinstatement', label: 'Reinstatement' },
  { value: 'name_change', label: 'Name Change' },
  { value: 'address_change', label: 'Address Change' },
  { value: 'ce_report', label: 'CE Report' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    ready: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    returned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  };
  return map[status] || map.draft;
}

function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    normal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return map[priority] || map.normal;
}

function getSubmissionTypeIcon(type: string) {
  const map: Record<string, any> = {
    new_license: Sparkles,
    renewal: RotateCcw,
    reinstatement: Shield,
    name_change: Edit3,
    address_change: MapPin,
    ce_report: FileText,
    other: FileText,
  };
  return map[type] || FileText;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export default function BoardSubmissionsPage() {
  const t = useTranslations('boardSubmissions');
  const tc = useTranslations('common');
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<BoardSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({ totalSubmissions: 0, pendingReview: 0, approved: 0, rejected: 0 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 0, draft: 0, ready: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<any>({
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
  });
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
    } catch (err) {
      console.error('Fetch submissions error:', err);
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
    } catch (err) {
      console.error('Fetch templates error:', err);
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
    } catch (err) {
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
    setWizardData({
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
    });
    setFormFields([]);
    setSelectedTemplate(null);
    setTemplates([]);
  };

  const getSubmissionTypeLabel = (type: string) => {
    const found = SUBMISSION_TYPES.find((st) => st.value === type);
    return found?.label || type;
  };

  const getPriorityLabel = (p: string) => {
    const found = PRIORITIES.find((pr) => pr.value === p);
    return found?.label || p;
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

  // Stats cards
  const statCards = [
    { label: t('totalSubmissions'), value: stats.totalSubmissions, icon: Send, gradient: 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10', iconBg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-600 dark:text-teal-400', borderAccent: 'border-s-teal-500' },
    { label: t('pendingReview'), value: stats.pendingReview, icon: Clock, gradient: 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', borderAccent: 'border-s-amber-500' },
    { label: t('approved'), value: stats.approved, icon: CheckCircle2, gradient: 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', borderAccent: 'border-s-emerald-500' },
    { label: t('rejected'), value: stats.rejected, icon: XCircle, gradient: 'from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10', iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-600 dark:text-red-400', borderAccent: 'border-s-red-500' },
  ];

  const tabs = [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'draft', label: t('draft'), count: statusCounts.draft },
    { value: 'submitted', label: t('submitted'), count: statusCounts.submitted },
    { value: 'under_review', label: t('underReview'), count: statusCounts.under_review },
    { value: 'approved', label: t('approved'), count: statusCounts.approved },
    { value: 'rejected', label: t('rejected'), count: statusCounts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => { resetWizard(); setWizardOpen(true); }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
        >
          <Plus className="size-4 me-2" />
          {t('newSubmission')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn('bg-gradient-to-br border-s-4 shadow-sm hover:shadow-md transition-shadow', card.gradient, card.borderAccent)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{card.value}</p>
                  </div>
                  <div className={cn('size-10 rounded-xl flex items-center justify-center', card.iconBg)}>
                    <card.icon className={cn('size-5', card.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={tc('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('selectState')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t('submissionType')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SUBMISSION_TYPES.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder={t('priority')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs & List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start mb-4 bg-muted/50 p-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm gap-1.5">
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-[10px]">{tab.count}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Send className="size-12 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold">{t('noSubmissions')}</h3>
                    <p className="text-muted-foreground mt-1">{t('noSubmissionsDesc')}</p>
                    <Button
                      onClick={() => { resetWizard(); setWizardOpen(true); }}
                      className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Plus className="size-4 me-2" />
                      {t('newSubmission')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {submissions.map((sub) => {
                    const TypeIcon = getSubmissionTypeIcon(sub.submissionType);
                    return (
                      <motion.div
                        key={sub.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => { setSelectedSubmission(sub); setDetailOpen(true); }}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="size-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                  <TypeIcon className="size-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={cn('text-xs', getStatusColor(sub.status))}>
                                      {getStatusLabel(sub.status)}
                                    </Badge>
                                    <Badge className={cn('text-xs', getPriorityColor(sub.priority))}>
                                      {getPriorityLabel(sub.priority)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {getSubmissionTypeLabel(sub.submissionType)}
                                    </Badge>
                                  </div>
                                  <p className="font-semibold mt-1 truncate">{sub.boardName}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin className="size-3" />{sub.state}</span>
                                    {sub.trackingNumber && (
                                      <span className="flex items-center gap-1"><BadgeCheck className="size-3" />{sub.trackingNumber}</span>
                                    )}
                                    <span className="flex items-center gap-1"><Receipt className="size-3" />${sub.filingFee}</span>
                                    <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(sub.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {(sub.status === 'draft' || sub.status === 'ready') && (
                                  <Button size="sm" variant="ghost"
                                    className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    onClick={(e) => { e.stopPropagation(); setSubmitTarget(sub); setSubmitConfirmOpen(true); }}>
                                    <Send className="size-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedSubmission(sub); setDetailOpen(true); }}>
                                  <Eye className="size-4" />
                                </Button>
                                <Button size="sm" variant="ghost"
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(sub); setDeleteOpen(true); }}>
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* New Submission Wizard */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) resetWizard(); setWizardOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('newSubmission')}</DialogTitle>
            <DialogDescription>
              Step {wizardStep} of 5 — {wizardStep === 1 ? t('step1') : wizardStep === 2 ? t('step2') : wizardStep === 3 ? t('step3') : wizardStep === 4 ? t('step4') : t('step5')}
            </DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex gap-1.5 px-1">
            {[1,2,3,4,5].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  step <= wizardStep ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-muted'
                )}
              />
            ))}
          </div>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-4 space-y-4">
              {wizardStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div>
                    <Label>{t('submissionType')} *</Label>
                    <Select value={wizardData.submissionType} onValueChange={(v) => setWizardData((p: any) => ({ ...p, submissionType: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBMISSION_TYPES.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('state')} *</Label>
                    <Select value={wizardData.state} onValueChange={(v) => setWizardData((p: any) => ({ ...p, state: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectState')} /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('priority')}</Label>
                    <Select value={wizardData.priority} onValueChange={(v) => setWizardData((p: any) => ({ ...p, priority: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {selectedTemplate ? (
                    <>
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">{selectedTemplate.boardName}</p>
                        {selectedTemplate.boardEmail && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Mail className="size-3" />{selectedTemplate.boardEmail}
                          </p>
                        )}
                        {selectedTemplate.boardPortalUrl && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Globe className="size-3" />{selectedTemplate.boardPortalUrl}
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
                              setFormFields(updated);
                            }}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>{t('boardName')} *</Label>
                        <Input className="mt-1" value={wizardData.boardName} onChange={(e) => setWizardData((p: any) => ({ ...p, boardName: e.target.value }))} />
                      </div>
                      <div>
                        <Label>{t('boardEmail')}</Label>
                        <Input className="mt-1" value={wizardData.boardEmail} onChange={(e) => setWizardData((p: any) => ({ ...p, boardEmail: e.target.value }))} />
                      </div>
                      <div>
                        <Label>{t('boardPortal')}</Label>
                        <Input className="mt-1" value={wizardData.boardPortalUrl} onChange={(e) => setWizardData((p: any) => ({ ...p, boardPortalUrl: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                  <p className="text-sm font-semibold">{t('requiredDocs')}</p>
                  {(() => {
                    const checklist = wizardData.checklistData ? JSON.parse(wizardData.checklistData) : [];
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
                          setWizardData((p: any) => ({ ...p, checklistData: JSON.stringify(updated) }));
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

              {wizardStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div>
                    <Label>{t('coverLetter')}</Label>
                    <Textarea
                      className="mt-1 min-h-32"
                      placeholder="Write a cover letter for your submission..."
                      value={wizardData.coverLetter}
                      onChange={(e) => setWizardData((p: any) => ({ ...p, coverLetter: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{tc('notes')}</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Additional notes..."
                      value={wizardData.notes}
                      onChange={(e) => setWizardData((p: any) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </motion.div>
              )}

              {wizardStep === 5 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-semibold mb-3">{t('reviewSubmit')}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">{t('submissionType')}:</span><p className="font-medium">{getSubmissionTypeLabel(wizardData.submissionType)}</p></div>
                      <div><span className="text-muted-foreground">{t('state')}:</span><p className="font-medium">{wizardData.state}</p></div>
                      <div><span className="text-muted-foreground">{t('boardName')}:</span><p className="font-medium">{wizardData.boardName}</p></div>
                      <div><span className="text-muted-foreground">{t('priority')}:</span><p className="font-medium">{getPriorityLabel(wizardData.priority)}</p></div>
                      <div><span className="text-muted-foreground">{t('filingFee')}:</span><p className="font-medium">${wizardData.filingFee}</p></div>
                      <div><span className="text-muted-foreground">{t('estimatedDays')}:</span><p className="font-medium">{wizardData.estimatedDays} days</p></div>
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
                  {wizardData.coverLetter && (
                    <div>
                      <p className="text-sm font-semibold">{t('coverLetter')}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{wizardData.coverLetter}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { if (wizardStep === 1) { setWizardOpen(false); resetWizard(); } else setWizardStep((s) => s - 1); }}>
              {wizardStep === 1 ? tc('cancel') : tc('back')}
            </Button>
            {wizardStep === 1 && wizardData.state && wizardData.submissionType && (
              <Button variant="ghost" size="sm" onClick={() => fetchTemplates(wizardData.state, wizardData.submissionType)} className="text-emerald-600">
                <Sparkles className="size-3.5 me-1" /> Auto-fill from template
              </Button>
            )}
            <Button
              onClick={() => {
                if (wizardStep < 5) {
                  if (wizardStep === 1 && wizardData.state) {
                    fetchTemplates(wizardData.state, wizardData.submissionType);
                  }
                  setWizardStep((s) => s + 1);
                } else {
                  handleCreate();
                }
              }}
              disabled={wizardStep === 1 && (!wizardData.state || !wizardData.submissionType)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {wizardStep === 5 ? tc('submit') : tc('next')}
              {wizardStep < 5 && <ChevronRight className="size-4 ms-1" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg">{selectedSubmission.boardName}</DialogTitle>
                  <Badge className={cn('text-xs', getStatusColor(selectedSubmission.status))}>
                    {getStatusLabel(selectedSubmission.status)}
                  </Badge>
                  <Badge className={cn('text-xs', getPriorityColor(selectedSubmission.priority))}>
                    {getPriorityLabel(selectedSubmission.priority)}
                  </Badge>
                </div>
                <DialogDescription>
                  {getSubmissionTypeLabel(selectedSubmission.submissionType)} — {selectedSubmission.state}
                  {selectedSubmission.trackingNumber && ` • ${selectedSubmission.trackingNumber}`}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-4 space-y-5">
                  {/* Key info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t('filingFee')}</p>
                      <p className="font-semibold">${selectedSubmission.filingFee}</p>
                      <p className="text-xs text-muted-foreground">{selectedSubmission.feePaid ? '✓ Paid' : 'Unpaid'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{t('estimatedDays')}</p>
                      <p className="font-semibold">{selectedSubmission.estimatedDays} days</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="font-semibold text-sm">{formatDate(selectedSubmission.submittedAt)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-semibold text-sm">{formatDate(selectedSubmission.createdAt)}</p>
                    </div>
                  </div>

                  {/* Board info */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="size-4" />Board Information</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedSubmission.boardName}</p>
                      {selectedSubmission.boardEmail && <p className="flex items-center gap-1"><Mail className="size-3 text-muted-foreground" />{selectedSubmission.boardEmail}</p>}
                      {selectedSubmission.boardPortalUrl && (
                        <p className="flex items-center gap-1">
                          <Globe className="size-3 text-muted-foreground" />
                          <a href={selectedSubmission.boardPortalUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                            {t('boardPortal')} <ExternalLink className="size-3" />
                          </a>
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Application Form */}
                  {selectedSubmission.applicationForm && (() => {
                    const form = JSON.parse(selectedSubmission.applicationForm);
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
                  {selectedSubmission.checklistData && (() => {
                    const checklist = JSON.parse(selectedSubmission.checklistData);
                    return checklist.length > 0 ? (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="size-4" />{t('checklist')}</CardTitle></CardHeader>
                        <CardContent className="space-y-1.5">
                          {checklist.map((item: { item: string; completed: boolean }, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => toggleChecklistItem(selectedSubmission, idx)}
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
                  {selectedSubmission.coverLetter && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="size-4" />{t('coverLetter')}</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{selectedSubmission.coverLetter}</p></CardContent>
                    </Card>
                  )}

                  {/* Board Response */}
                  {selectedSubmission.boardResponse && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="size-4" />{t('boardResponse')}</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{selectedSubmission.boardResponse}</p></CardContent>
                    </Card>
                  )}

                  {/* Audit Trail */}
                  {selectedSubmission.auditTrail && (() => {
                    const trail = JSON.parse(selectedSubmission.auditTrail);
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
                  {selectedSubmission.notes && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{tc('notes')}</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{selectedSubmission.notes}</p></CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="flex-row gap-2 pt-2 border-t flex-wrap">
                {(selectedSubmission.status === 'draft' || selectedSubmission.status === 'ready') && (
                  <Button
                    onClick={() => { setSubmitTarget(selectedSubmission); setSubmitConfirmOpen(true); }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <Send className="size-4 me-2" />{t('submitToBoard')}
                  </Button>
                )}
                {selectedSubmission.status === 'submitted' && (
                  <Button variant="outline" onClick={() => handleMarkStatus(selectedSubmission, 'under_review')}>
                    <Clock className="size-4 me-2" />Mark Under Review
                  </Button>
                )}
                {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'under_review') && (
                  <>
                    <Button variant="outline" className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => handleMarkStatus(selectedSubmission, 'approved')}>
                      <CheckCircle2 className="size-4 me-2" />{t('markApproved')}
                    </Button>
                    <Button variant="outline" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleMarkStatus(selectedSubmission, 'rejected')}>
                      <XCircle className="size-4 me-2" />{t('markRejected')}
                    </Button>
                  </>
                )}
                <div className="flex-1" />
                <Button variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { setDeleteTarget(selectedSubmission); setDeleteOpen(true); }}>
                  <Trash2 className="size-4 me-2" />{t('deleteSubmission')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation */}
      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmSubmit')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmSubmitDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitToBoard}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {submitting ? <Loader2 className="size-4 me-2 animate-spin" /> : <Send className="size-4 me-2" />}
              {tc('submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
