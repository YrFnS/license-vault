'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, Plus, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileText, Mail, MoreHorizontal, Eye, X, Send, RotateCcw,
  ChevronDown, ChevronUp, Trash2, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SignatureRequestData {
  id: string;
  orgId: string;
  documentTitle: string;
  documentType: string;
  documentUrl: string | null;
  documentContent: string | null;
  requestedById: string | null;
  requestedToName: string;
  requestedToEmail: string;
  message: string | null;
  status: string;
  signingToken: string;
  signedAt: string | null;
  declinedAt: string | null;
  declinedReason: string | null;
  expiresAt: string | null;
  signatureData: string | null;
  signerName: string | null;
  signerTitle: string | null;
  witnessName: string | null;
  witnessEmail: string | null;
  auditTrail: string | null;
  createdAt: string;
  updatedAt: string;
  org?: { name: string };
}

interface SignatureStats {
  total: number;
  pending: number;
  signed: number;
  declined: number;
  expired: number;
  cancelled: number;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: any }> = {
  pending: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', icon: Clock },
  viewed: { color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', icon: Eye },
  signed: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  declined: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', icon: XCircle },
  expired: { color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800', icon: AlertTriangle },
  cancelled: { color: 'text-slate-700 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800', icon: X },
};

const docTypeColors: Record<string, string> = {
  license_renewal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
  compliance_cert: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  contract: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  coi: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
  bond: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
  general: 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400',
};

export default function SignaturesPage() {
  const t = useTranslations('signatures');
  const tc = useTranslations('common');
  const { toast } = useToast();

  const [requests, setRequests] = useState<SignatureRequestData[]>([]);
  const [stats, setStats] = useState<SignatureStats>({ total: 0, pending: 0, signed: 0, declined: 0, expired: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<SignatureRequestData | null>(null);

  // Create form state
  const [form, setForm] = useState({
    documentTitle: '',
    documentType: 'general',
    requestedToName: '',
    requestedToEmail: '',
    message: '',
    expiresAt: '',
    documentContent: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/signatures');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, signed: 0, declined: 0, expired: 0, cancelled: 0 });
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.documentTitle || !form.requestedToName || !form.requestedToEmail) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }
      toast({ title: t('requestSent'), description: '' });
      setCreateOpen(false);
      setForm({ documentTitle: '', documentType: 'general', requestedToName: '', requestedToEmail: '', message: '', expiresAt: '', documentContent: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      const res = await fetch(`/api/signatures/${cancelId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel');
      toast({ title: t('requestCancelled'), description: '' });
      setCancelId(null);
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel request', variant: 'destructive' });
    }
  };

  const handleResend = async (req: SignatureRequestData) => {
    try {
      // Re-create with same details but new token
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: req.documentTitle,
          documentType: req.documentType,
          documentContent: req.documentContent,
          documentUrl: req.documentUrl,
          requestedToName: req.requestedToName,
          requestedToEmail: req.requestedToEmail,
          message: req.message,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to resend');
      toast({ title: t('resendSuccess'), description: '' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to resend request', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/signatures/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Request deleted successfully' });
      setDetailRequest(null);
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete request', variant: 'destructive' });
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.documentTitle.toLowerCase().includes(q) ||
        r.requestedToName.toLowerCase().includes(q) ||
        r.requestedToEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDocTypeLabel = (type: string) => {
    const key = type as any;
    const map: Record<string, string> = {
      license_renewal: t('licenseRenewal'),
      compliance_cert: t('complianceCert'),
      contract: t('contract'),
      coi: t('coi'),
      bond: t('bond'),
      general: t('general'),
    };
    return map[key] || type;
  };

  const statCards = [
    { label: t('totalRequests'), value: stats.total, icon: FileText, color: 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10', accent: 'border-s-teal-400', iconBg: 'bg-teal-100 dark:bg-teal-900/50', iconColor: 'text-teal-600 dark:text-teal-400' },
    { label: t('pendingCount'), value: stats.pending, icon: Clock, color: 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10', accent: 'border-s-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: t('signedCount'), value: stats.signed, icon: CheckCircle2, color: 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10', accent: 'border-s-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('expiredCount'), value: stats.expired, icon: AlertTriangle, color: 'from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10', accent: 'border-s-red-400', iconBg: 'bg-red-100 dark:bg-red-900/50', iconColor: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
        >
          <Plus className="size-4 me-2" />
          {t('newRequest')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn('border-s-4 bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow duration-300', stat.color, stat.accent)}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('size-10 rounded-xl flex items-center justify-center shadow-sm', stat.iconBg)}>
                    <stat.icon className={cn('size-5', stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            <TabsTrigger value="pending">{t('pending')}</TabsTrigger>
            <TabsTrigger value="signed">{t('signed')}</TabsTrigger>
            <TabsTrigger value="declined">{t('declined')}</TabsTrigger>
            <TabsTrigger value="expired">{t('expired')}</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={tc('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
        </div>

        {/* Content for all tabs */}
        {['all', 'pending', 'signed', 'declined', 'expired'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                      <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <PenTool className="size-12 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">{t('noRequests')}</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t('noRequestsDesc')}</p>
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    >
                      <Plus className="size-4 me-2" />
                      {t('newRequest')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredRequests.map((req, i) => {
                    const config = statusConfig[req.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const isExpanded = expandedId === req.id;

                    return (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-border/50"
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        >
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-base truncate">{req.documentTitle}</h3>
                                  <Badge variant="outline" className={cn('text-[11px] border', docTypeColors[req.documentType] || docTypeColors.general)}>
                                    {getDocTypeLabel(req.documentType)}
                                  </Badge>
                                  <Badge variant="outline" className={cn('text-[11px] border', config.bgColor, config.color)}>
                                    <StatusIcon className="size-3 me-1" />
                                    {t(req.status as any)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Mail className="size-3.5" />
                                    {req.requestedToName} ({req.requestedToEmail})
                                  </span>
                                  <span className="hidden sm:inline">{formatDate(req.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {(req.status === 'pending' || req.status === 'viewed') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={(e) => { e.stopPropagation(); setCancelId(req.id); }}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                )}
                                {(req.status === 'declined' || req.status === 'expired' || req.status === 'cancelled') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    onClick={(e) => { e.stopPropagation(); handleResend(req); }}
                                  >
                                    <RotateCcw className="size-4" />
                                  </Button>
                                )}
                                {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                              </div>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <Separator className="my-4" />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      {req.message && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('message')}</p>
                                          <p className="text-sm mt-1">{req.message}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                                        <p className="text-sm mt-1">{formatDate(req.createdAt)}</p>
                                      </div>
                                      {req.expiresAt && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('expiresAt')}</p>
                                          <p className="text-sm mt-1">{formatDate(req.expiresAt)}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-3">
                                      {req.signedAt && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('signedOn')}</p>
                                          <p className="text-sm mt-1">{formatDate(req.signedAt)}</p>
                                        </div>
                                      )}
                                      {req.signerName && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('signerName')}</p>
                                          <p className="text-sm mt-1">{req.signerName}{req.signerTitle ? ` — ${req.signerTitle}` : ''}</p>
                                        </div>
                                      )}
                                      {req.declinedAt && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('declined')}</p>
                                          <p className="text-sm mt-1">{formatDate(req.declinedAt)}{req.declinedReason ? `: ${req.declinedReason}` : ''}</p>
                                        </div>
                                      )}
                                      {req.signatureData && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signature</p>
                                          <div className="mt-1">
                                            {(() => {
                                              try {
                                                const sig = JSON.parse(req.signatureData);
                                                if (sig.type === 'draw') {
                                                  return <img src={sig.value} alt="Signature" className="h-16 bg-white dark:bg-slate-800 rounded border p-1" />;
                                                }
                                                return <p className="text-lg italic font-serif">{sig.value}</p>;
                                              } catch { return null; }
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Audit Trail */}
                                  {req.auditTrail && (
                                    <div className="mt-4">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('auditTrail')}</p>
                                      <div className="mt-2 space-y-1">
                                        {(() => {
                                          try {
                                            const trail = JSON.parse(req.auditTrail);
                                            return trail.map((entry: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="capitalize">{entry.action}</span>
                                                <span>—</span>
                                                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                              </div>
                                            ));
                                          } catch { return null; }
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 mt-4">
                                    {req.status !== 'signed' && req.status !== 'cancelled' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); setCancelId(req.id); }}
                                      >
                                        <X className="size-3.5 me-1" />
                                        {t('cancel')}
                                      </Button>
                                    )}
                                    {(req.status === 'declined' || req.status === 'expired' || req.status === 'cancelled') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                        onClick={(e) => { e.stopPropagation(); handleResend(req); }}
                                      >
                                        <Send className="size-3.5 me-1" />
                                        {t('resend')}
                                      </Button>
                                    )}
                                    {req.status !== 'signed' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                                      >
                                        <Trash2 className="size-3.5 me-1" />
                                        {tc('delete')}
                                      </Button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
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

      {/* Create Request Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="size-5 text-emerald-600" />
              {t('newRequest')}
            </DialogTitle>
            <DialogDescription>
              Send a document for e-signature
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="docTitle">{t('documentTitle')} *</Label>
              <Input
                id="docTitle"
                placeholder="e.g., License Renewal Agreement"
                value={form.documentTitle}
                onChange={(e) => setForm(f => ({ ...f, documentTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('documentType')}</Label>
              <Select value={form.documentType} onValueChange={(v) => setForm(f => ({ ...f, documentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('general')}</SelectItem>
                  <SelectItem value="license_renewal">{t('licenseRenewal')}</SelectItem>
                  <SelectItem value="compliance_cert">{t('complianceCert')}</SelectItem>
                  <SelectItem value="contract">{t('contract')}</SelectItem>
                  <SelectItem value="coi">{t('coi')}</SelectItem>
                  <SelectItem value="bond">{t('bond')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signerName">{t('signerName')} *</Label>
                <Input
                  id="signerName"
                  placeholder="John Doe"
                  value={form.requestedToName}
                  onChange={(e) => setForm(f => ({ ...f, requestedToName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signerEmail">{t('signerEmail')} *</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={form.requestedToEmail}
                  onChange={(e) => setForm(f => ({ ...f, requestedToEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('message')}</Label>
              <Textarea
                id="message"
                placeholder="Add a message for the signer..."
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">{t('expiresAt')}</Label>
              <Input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docContent">{t('documentContent')}</Label>
              <Textarea
                id="docContent"
                placeholder="Enter the document content or HTML..."
                value={form.documentContent}
                onChange={(e) => setForm(f => ({ ...f, documentContent: e.target.value }))}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{tc('cancel')}</Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {creating ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin me-2" />
              ) : (
                <Send className="size-4 me-2" />
              )}
              {creating ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmCancelDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
