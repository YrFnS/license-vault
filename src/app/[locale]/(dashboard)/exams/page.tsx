'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  GraduationCap, Plus, Calendar, Clock, Trophy, XCircle,
  AlertCircle, CheckCircle2, Timer, BookOpen, ChevronDown,
  X, Trash2, Edit2
} from 'lucide-react';
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
import { toast } from 'sonner';

interface ExamRecord {
  id: string;
  examType: string;
  examName: string;
  examProvider: string | null;
  state: string | null;
  status: string;
  examDate: string | null;
  score: number | null;
  passingScore: number | null;
  resultsReceived: string | null;
  registrationId: string | null;
  studyHours: number;
  notes: string | null;
  qualifierId: string | null;
  qualifier: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ExamStats {
  total: number;
  passed: number;
  failed: number;
  scheduled: number;
  passRate: number;
}

const EXAM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  nascla_general: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  nascla_electrical: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  nascla_plumbing: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  nascla_hvac: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  state_specific: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  trade_exam: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' },
  passed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  expired: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400' },
};

function getCountdown(examDate: string): string | null {
  const now = new Date();
  const date = new Date(examDate);
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return null;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days away`;
}

export default function ExamsPage() {
  const t = useTranslations('exams');
  const tc = useTranslations('common');

  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [stats, setStats] = useState<ExamStats>({ total: 0, passed: 0, failed: 0, scheduled: 0, passRate: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [qualifiers, setQualifiers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  const fetchExams = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/exams?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams);
        setStats(data.stats);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetch('/api/qualifiers')
      .then(r => r.ok ? r.json() : { qualifiers: [] })
      .then(d => setQualifiers(d.qualifiers || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (formData: FormData) => {
    try {
      const body: any = {
        examType: formData.get('examType'),
        examName: formData.get('examName'),
        examProvider: formData.get('examProvider') || null,
        state: formData.get('state') || null,
        examDate: formData.get('examDate') || null,
        qualifierId: formData.get('qualifierId') || null,
        notes: formData.get('notes') || null,
      };
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(t('createSuccess'));
        setCreateOpen(false);
        fetchExams();
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
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('deleteSuccess'));
        fetchExams();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const filteredExams = exams;

  const upcomingExams = exams
    .filter(e => e.status === 'scheduled' && e.examDate && new Date(e.examDate) > new Date())
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())
    .slice(0, 5);

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
            <GraduationCap className="size-6 text-emerald-600" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-4 me-2" />
          {t('createExam')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
        {[
          { label: t('totalExams'), value: stats.total, icon: GraduationCap, color: 'from-teal-50 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10', border: 'border-s-teal-500', iconColor: 'text-teal-600' },
          { label: t('scheduled'), value: stats.scheduled, icon: Clock, color: 'from-sky-50 via-sky-50/60 to-sky-100/40 dark:from-sky-950/40 dark:via-sky-950/20 dark:to-sky-900/10', border: 'border-s-sky-500', iconColor: 'text-sky-600' },
          { label: t('passed'), value: stats.passed, icon: CheckCircle2, color: 'from-emerald-50 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10', border: 'border-s-emerald-500', iconColor: 'text-emerald-600' },
          { label: t('failed'), value: stats.failed, icon: XCircle, color: 'from-red-50 via-red-50/60 to-red-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10', border: 'border-s-red-500', iconColor: 'text-red-600' },
          { label: t('passRate'), value: `${stats.passRate}%`, icon: Trophy, color: 'from-amber-50 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10', border: 'border-s-amber-500', iconColor: 'text-amber-600' },
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

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="size-4 text-amber-500" />
              {t('upcomingExams')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingExams.map(exam => (
                <div
                  key={exam.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50/80 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30"
                >
                  <div className="shrink-0 flex flex-col items-center bg-amber-100 dark:bg-amber-900/40 rounded-lg p-2 min-w-[3.5rem]">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {new Date(exam.examDate!).toLocaleDateString('en', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {new Date(exam.examDate!).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{exam.examName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCountdown(exam.examDate!) || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">{tc('status')}: All</TabsTrigger>
          <TabsTrigger value="scheduled">{t('scheduled')}</TabsTrigger>
          <TabsTrigger value="passed">{t('passed')}</TabsTrigger>
          <TabsTrigger value="failed">{t('failed')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Exam List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <GraduationCap className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-muted-foreground">{t('noExams')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noExamsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-32rem)]">
          <div className="grid gap-3">
            {filteredExams.map((exam, idx) => {
              const typeColor = EXAM_TYPE_COLORS[exam.examType] || EXAM_TYPE_COLORS.trade_exam;
              const statusColor = STATUS_COLORS[exam.status] || STATUS_COLORS.scheduled;
              const passed = exam.status === 'passed' || (exam.score !== null && exam.passingScore !== null && exam.score >= exam.passingScore);
              const failed = exam.status === 'failed' || (exam.score !== null && exam.passingScore !== null && exam.score < exam.passingScore);

              return (
                <motion.div key={exam.id} {...fadeIn} transition={{ delay: idx * 0.03 }}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Exam info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{exam.examName}</h3>
                            <Badge className={`${typeColor.bg} ${typeColor.text} text-[10px] border-0`}>
                              {t(exam.examType as any)}
                            </Badge>
                            <Badge className={`${statusColor.bg} ${statusColor.text} text-[10px] border-0`}>
                              {t(exam.status as any)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {exam.examProvider && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="size-3" /> {exam.examProvider}
                              </span>
                            )}
                            {exam.state && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                {exam.state}
                              </Badge>
                            )}
                            {exam.examDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Date(exam.examDate).toLocaleDateString()}
                                {exam.status === 'scheduled' && getCountdown(exam.examDate) && (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    ({getCountdown(exam.examDate)})
                                  </span>
                                )}
                              </span>
                            )}
                            {exam.qualifier && (
                              <span>Qualifier: {exam.qualifier.firstName} {exam.qualifier.lastName}</span>
                            )}
                            {exam.studyHours > 0 && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="size-3" /> {exam.studyHours}h
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score display */}
                        <div className="flex items-center gap-3 shrink-0">
                          {exam.score !== null && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${passed ? 'text-emerald-600' : failed ? 'text-red-600' : ''}`}>
                                {exam.score}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                / {exam.passingScore || '—'}
                              </div>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(exam.id)}
                          >
                            <Trash2 className="size-3.5" />
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

      {/* Create Exam Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-emerald-600" />
              {t('createExam')}
            </DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('examType')}</Label>
                <Select name="examType" defaultValue="nascla_general">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nascla_general">{t('nasclaGeneral')}</SelectItem>
                    <SelectItem value="nascla_electrical">{t('nasclaElectrical')}</SelectItem>
                    <SelectItem value="nascla_plumbing">{t('nasclaPlumbing')}</SelectItem>
                    <SelectItem value="nascla_hvac">{t('nasclaHVAC')}</SelectItem>
                    <SelectItem value="state_specific">{t('stateSpecific')}</SelectItem>
                    <SelectItem value="trade_exam">{t('tradeExam')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('examName')}</Label>
                <Input name="examName" placeholder="e.g., NASCLA General Building" required />
              </div>
              <div className="space-y-2">
                <Label>{t('examProvider')}</Label>
                <Select name="examProvider">
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PSI">PSI</SelectItem>
                    <SelectItem value="Prometric">Prometric</SelectItem>
                    <SelectItem value="ICC">ICC</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('state')}</Label>
                <Input name="state" placeholder="e.g., CA" />
              </div>
              <div className="space-y-2">
                <Label>{t('examDate')}</Label>
                <Input name="examDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>{t('linkQualifier')}</Label>
                <Select name="qualifierId">
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {qualifiers.map(q => (
                      <SelectItem key={q.id} value={q.id}>{q.firstName} {q.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
