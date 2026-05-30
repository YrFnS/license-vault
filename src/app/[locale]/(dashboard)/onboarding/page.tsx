'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileText,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Loader2,
  LayoutDashboard,
  Plus,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Org info
  const [orgName, setOrgName] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [primaryState, setPrimaryState] = useState('');

  // Step 2: License info
  const [licenseName, setLicenseName] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Step 3: Alert preferences
  const [alert60, setAlert60] = useState(true);
  const [alert30, setAlert30] = useState(true);
  const [alert5, setAlert5] = useState(true);

  const steps = [
    { label: t('step1'), icon: Building2 },
    { label: t('step2'), icon: FileText },
    { label: t('step3'), icon: Bell },
    { label: t('step4'), icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const saveOrgInfo = async (): Promise<boolean> => {
    if (!orgName.trim()) return true; // Skip if empty
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          tradeType: tradeType || undefined,
          primaryState: primaryState || undefined,
        }),
      });
      if (res.ok) {
        toast.success(t('orgSetupSuccess'));
        return true;
      }
    } catch {
      // Non-blocking
    }
    return true;
  };

  const saveLicense = async (): Promise<boolean> => {
    if (!licenseName.trim()) return true; // Skip if empty
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: licenseName,
          type: licenseType || 'State License',
          licenseNumber: licenseNumber || 'PENDING',
          issuedBy: issuedBy || 'N/A',
          issueDate: new Date().toISOString().split('T')[0],
          expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        toast.success(t('licenseAdded'));
        return true;
      }
    } catch {
      // Non-blocking
    }
    return true;
  };

  const saveAlerts = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert60Days: alert60,
          alert30Days: alert30,
          alert5Days: alert5,
        }),
      });
      if (res.ok) {
        toast.success(t('alertSetupSuccess'));
        return true;
      }
    } catch {
      // Non-blocking
    }
    return true;
  };

  const handleStepNext = async () => {
    setLoading(true);
    if (currentStep === 0) {
      await saveOrgInfo();
    } else if (currentStep === 1) {
      await saveLicense();
    } else if (currentStep === 2) {
      await saveAlerts();
    }
    setLoading(false);
    handleNext();
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

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

  const [direction, setDirection] = useState(0);

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const goNext = async () => {
    setDirection(1);
    await handleStepNext();
  };

  const goBack = () => {
    setDirection(-1);
    handleBack();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="size-6 text-emerald-600" />
            <h1 className="text-2xl font-bold">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={index} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => index <= currentStep ? goToStep(index) : undefined}
                    className={`flex size-10 items-center justify-center rounded-full transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <StepIcon className="size-5" />
                    )}
                  </button>
                  <span className={`text-xs font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
          >
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Organization */}
                {currentStep === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">{t('step1Title')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('step1Desc')}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ob-orgName">{t('orgName')}</Label>
                        <Input
                          id="ob-orgName"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder={t('orgNamePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ob-tradeType">{t('tradeType')}</Label>
                        <Input
                          id="ob-tradeType"
                          value={tradeType}
                          onChange={(e) => setTradeType(e.target.value)}
                          placeholder={t('tradeTypePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ob-primaryState">{t('primaryState')}</Label>
                        <select
                          id="ob-primaryState"
                          value={primaryState}
                          onChange={(e) => setPrimaryState(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">{t('primaryStatePlaceholder')}</option>
                          {US_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: First License */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">{t('step2Title')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('step2Desc')}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ob-licenseName">{t('licenseName')}</Label>
                        <Input
                          id="ob-licenseName"
                          value={licenseName}
                          onChange={(e) => setLicenseName(e.target.value)}
                          placeholder={t('licenseNamePlaceholder')}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ob-licenseType">{t('licenseType')}</Label>
                          <Input
                            id="ob-licenseType"
                            value={licenseType}
                            onChange={(e) => setLicenseType(e.target.value)}
                            placeholder={t('licenseTypePlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ob-licenseNumber">{t('licenseNumber')}</Label>
                          <Input
                            id="ob-licenseNumber"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder={t('licenseNumberPlaceholder')}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ob-issuedBy">{t('issuedBy')}</Label>
                        <Input
                          id="ob-issuedBy"
                          value={issuedBy}
                          onChange={(e) => setIssuedBy(e.target.value)}
                          placeholder={t('issuedByPlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ob-expirationDate">{t('expirationDate')}</Label>
                        <Input
                          id="ob-expirationDate"
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Alert Preferences */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">{t('step3Title')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('step3Desc')}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{t('alert60')}</p>
                        </div>
                        <Switch
                          checked={alert60}
                          onCheckedChange={setAlert60}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{t('alert30')}</p>
                        </div>
                        <Switch
                          checked={alert30}
                          onCheckedChange={setAlert30}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{t('alert5')}</p>
                        </div>
                        <Switch
                          checked={alert5}
                          onCheckedChange={setAlert5}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: All Done */}
                {currentStep === 3 && (
                  <div className="space-y-5 text-center">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-4">
                        <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{t('step4Title')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('step4Desc')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <LayoutDashboard className="size-6 text-emerald-600" />
                        <span className="text-sm font-medium">{t('goDashboard')}</span>
                      </button>
                      <button
                        onClick={() => router.push('/licenses/new')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Plus className="size-6 text-emerald-600" />
                        <span className="text-sm font-medium">{t('addMoreLicenses')}</span>
                      </button>
                      <button
                        onClick={() => router.push('/ai-chat')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Bot className="size-6 text-emerald-600" />
                        <span className="text-sm font-medium">{t('exploreAI')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={goBack}
                disabled={loading}
              >
                <ArrowLeft className="size-4 me-1.5 rtl:rotate-180" />
                {t('back')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 && currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="text-muted-foreground"
              >
                <SkipForward className="size-4 me-1.5" />
                {t('skip')}
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={goNext}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin me-1.5" />
                ) : (
                  <ArrowRight className="size-4 me-1.5 rtl:rotate-180" />
                )}
                {t('next')}
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {t('finish')}
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="text-center mt-4">
          <Badge variant="outline" className="text-xs">
            {currentStep + 1} / {steps.length}
          </Badge>
        </div>
      </div>
    </div>
  );
}
