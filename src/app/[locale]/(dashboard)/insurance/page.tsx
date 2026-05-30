'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface InsuranceRecord {
  id: string;
  orgId: string;
  name: string;
  type: string;
  policyNumber: string;
  provider: string;
  coverageAmount: number;
  premiumAmount: number;
  issueDate: string;
  expirationDate: string;
  status: string;
  holderName: string | null;
  notes: string | null;
  autoRenew: boolean;
  additionalInsured: boolean;
  primaryNoncontrib: boolean;
  waiverSubrogation: boolean;
  perOccurrenceLimit: number;
  aggregateLimit: number;
  deductible: number;
  endorsementTypes: string | null;
  requiredCoverage: number;
  requiredPerOccurrence: number;
  requiredAggregate: number;
  requiredEndorsements: string | null;
  complianceStatus: string;
  lastVerified: string | null;
  createdAt: string;
  updatedAt: string;
  computedStatus: string;
  compliance: {
    isCompliant: boolean;
    deficiencies: string[];
  };
}

interface InsuranceSummary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  totalCoverage: number;
  totalPremium: number;
  compliant: number;
  deficient: number;
  expiredCompliance: number;
  pending: number;
}

type FilterTab = 'all' | 'insurance' | 'bond' | 'certificate' | 'active' | 'expiring' | 'expired' | 'compliant' | 'deficient';

const filterTabs: { key: FilterTab; icon: React.ElementType }[] = [
  { key: 'all', icon: Shield },
  { key: 'insurance', icon: Shield },
  { key: 'bond', icon: FileText },
  { key: 'certificate', icon: CheckCircle2 },
  { key: 'active', icon: CheckCircle2 },
  { key: 'expiring', icon: AlertTriangle },
  { key: 'expired', icon: XCircle },
  { key: 'compliant', icon: ShieldCheck },
  { key: 'deficient', icon: ShieldAlert },
];

