'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApplicationWizard } from '@/components/applications/ApplicationWizard';
import { toast } from 'sonner';

interface ApplicationDoc {
  id: string;
  fileName: string;
  category: string;
  required: boolean;
}

interface Application {
  id: string;
  licenseType: string;
  state: string;
  applicantName: string;
  businessName: string | null;
  applicationType: string;
  status: string;
  boardName: string | null;
  submittedDate: string | null;
  targetDate: string | null;
  estimatedCost: number;
  createdAt: string;
  documents: ApplicationDoc[];
}

interface AppCounts {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  denied: number;
  withdrawn: number;
}

const statusConfig: Record<string, { color: string; icon: any; bg: string }> = {
  draft: { color: 'text-slate-600 dark:text-slate-400', icon: FileText, bg: 'bg-slate-100 dark:bg-slate-800' },
  submitted: { color: 'text-blue-600 dark:text-blue-400', icon: ArrowUpRight, bg: 'bg-blue-100 dark:bg-blue-900/30' },
  under_review: { color: 'text-amber-600 dark:text-amber-400', icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30' },
  approved: { color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  denied: { color: 'text-red-600 dark:text-red-400', icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30' },
  withdrawn: { color: 'text-gray-500 dark:text-gray-400', icon: AlertCircle, bg: 'bg-gray-100 dark:bg-gray-800' },
};

export default function LicenseApplicationsPage() {
  const t = useTranslations('licenseApplications');
  const tc = useTranslations('common');
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<AppCounts>({ total: 0, draft: 0, submitted: 0, under_review: 0, approved: 0, denied: 0, withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.set('applicationType', typeFilter);

      const res = await fetch(`/api/license-applications?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplications(data.applications || []);
      setCounts(data.counts || { total: 0, draft: 0, submitted: 0, under_review: 0, approved: 0, denied: 0, withdrawn: 0 });
    } catch (err) {
      console.error('Fetch applications error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApps = applications.filter(app => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      app.licenseType.toLowerCase().includes(s) ||
      app.state.toLowerCase().includes(s) ||
      app.applicantName.toLowerCase().includes(s) ||
      (app.businessName || '').toLowerCase().includes(s)
    );
  });

  const statCards = [
    { key: 'total', label: tc('status'), value: counts.total, color: 'from-teal-50 to-teal-100/40 dark:from-teal-950/40 dark:to-teal-900/20', accent: 'border-teal-400', icon: FileCheck2 },
    { key: 'draft', label: t('draft'), value: counts.draft, color: 'from-slate-50 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-700/20', accent: 'border-slate-400', icon: FileText },
    { key: 'submitted', label: t('submitted'), value: counts.submitted, color: 'from-blue-50 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20', accent: 'border-blue-400', icon: ArrowUpRight },
    { key: 'approved', label: t('approved'), value: counts.approved, color: 'from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20', accent: 'border-emerald-400', icon: CheckCircle2 },
    { key: 'denied', label: t('denied'), value: counts.denied, color: 'from-red-50 to-red-100/40 dark:from-red-950/40 dark:to-red-900/20', accent: 'border-red-400', icon: XCircle },
  ];

  const handleWizardSuccess = (app: any) => {
    toast.success(t('createSuccess'));
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck2 className="size-6 text-emerald-600" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md shadow-emerald-500/15"
        >
          <Plus className="size-4" />
          {t('createNew')}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`bg-gradient-to-br ${card.color} border-s-4 ${card.accent} hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => setStatusFilter(card.key === 'total' ? 'all' : card.key)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
                    <Icon className="size-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-2xl lg:text-3xl font-extrabold tabular-nums">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tc('search')}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="size-4 me-2" />
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc('status')} - All</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
            <SelectItem value="submitted">{t('submitted')}</SelectItem>
            <SelectItem value="under_review">{t('underReview')}</SelectItem>
            <SelectItem value="approved">{t('approved')}</SelectItem>
            <SelectItem value="denied">{t('denied')}</SelectItem>
            <SelectItem value="withdrawn">{t('withdrawn')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t('applicationType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="new">{t('newLicense')}</SelectItem>
            <SelectItem value="renewal">{t('renewal')}</SelectItem>
            <SelectItem value="reciprocity">{t('reciprocity')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredApps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck2 className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{t('noApplications')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noApplicationsDesc')}</p>
            <Button
              onClick={() => setWizardOpen(true)}
              variant="outline"
              className="mt-4 gap-2"
            >
              <Plus className="size-4" />
              {t('createNew')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {filteredApps.map((app, idx) => {
              const config = statusConfig[app.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              // Parse checklist for progress
              let checklistProgress = null;
              try {
                // We don't have checklistData in the list, show doc count
                const docCount = app.documents?.length || 0;
                checklistProgress = { docCount };
              } catch {}

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Card
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/license-applications/${app.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center size-10 rounded-xl ${config.bg} shrink-0`}>
                          <StatusIcon className={`size-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{app.licenseType}</h3>
                            <Badge variant="outline" className="text-[10px]">{app.state}</Badge>
                            <Badge className={`text-[10px] ${config.bg} ${config.color} border-0`}>
                              {t(app.status as any)}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {t(app.applicationType as any) || app.applicationType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>{app.applicantName}</span>
                            {app.businessName && <span>• {app.businessName}</span>}
                            {app.submittedDate && <span>• {new Date(app.submittedDate).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.estimatedCost > 0 && (
                            <span className="text-xs text-muted-foreground">${app.estimatedCost.toFixed(0)}</span>
                          )}
                          <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Application Wizard */}
      <ApplicationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
      />
    </div>
  );
}
