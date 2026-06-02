'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { InsuranceRecord, FormData } from './types';
import { ENDORSEMENT_OPTIONS } from './constants';

interface InsuranceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecord: InsuranceRecord | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showRequirements: boolean;
  setShowRequirements: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
  onSave: () => void;
  toggleEndorsement: (value: string, field: 'endorsementTypes' | 'requiredEndorsements') => void;
  t: (key: string) => string;
}

export default function InsuranceFormDialog({
  open,
  onOpenChange,
  editingRecord,
  formData,
  setFormData,
  showRequirements,
  setShowRequirements,
  saving,
  onSave,
  toggleEndorsement,
  t,
}: InsuranceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onSave}
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
  );
}
