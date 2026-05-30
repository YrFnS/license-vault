'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  User,
  Building2,
  ClipboardList,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSession } from 'next-auth/react';

interface ApplicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (application: any) => void;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

const LICENSE_TYPES = [
  'General Contractor',
  'Electrical Contractor',
  'Plumbing Contractor',
  'HVAC Contractor',
  'Roofing Contractor',
  'Concrete Contractor',
  'Painting Contractor',
  'Landscaping Contractor',
  'Drywall Contractor',
  'Masonry Contractor',
  'Carpentry Contractor',
  'Excavation Contractor',
  'Fire Protection',
  'Low Voltage',
  'Solar Contractor',
  'Other',
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function ApplicationWizard({ open, onOpenChange, onSuccess }: ApplicationWizardProps) {
  const t = useTranslations('licenseApplications');
  const tc = useTranslations('common');
  const { data: session } = useSession();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stateRequirements, setStateRequirements] = useState<any>(null);

  const [form, setForm] = useState({
    licenseType: '',
    state: '',
    applicationType: 'new' as 'new' | 'renewal' | 'reciprocity',
    applicantName: '',
    businessName: '',
    boardName: '',
    boardUrl: '',
    targetDate: '',
    estimatedCost: 0,
    notes: '',
  });

  // Auto-fill applicant name from session
  useEffect(() => {
    if (session?.user?.name && !form.applicantName) {
      setForm(f => ({ ...f, applicantName: session.user.name || '' }));
    }
  }, [session]);

  // Auto-fetch state requirements when state+type selected
  useEffect(() => {
    if (form.state && form.licenseType) {
      fetch(`/api/state-requirements?state=${form.state}`)
        .then(r => r.json())
        .then(data => {
          const req = data.requirements?.find((r: any) =>
            r.licenseType?.toLowerCase().includes(form.licenseType.toLowerCase()) ||
            form.licenseType.toLowerCase().includes(r.licenseType?.toLowerCase())
          );
          if (req) {
            setStateRequirements(req);
            setForm(f => ({
              ...f,
              boardName: req.boardName || f.boardName,
              boardUrl: req.boardUrl || f.boardUrl,
              estimatedCost: req.renewalFeeMax || 0,
            }));
          }
        })
        .catch(() => {});
    }
  }, [form.state, form.licenseType]);

  const steps = [
    { icon: FileCheck2, label: t('step1Title') },
    { icon: User, label: t('step2Title') },
    { icon: Building2, label: t('step3Title') },
    { icon: ClipboardList, label: t('step4Title') },
    { icon: CheckCircle2, label: t('step5Title') },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const canNext = () => {
    switch (step) {
      case 0: return form.licenseType && form.state;
      case 1: return form.applicantName;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generate checklist items based on state requirements
      const checklistItems = [
        { id: '1', label: 'Complete application form', completed: false, required: true },
        { id: '2', label: 'Submit proof of experience', completed: false, required: true },
        { id: '3', label: 'Provide license fee payment', completed: false, required: true },
        { id: '4', label: 'Submit insurance documentation', completed: false, required: stateRequirements?.insuranceRequired || false },
        { id: '5', label: 'Submit bond documentation', completed: false, required: stateRequirements?.bondRequired || false },
        { id: '6', label: 'Complete CE hours verification', completed: false, required: (stateRequirements?.ceHoursRequired || 0) > 0 },
        { id: '7', label: 'Background check clearance', completed: false, required: false },
      ];

      const res = await fetch('/api/license-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          checklistData: JSON.stringify({ items: checklistItems }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create application');
      }

      const data = await res.json();
      onSuccess?.(data.application);
      handleReset();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Create application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setForm({
      licenseType: '',
      state: '',
      applicationType: 'new',
      applicantName: session?.user?.name || '',
      businessName: '',
      boardName: '',
      boardUrl: '',
      targetDate: '',
      estimatedCost: 0,
      notes: '',
    });
    setStateRequirements(null);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('licenseType')} *</Label>
              <Select value={form.licenseType} onValueChange={v => setForm(f => ({ ...f, licenseType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('licenseType')} />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map(lt => (
                    <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('state')} *</Label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('state')} />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('applicationType')}</Label>
              <Select value={form.applicationType} onValueChange={v => setForm(f => ({ ...f, applicationType: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('newLicense')}</SelectItem>
                  <SelectItem value="renewal">{t('renewal')}</SelectItem>
                  <SelectItem value="reciprocity">{t('reciprocity')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('applicantName')} *</Label>
              <Input
                value={form.applicantName}
                onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))}
                placeholder={t('applicantName')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('businessName')}</Label>
              <Input
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                placeholder={t('businessName')}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('boardInfo')}</Label>
              <Input
                value={form.boardName}
                onChange={e => setForm(f => ({ ...f, boardName: e.target.value }))}
                placeholder="Board name"
              />
            </div>
            <div className="space-y-2">
              <Label>Board URL</Label>
              <Input
                value={form.boardUrl}
                onChange={e => setForm(f => ({ ...f, boardUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            {stateRequirements && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Auto-populated from state requirements</span>
                </div>
                {stateRequirements.ceHoursRequired > 0 && (
                  <p className="text-xs text-muted-foreground">CE Hours Required: {stateRequirements.ceHoursRequired}</p>
                )}
                {stateRequirements.renewalFeeMax > 0 && (
                  <p className="text-xs text-muted-foreground">Fee Range: ${stateRequirements.renewalFeeMin} - ${stateRequirements.renewalFeeMax}</p>
                )}
                {stateRequirements.bondRequired && (
                  <p className="text-xs text-muted-foreground">Bond Required: ${stateRequirements.bondAmountMin}</p>
                )}
                {stateRequirements.insuranceRequired && (
                  <p className="text-xs text-muted-foreground">Insurance Required</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('targetDate')}</Label>
              <Input
                type="date"
                value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('estimatedCost')}</Label>
              <Input
                type="number"
                value={form.estimatedCost}
                onChange={e => setForm(f => ({ ...f, estimatedCost: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={0.01}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('step4Desc')}</p>
            {[
              { id: '1', label: 'Complete application form', required: true },
              { id: '2', label: 'Submit proof of experience', required: true },
              { id: '3', label: 'Provide license fee payment', required: true },
              { id: '4', label: 'Submit insurance documentation', required: stateRequirements?.insuranceRequired || false },
              { id: '5', label: 'Submit bond documentation', required: stateRequirements?.bondRequired || false },
              { id: '6', label: 'Complete CE hours verification', required: (stateRequirements?.ceHoursRequired || 0) > 0 },
              { id: '7', label: 'Background check clearance', required: false },
            ].map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="size-5 rounded border border-border flex items-center justify-center bg-background" />
                <span className="text-sm flex-1">{item.label}</span>
                {item.required ? (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800">
                    {t('required')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                    {t('optional')}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('step5Desc')}</p>
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('licenseType')}</span>
                <span className="text-sm font-medium">{form.licenseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('state')}</span>
                <span className="text-sm font-medium">{form.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('applicationType')}</span>
                <span className="text-sm font-medium capitalize">{form.applicationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('applicantName')}</span>
                <span className="text-sm font-medium">{form.applicantName}</span>
              </div>
              {form.businessName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('businessName')}</span>
                  <span className="text-sm font-medium">{form.businessName}</span>
                </div>
              )}
              {form.boardName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('boardInfo')}</span>
                  <span className="text-sm font-medium">{form.boardName}</span>
                </div>
              )}
              {form.estimatedCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('estimatedCost')}</span>
                  <span className="text-sm font-medium">${form.estimatedCost.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="size-5 text-emerald-600" />
            {t('createNew')}
          </DialogTitle>
          <DialogDescription>{t('stepDescription')}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 py-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 flex-1 cursor-pointer"
                onClick={() => { if (i <= step) { setDirection(i > step ? 1 : -1); setStep(i); } }}
              >
                <div className={`flex items-center justify-center size-7 rounded-full shrink-0 transition-all ${
                  isActive ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' :
                  isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
                </div>
                <span className={`text-[11px] truncate hidden sm:block ${
                  isActive ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                }`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] rounded ${i < step ? 'bg-emerald-400' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[200px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="size-4 me-1" />
            {tc('back')}
          </Button>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canNext()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {tc('next')}
                <ChevronRight className="size-4 ms-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 me-1 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 me-1" />
                    {t('submit')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
