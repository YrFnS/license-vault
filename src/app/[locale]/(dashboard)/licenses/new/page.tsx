'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Loader2,
  Clock,
  DollarSign,
  FileCheck,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Building2,
  StickyNote,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const LICENSE_TYPES = [
  'general_contractor',
  'electrical',
  'plumbing',
  'hvac',
  'roofing',
] as const;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY',
];

const createLicenseSchema = z.object({
  name: z.string().min(1, 'License name is required'),
  type: z.string().min(1, 'License type is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  issuedBy: z.string().min(1, 'Issuing authority is required'),
  state: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  notes: z.string().optional(),
});

type CreateLicenseForm = z.infer<typeof createLicenseSchema>;

interface SuggestedRequirement {
  id: string;
  state: string;
  licenseType: string;
  renewPeriodMonths: number;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  bondAmountMin: number;
  insuranceRequired: boolean;
  boardName: string | null;
  boardUrl: string | null;
  boardPhone: string | null;
  notes: string | null;
  reciprocityStates: string[];
  nasclaAccepted: boolean;
}

export default function NewLicensePage() {
  const t = useTranslations('licenses.form');
  const tc = useTranslations('common');
  const tSr = useTranslations('stateRequirements');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [suggestedRequirements, setSuggestedRequirements] = useState<SuggestedRequirement[]>([]);

  const form = useForm<CreateLicenseForm>({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: {
      name: '',
      type: '',
      licenseNumber: '',
      issuedBy: '',
      state: '',
      issueDate: '',
      expirationDate: '',
      notes: '',
    },
  });

  const formatCurrency = (min: number, max: number) => {
    if (min === 0 && max === 0) return '—';
    if (min === max) return `$${min}`;
    return `$${min} – $${max}`;
  };

  const formatBondAmount = (amount: number) => {
    if (amount === 0) return '—';
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
    return `$${amount}`;
  };

  const onSubmit = async (data: CreateLicenseForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create license');
      }

      const json = await res.json();
      toast.success('License created successfully');

      // Show suggested requirements if any
      if (json.suggestedRequirements && json.suggestedRequirements.length > 0) {
        setSuggestedRequirements(json.suggestedRequirements);
      } else {
        router.push('/licenses');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create license');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">{tc('back')}</span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t('name')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{tc('create')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type + License Number - Two columns on desktop */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('type')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('typePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LICENSE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {tSr(`licenseTypes.${type}` as any) !== `licenseTypes.${type}`
                                  ? tSr(`licenseTypes.${type}` as any)
                                  : type.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('licenseNumber')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('licenseNumberPlaceholder')}
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* State + Issued By */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tSr('state')}</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select state (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {tSr(`states.${state}` as any) !== `states.${state}`
                                  ? `${tSr(`states.${state}` as any)} (${state})`
                                  : state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('issuedBy')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('issuedByPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Issue Date + Expiration Date - Two columns on desktop */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('issueDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" dir="ltr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('expirationDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" dir="ltr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('notesPlaceholder')}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    {tc('cancel')}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 me-1 animate-spin" />}
                    {tc('create')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Suggested Requirements Card (shows after creation) */}
        <div className="lg:col-span-1">
          <AnimatePresence>
            {suggestedRequirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50/80 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/10 sticky top-24">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                        <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-base">State Requirements</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requirements matched for your license
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {suggestedRequirements.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-lg bg-white/70 dark:bg-background/50 border border-border/50 p-4 space-y-3"
                      >
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Renewal:</span>
                            <span className="font-medium">{req.renewPeriodMonths} months</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <FileCheck className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">CE:</span>
                            <span className="font-medium">{req.ceHoursRequired > 0 ? `${req.ceHoursRequired}h` : 'None'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <DollarSign className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Fees:</span>
                            <span className="font-medium">{formatCurrency(req.renewalFeeMin, req.renewalFeeMax)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Shield className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {req.bondRequired
                                ? `Bond: ${formatBondAmount(req.bondAmountMin)}`
                                : req.insuranceRequired
                                ? 'Ins. Required'
                                : 'No bond/ins.'}
                            </span>
                          </div>
                        </div>

                        {/* Bond & Insurance badges */}
                        <div className="flex gap-1.5 flex-wrap">
                          {req.bondRequired && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0">
                              Bond {req.bondAmountMin > 0 ? `(${formatBondAmount(req.bondAmountMin)})` : ''}
                            </Badge>
                          )}
                          {req.insuranceRequired && (
                            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-[10px] px-1.5 py-0">
                              Insurance
                            </Badge>
                          )}
                          {req.nasclaAccepted && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0">
                              NASCLA
                            </Badge>
                          )}
                        </div>

                        {/* Board Info */}
                        {req.boardName && (
                          <div className="pt-2 border-t border-border/50 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Building2 className="size-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground truncate">{req.boardName}</span>
                            </div>
                            {req.boardPhone && (
                              <a
                                href={`tel:${req.boardPhone}`}
                                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <Phone className="size-3 shrink-0" />
                                {req.boardPhone}
                              </a>
                            )}
                            {req.boardUrl && (
                              <a
                                href={req.boardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <ExternalLink className="size-3 shrink-0" />
                                Visit Website
                              </a>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {req.notes && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <StickyNote className="size-3 mt-0.5 shrink-0" />
                              {req.notes}
                            </p>
                          </div>
                        )}

                        {/* Reciprocity */}
                        {req.reciprocityStates && req.reciprocityStates.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">Reciprocity with:</p>
                            <div className="flex gap-1 flex-wrap">
                              {req.reciprocityStates.map((s) => (
                                <Badge key={s} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => router.push('/licenses')}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      >
                        <CheckCircle2 className="size-4 me-1" />
                        Go to Licenses
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/state-requirements')}
                      >
                        View All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - hint about auto-match */}
          {suggestedRequirements.length === 0 && (
            <Card className="border-dashed border-border/50 bg-muted/20">
              <CardContent className="p-4 text-center">
                <Shield className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Auto-Match Requirements</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Select a state and license type to see applicable requirements after creation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
