'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Shield, AlertTriangle, XCircle,
  ChevronRight, FileText, DollarSign, UserCheck, Trash2
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface EntityRecord {
  id: string;
  name: string;
  entityType: string;
  formationState: string | null;
  entityStatus: string;
  complianceScore: number;
  annualReportDue: string | null;
  franchiseTaxDue: string | null;
  parent: { id: string; name: string } | null;
  subsidiaries: { id: string; name: string }[];
  _count: { licenses: number };
  createdAt: string;
}

interface EntityStats {
  total: number;
  active: number;
  atRisk: number;
  inactive: number;
}

const ENTITY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  llc: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  corporation: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  sole_proprietor: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  partnership: { bg: 'bg-slate-200 dark:bg-slate-700/30', text: 'text-slate-700 dark:text-slate-300' },
  llp: { bg: 'bg-slate-200 dark:bg-slate-700/30', text: 'text-slate-700 dark:text-slate-300' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  dissolved: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  suspended: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  revoked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

function ComplianceRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative size-10 shrink-0">
      <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle
          cx="20" cy="20" r={radius} fill="none" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${color}`}>
        {score}
      </span>
    </div>
  );
}

export default function BusinessEntitiesPage() {
  const t = useTranslations('businessEntities');
  const tc = useTranslations('common');

  const [entities, setEntities] = useState<EntityRecord[]>([]);
  const [stats, setStats] = useState<EntityStats>({ total: 0, active: 0, atRisk: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchEntities = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('entityStatus', statusFilter);
      if (typeFilter !== 'all') params.set('entityType', typeFilter);
      const res = await fetch(`/api/business-entities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities);
        setStats(data.stats);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, t]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleCreate = async (formData: FormData) => {
    try {
      const body: any = {
        name: formData.get('name'),
        entityType: formData.get('entityType'),
        formationState: formData.get('formationState') || null,
        formationDate: formData.get('formationDate') || null,
        ein: formData.get('ein') || null,
        registeredAgent: formData.get('registeredAgent') || null,
        notes: formData.get('notes') || null,
      };
      const res = await fetch('/api/business-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(t('createSuccess'));
        setCreateOpen(false);
        fetchEntities();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/business-entities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('deleteSuccess'));
        fetchEntities();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="size-6 text-emerald-600" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-4 me-2" />
          {t('createEntity')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: t('totalEntities'), value: stats.total, icon: Building2, color: 'from-teal-50 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40', border: 'border-s-teal-500', iconColor: 'text-teal-600' },
          { label: t('active'), value: stats.active, icon: Shield, color: 'from-emerald-50 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40', border: 'border-s-emerald-500', iconColor: 'text-emerald-600' },
          { label: t('atRisk'), value: stats.atRisk, icon: AlertTriangle, color: 'from-amber-50 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40', border: 'border-s-amber-500', iconColor: 'text-amber-600' },
          { label: t('inactive'), value: stats.inactive, icon: XCircle, color: 'from-red-50 via-red-50/60 to-red-100/40 dark:from-red-950/40', border: 'border-s-red-500', iconColor: 'text-red-600' },
        ].map((stat, idx) => (
          <motion.div key={idx} {...fadeIn} transition={{ delay: idx * 0.05 }}>
            <Card className={`bg-gradient-to-br ${stat.color} border-s-4 ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`size-8 ${stat.iconColor} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">{t('active')}</TabsTrigger>
            <TabsTrigger value="suspended">{t('suspended')}</TabsTrigger>
            <TabsTrigger value="dissolved">{t('dissolved')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('entityType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="llc">{t('llc')}</SelectItem>
            <SelectItem value="corporation">{t('corporation')}</SelectItem>
            <SelectItem value="sole_proprietor">{t('soleProprietor')}</SelectItem>
            <SelectItem value="partnership">{t('partnership')}</SelectItem>
            <SelectItem value="llp">{t('llp')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entity List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-24 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : entities.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <Building2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-muted-foreground">{t('noEntities')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noEntitiesDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-30rem)]">
          <div className="grid gap-3">
            {entities.map((entity, idx) => {
              const typeColor = ENTITY_TYPE_COLORS[entity.entityType] || ENTITY_TYPE_COLORS.llc;
              const statusColor = STATUS_COLORS[entity.entityStatus] || STATUS_COLORS.active;
              const now = new Date();
              const arDue = entity.annualReportDue ? new Date(entity.annualReportDue) : null;
              const ftDue = entity.franchiseTaxDue ? new Date(entity.franchiseTaxDue) : null;
              const arOverdue = arDue && arDue < now;
              const ftOverdue = ftDue && ftDue < now;

              return (
                <motion.div key={entity.id} {...fadeIn} transition={{ delay: idx * 0.03 }}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Compliance Ring */}
                        <ComplianceRing score={entity.complianceScore} />

                        {/* Entity Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Link href={`/business-entities/${entity.id}`} className="font-semibold text-sm hover:text-emerald-600 transition-colors">
                              {entity.name}
                            </Link>
                            <Badge className={`${typeColor.bg} ${typeColor.text} text-[10px] border-0`}>
                              {t(entity.entityType as any)}
                            </Badge>
                            <Badge className={`${statusColor.bg} ${statusColor.text} text-[10px] border-0`}>
                              {t(entity.entityStatus as any)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {entity.formationState && (
                              <Badge variant="outline" className="text-[10px] py-0">{entity.formationState}</Badge>
                            )}
                            {entity._count.licenses > 0 && (
                              <span>{t('linkedLicensesCount', { count: entity._count.licenses })}</span>
                            )}
                            {arDue && (
                              <span className={`flex items-center gap-1 ${arOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                                <FileText className="size-3" />
                                {t('annualReport')}: {arOverdue ? t('overdue') : arDue.toLocaleDateString()}
                              </span>
                            )}
                            {ftDue && (
                              <span className={`flex items-center gap-1 ${ftOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                                <DollarSign className="size-3" />
                                {t('franchiseTax')}: {ftOverdue ? t('overdue') : ftDue.toLocaleDateString()}
                              </span>
                            )}
                            {entity.subsidiaries.length > 0 && (
                              <span>{t('subsidiaries')}: {entity.subsidiaries.length}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entity.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                          <Link href={`/business-entities/${entity.id}`}>
                            <Button variant="ghost" size="icon" className="size-8 text-emerald-600">
                              <ChevronRight className="size-4" />
                            </Button>
                          </Link>
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

      {/* Create Entity Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-emerald-600" />
              {t('createEntity')}
            </DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('entityName')}</Label>
                <Input name="name" placeholder="e.g., Acme Construction LLC" required />
              </div>
              <div className="space-y-2">
                <Label>{t('entityType')}</Label>
                <Select name="entityType" defaultValue="llc">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llc">{t('llc')}</SelectItem>
                    <SelectItem value="corporation">{t('corporation')}</SelectItem>
                    <SelectItem value="sole_proprietor">{t('soleProprietor')}</SelectItem>
                    <SelectItem value="partnership">{t('partnership')}</SelectItem>
                    <SelectItem value="llp">{t('llp')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('formationState')}</Label>
                <Input name="formationState" placeholder="e.g., DE" />
              </div>
              <div className="space-y-2">
                <Label>{t('formationDate')}</Label>
                <Input name="formationDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>{t('ein')}</Label>
                <Input name="ein" placeholder="e.g., XX-XXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>{t('registeredAgent')}</Label>
                <Input name="registeredAgent" placeholder="Agent name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea name="notes" placeholder="Additional notes..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {tc('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