const ENDORSEMENT_OPTIONS = [
  { value: 'CG_20_10', label: 'CG 20 10' },
  { value: 'CG_20_37', label: 'CG 20 37' },
  { value: 'CG_20_26', label: 'CG 20 26' },
  { value: 'CG_20_33', label: 'CG 20 33' },
  { value: 'CG_20_11', label: 'CG 20 11' },
  { value: 'CG_20_12', label: 'CG 20 12' },
  { value: 'CG_21_04', label: 'CG 21 04' },
  { value: 'CG_21_05', label: 'CG 21 05' },
  { value: 'additional_insured', label: 'Additional Insured' },
  { value: 'primary_noncontrib', label: 'Primary & Noncontributory' },
  { value: 'waiver_subrogation', label: 'Waiver of Subrogation' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
          <CheckCircle2 className="size-3 me-1" />
          {t('active')}
        </Badge>
      );
    case 'expiring_soon':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
          <AlertTriangle className="size-3 me-1" />
          {t('expiring')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100">
          <XCircle className="size-3 me-1" />
          {t('expired')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getComplianceBadge(complianceStatus: string, t: (key: string) => string) {
  switch (complianceStatus) {
    case 'compliant':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
          <ShieldCheck className="size-3 me-1" />
          {t('compliant')}
        </Badge>
      );
    case 'deficient':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
          <ShieldAlert className="size-3 me-1" />
          {t('deficient')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100">
          <XCircle className="size-3 me-1" />
          {t('expired')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100">
          <Clock className="size-3 me-1" />
          {t('pending')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{complianceStatus}</Badge>;
  }
}

function getTypeBadge(type: string, t: (key: string) => string) {
  switch (type) {
    case 'insurance':
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800">
          <Shield className="size-3 me-1" />
          {t('types.insurance')}
        </Badge>
      );
    case 'bond':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          <FileText className="size-3 me-1" />
          {t('types.bond')}
        </Badge>
      );
    case 'certificate':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
          <CheckCircle2 className="size-3 me-1" />
          {t('types.certificate')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function parseEndorsementTypes(endorsementTypes: string | null): string[] {
  if (!endorsementTypes) return [];
  try {
    return JSON.parse(endorsementTypes);
  } catch {
    return [];
  }
}

function getEndorsementBadges(record: InsuranceRecord, t: (key: string) => string) {
  const endorsements = parseEndorsementTypes(record.endorsementTypes);
  const badges: React.ReactNode[] = [];

  if (record.additionalInsured) {
    badges.push(
      <Badge key="ai" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-xs px-1.5 py-0">
        AI
      </Badge>
    );
  }
  if (record.primaryNoncontrib) {
    badges.push(
      <Badge key="pnc" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs px-1.5 py-0">
        PNC
      </Badge>
    );
  }
  if (record.waiverSubrogation) {
    badges.push(
      <Badge key="wos" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs px-1.5 py-0">
        WoS
      </Badge>
    );
  }

  endorsements.forEach((et) => {
    if (et.startsWith('CG_')) {
      badges.push(
        <Badge key={et} variant="outline" className="text-xs px-1.5 py-0">
          {et.replace(/_/g, ' ')}
        </Badge>
      );
    }
  });

  if (badges.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}

interface FormData {
  name: string;
  type: string;
  policyNumber: string;
  provider: string;
  coverageAmount: string;
  premiumAmount: string;
  issueDate: string;
  expirationDate: string;
  holderName: string;
  notes: string;
  autoRenew: boolean;
  additionalInsured: boolean;
  primaryNoncontrib: boolean;
  waiverSubrogation: boolean;
  perOccurrenceLimit: string;
  aggregateLimit: string;
  deductible: string;
  endorsementTypes: string[];
  requiredCoverage: string;
  requiredPerOccurrence: string;
  requiredAggregate: string;
  requiredEndorsements: string[];
}

const emptyForm: FormData = {
  name: '',
  type: 'insurance',
  policyNumber: '',
  provider: '',
  coverageAmount: '',
  premiumAmount: '',
  issueDate: '',
  expirationDate: '',
  holderName: '',
  notes: '',
  autoRenew: false,
  additionalInsured: false,
  primaryNoncontrib: false,
  waiverSubrogation: false,
  perOccurrenceLimit: '',
  aggregateLimit: '',
  deductible: '',
  endorsementTypes: [],
  requiredCoverage: '',
  requiredPerOccurrence: '',
  requiredAggregate: '',
  requiredEndorsements: [],
};

export default function InsurancePage() {
  const t = useTranslations('insurance');
  const { toast } = useToast();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [summary, setSummary] = useState<InsuranceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter === 'insurance' || activeFilter === 'bond' || activeFilter === 'certificate') {
        params.set('type', activeFilter);
      } else if (activeFilter === 'active' || activeFilter === 'expiring' || activeFilter === 'expired') {
        params.set('status', activeFilter);
      } else if (activeFilter === 'compliant' || activeFilter === 'deficient') {
        params.set('compliance', activeFilter);
      }
      const res = await fetch(`/api/insurance?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
    } catch {
      toast({ title: 'Error', description: 'Failed to load insurance records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.policyNumber.toLowerCase().includes(q) ||
      r.provider.toLowerCase().includes(q) ||
      (r.holderName && r.holderName.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData(emptyForm);
    setShowRequirements(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (record: InsuranceRecord) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      type: record.type,
      policyNumber: record.policyNumber,
      provider: record.provider,
      coverageAmount: record.coverageAmount.toString(),
      premiumAmount: record.premiumAmount.toString(),
      issueDate: new Date(record.issueDate).toISOString().split('T')[0],
      expirationDate: new Date(record.expirationDate).toISOString().split('T')[0],
      holderName: record.holderName || '',
      notes: record.notes || '',
      autoRenew: record.autoRenew,
      additionalInsured: record.additionalInsured,
      primaryNoncontrib: record.primaryNoncontrib,
      waiverSubrogation: record.waiverSubrogation,
      perOccurrenceLimit: record.perOccurrenceLimit?.toString() || '',
      aggregateLimit: record.aggregateLimit?.toString() || '',
      deductible: record.deductible?.toString() || '',
      endorsementTypes: parseEndorsementTypes(record.endorsementTypes),
      requiredCoverage: record.requiredCoverage?.toString() || '',
      requiredPerOccurrence: record.requiredPerOccurrence?.toString() || '',
      requiredAggregate: record.requiredAggregate?.toString() || '',
      requiredEndorsements: parseEndorsementTypes(record.requiredEndorsements),
    });
    setShowRequirements(
      (record.requiredCoverage > 0 || record.requiredPerOccurrence > 0 || record.requiredAggregate > 0)
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.policyNumber || !formData.provider || !formData.issueDate || !formData.expirationDate) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        policyNumber: formData.policyNumber,
        provider: formData.provider,
        coverageAmount: parseFloat(formData.coverageAmount) || 0,
        premiumAmount: parseFloat(formData.premiumAmount) || 0,
        issueDate: formData.issueDate,
        expirationDate: formData.expirationDate,
        holderName: formData.holderName || null,
        notes: formData.notes || null,
        autoRenew: formData.autoRenew,
        additionalInsured: formData.additionalInsured,
        primaryNoncontrib: formData.primaryNoncontrib,
        waiverSubrogation: formData.waiverSubrogation,
        perOccurrenceLimit: parseFloat(formData.perOccurrenceLimit) || 0,
        aggregateLimit: parseFloat(formData.aggregateLimit) || 0,
        deductible: parseFloat(formData.deductible) || 0,
        endorsementTypes: formData.endorsementTypes,
        requiredCoverage: parseFloat(formData.requiredCoverage) || 0,
        requiredPerOccurrence: parseFloat(formData.requiredPerOccurrence) || 0,
        requiredAggregate: parseFloat(formData.requiredAggregate) || 0,
        requiredEndorsements: formData.requiredEndorsements,
      };

      let res: Response;
      if (editingRecord) {
        res = await fetch(`/api/insurance/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/insurance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast({ title: t('saveSuccess') });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/insurance/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: t('deleteSuccess') });
      setDeleteId(null);
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyAll = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/insurance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to verify');
      const data = await res.json();
      toast({
        title: t('verificationComplete'),
        description: `Compliant: ${data.results.compliant} | Deficient: ${data.results.deficient} | Expired: ${data.results.expired} | Pending: ${data.results.pending}`,
      });
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to verify compliance', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const toggleEndorsement = (value: string, field: 'endorsementTypes' | 'requiredEndorsements') => {
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleVerifyAll}
            disabled={verifying}
            className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700"
          >
            {verifying ? (
              <RefreshCw className="size-4 me-2 animate-spin" />
            ) : (
              <ClipboardCheck className="size-4 me-2" />
            )}
            {t('verifyCompliance')}
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
          >
            <Plus className="size-4 me-2" />
            {t('addPolicy')}
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card className="border-s-4 border-s-teal-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                  <Shield className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('totalPolicies')}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tabular-nums">{summary.total}</p>
            </CardContent>
          </Card>

          <Card className="border-s-4 border-s-emerald-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-teal-950/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('activePolicies')}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{summary.active}</p>
            </CardContent>
          </Card>

          <Card className="border-s-4 border-s-amber-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('expiringPolicies')}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{summary.expiring}</p>
            </CardContent>
          </Card>

          <Card className="border-s-4 border-s-red-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-red-50/90 via-red-50/60 to-amber-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-amber-950/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                  <XCircle className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('expiredPolicies')}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{summary.expired}</p>
            </CardContent>
          </Card>

          <Card className="border-s-4 border-s-amber-600 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-red-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-red-950/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                  <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('deficient')}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{summary.deficient}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Tabs & Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.key}
                variant={activeFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(tab.key)}
                className={
                  activeFilter === tab.key
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                }
              >
                <Icon className="size-3.5 me-1.5" />
                {t(tab.key === 'all' ? 'all' : tab.key === 'expiring' ? 'expiring' : tab.key)}
              </Button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('policyNumber') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
                  <Shield className="size-12 text-muted-foreground/60" />
                </div>
                <div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
                  <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">{t('noPolicies')}</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-4 max-w-sm">{t('noPoliciesDesc')}</p>
              <Button
                onClick={handleOpenAdd}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
              >
                <Plus className="size-4 me-2" />
                {t('addPolicy')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('policyNumber')}</TableHead>
                        <TableHead>{t('provider')}</TableHead>
                        <TableHead className="text-end">{t('coverageDetails')}</TableHead>
                        <TableHead>{t('endorsements')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('compliance')}</TableHead>
                        <TableHead className="text-end" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredRecords.map((record) => (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {record.autoRenew && <RefreshCw className="size-3 text-teal-500" />}
                                {record.name}
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(record.type, t)}</TableCell>
                            <TableCell className="font-mono text-sm">{record.policyNumber}</TableCell>
                            <TableCell>{record.provider}</TableCell>
                            <TableCell className="text-end">
                              <div className="text-xs space-y-0.5">
                                <div className="font-medium">{formatCurrency(record.coverageAmount)}</div>
                                {(record.perOccurrenceLimit > 0 || record.aggregateLimit > 0) && (
                                  <>
                                    {record.perOccurrenceLimit > 0 && (
                                      <div className="text-muted-foreground">{t('perOccurrenceLimit')}: {formatCurrency(record.perOccurrenceLimit)}</div>
                                    )}
                                    {record.aggregateLimit > 0 && (
                                      <div className="text-muted-foreground">{t('aggregateLimit')}: {formatCurrency(record.aggregateLimit)}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getEndorsementBadges(record, t)}</TableCell>
                            <TableCell>{getStatusBadge(record.computedStatus, t)}</TableCell>
                            <TableCell>{getComplianceBadge(record.complianceStatus, t)}</TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors duration-200"
                                  onClick={() => handleOpenEdit(record)}
                                >
                                  <Pencil className="size-3.5" />
                                  <span className="sr-only">{t('editPolicy')}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors duration-200"
                                  onClick={() => setDeleteId(record.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="sr-only">{t('deleteConfirm')}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Medium Table (simpler) */}
            <div className="hidden md:block lg:hidden">
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('coverageDetails')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('compliance')}</TableHead>
                        <TableHead className="text-end" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredRecords.map((record) => (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {record.autoRenew && <RefreshCw className="size-3 text-teal-500" />}
                                <div>
                                  <div className="truncate max-w-32">{record.name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{record.policyNumber}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(record.type, t)}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div className="font-medium">{formatCurrency(record.coverageAmount)}</div>
                                {record.perOccurrenceLimit > 0 && (
                                  <div className="text-muted-foreground">Occ: {formatCurrency(record.perOccurrenceLimit)}</div>
                                )}
                                {record.aggregateLimit > 0 && (
                                  <div className="text-muted-foreground">Agg: {formatCurrency(record.aggregateLimit)}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.computedStatus, t)}</TableCell>
                            <TableCell>{getComplianceBadge(record.complianceStatus, t)}</TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                                  onClick={() => handleOpenEdit(record)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                  onClick={() => setDeleteId(record.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              <AnimatePresence>
                {filteredRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {record.autoRenew && <RefreshCw className="size-3 text-teal-500 shrink-0" />}
                              <h3 className="font-semibold truncate">{record.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">{record.policyNumber}</p>
                          </div>
                          <div className="flex items-center gap-1.5 ms-2 shrink-0 flex-wrap justify-end">
                            {getTypeBadge(record.type, t)}
                            {getStatusBadge(record.computedStatus, t)}
                            {getComplianceBadge(record.complianceStatus, t)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">{t('provider')}:</span>
                            <p className="font-medium">{record.provider}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('coverageAmount')}:</span>
                            <p className="font-medium">{formatCurrency(record.coverageAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('premiumAmount')}:</span>
                            <p className="font-medium">{formatCurrency(record.premiumAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('expirationDate')}:</span>
                            <p className="font-medium">{formatDate(record.expirationDate)}</p>
                          </div>
                        </div>

                        {/* Endorsements */}
                        {(record.additionalInsured || record.primaryNoncontrib || record.waiverSubrogation || parseEndorsementTypes(record.endorsementTypes).length > 0) && (
                          <div className="mb-3">
                            <span className="text-xs text-muted-foreground block mb-1">{t('endorsements')}:</span>
                            {getEndorsementBadges(record, t)}
                          </div>
                        )}

                        {/* Coverage Details */}
                        {(record.perOccurrenceLimit > 0 || record.aggregateLimit > 0) && (
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            {record.perOccurrenceLimit > 0 && (
                              <div>
                                <span className="text-muted-foreground">{t('perOccurrenceLimit')}:</span>
                                <p className="font-medium">{formatCurrency(record.perOccurrenceLimit)}</p>
                              </div>
                            )}
                            {record.aggregateLimit > 0 && (
                              <div>
                                <span className="text-muted-foreground">{t('aggregateLimit')}:</span>
                                <p className="font-medium">{formatCurrency(record.aggregateLimit)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Deficiencies */}
                        {record.complianceStatus === 'deficient' && record.compliance?.deficiencies?.length > 0 && (
                          <div className="mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
                              <ShieldAlert className="size-3" />
                              {t('deficiencyFound')}
                            </div>
                            <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-0.5">
                              {record.compliance.deficiencies.map((d, i) => (
                                <li key={i}>• {d}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {record.holderName && (
                          <p className="text-sm text-muted-foreground mb-3">
                            <span className="font-medium">{t('holderName')}:</span> {record.holderName}
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(record)}
                            className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                          >
                            <Pencil className="size-3.5 me-1.5" />
                            {t('editPolicy')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(record.id)}
                            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="size-3.5 me-1.5" />
                            {t('deleteConfirm').split('?')[0]}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? t('editPolicy') : t('addPolicy')}</DialogTitle>
            <DialogDescription>
              {editingRecord ? t('editPolicy') : t('addPolicy')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('name')} *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('namePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('type')} *</label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">{t('types.insurance')}</SelectItem>
                    <SelectItem value="bond">{t('types.bond')}</SelectItem>
                    <SelectItem value="certificate">{t('types.certificate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('policyNumber')} *</label>
                <Input
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder={t('policyNumberPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('provider')} *</label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder={t('providerPlaceholder')}
                />
              </div>
            </div>

            {/* Coverage Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground border-b pb-1">{t('coverageDetails')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('coverageAmount')}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.coverageAmount}
                      onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                      className="ps-9"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('premiumAmount')}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.premiumAmount}
                      onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                      className="ps-9"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('perOccurrenceLimit')}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.perOccurrenceLimit}
                      onChange={(e) => setFormData({ ...formData, perOccurrenceLimit: e.target.value })}
                      className="ps-9"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('aggregateLimit')}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.aggregateLimit}
                      onChange={(e) => setFormData({ ...formData, aggregateLimit: e.target.value })}
                      className="ps-9"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('deductible')}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.deductible}
                      onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
                      className="ps-9"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('issueDate')} *</label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('expirationDate')} *</label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>

            {/* Holder */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holderName')}</label>
              <Input
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                placeholder={t('holderNamePlaceholder')}
              />
            </div>

            {/* Endorsements */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground border-b pb-1">{t('endorsements')}</h4>

              {/* Endorsement toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">{t('additionalInsured')}</Label>
                    <p className="text-xs text-muted-foreground">AI</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.additionalInsured}
                    onClick={() => setFormData({ ...formData, additionalInsured: !formData.additionalInsured })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      formData.additionalInsured ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        formData.additionalInsured ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">{t('primaryNoncontrib')}</Label>
                    <p className="text-xs text-muted-foreground">PNC</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.primaryNoncontrib}
                    onClick={() => setFormData({ ...formData, primaryNoncontrib: !formData.primaryNoncontrib })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      formData.primaryNoncontrib ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        formData.primaryNoncontrib ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">{t('waiverSubrogation')}</Label>
                    <p className="text-xs text-muted-foreground">WoS</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.waiverSubrogation}
                    onClick={() => setFormData({ ...formData, waiverSubrogation: !formData.waiverSubrogation })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      formData.waiverSubrogation ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        formData.waiverSubrogation ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* CG Endorsement Types */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endorsementType')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ENDORSEMENT_OPTIONS.filter(e => e.value.startsWith('CG_')).map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={formData.endorsementTypes.includes(option.value)}
                        onCheckedChange={() => toggleEndorsement(option.value, 'endorsementTypes')}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('notes')}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>

            {/* Auto Renew */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <label className="text-sm font-medium">{t('autoRenew')}</label>
                <p className="text-xs text-muted-foreground">{t('autoRenewEnabled')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.autoRenew}
                onClick={() => setFormData({ ...formData, autoRenew: !formData.autoRenew })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  formData.autoRenew ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    formData.autoRenew ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Compliance Requirements (Collapsible) */}
            <div className="rounded-lg border overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                onClick={() => setShowRequirements(!showRequirements)}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold">{t('complianceRequirements')}</span>
                </div>
                {showRequirements ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {showRequirements && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 space-y-4 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('requiredCoverage')}</label>
                          <div className="relative">
                            <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={formData.requiredCoverage}
                              onChange={(e) => setFormData({ ...formData, requiredCoverage: e.target.value })}
                              className="ps-9"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('perOccurrenceLimit')}</label>
                          <div className="relative">
                            <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={formData.requiredPerOccurrence}
                              onChange={(e) => setFormData({ ...formData, requiredPerOccurrence: e.target.value })}
                              className="ps-9"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('aggregateLimit')}</label>
                          <div className="relative">
                            <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={formData.requiredAggregate}
                              onChange={(e) => setFormData({ ...formData, requiredAggregate: e.target.value })}
                              className="ps-9"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Required Endorsements */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('endorsementType')} ({t('complianceRequirements')})</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ENDORSEMENT_OPTIONS.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={formData.requiredEndorsements.includes(option.value)}
                                onCheckedChange={() => toggleEndorsement(option.value, 'requiredEndorsements')}
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {saving ? (
                <RefreshCw className="size-4 me-2 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 me-2" />
              )}
              {saving ? 'Saving...' : t('saveSuccess').split(' ')[0] || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <RefreshCw className="size-4 animate-spin" /> : t('deleteConfirm').split('?')[0] || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
