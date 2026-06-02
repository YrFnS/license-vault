'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { VendorFormData } from '../types';

interface CreateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: VendorFormData;
  setForm: (updater: VendorFormData | ((prev: VendorFormData) => VendorFormData)) => void;
  subcontractors: { id: string; companyName: string }[];
  onSubmit: () => void;
}

export function CreateVendorDialog({ open, onOpenChange, form, setForm, subcontractors, onSubmit }: CreateVendorDialogProps) {
  const t = useTranslations('vendorScores');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-500" /> {t('addVendor')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('vendorName')} *</Label>
              <Input value={form.vendorName} onChange={e => setForm((p: VendorFormData) => ({ ...p, vendorName: e.target.value }))} placeholder="Acme Construction" />
            </div>
            <div className="space-y-2">
              <Label>{t('vendorEmail')}</Label>
              <Input type="email" value={form.vendorEmail} onChange={e => setForm((p: VendorFormData) => ({ ...p, vendorEmail: e.target.value }))} placeholder="vendor@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{t('selectSubcontractor')}</Label>
              <Select value={form.subcontractorId || 'none'} onValueChange={v => setForm((p: VendorFormData) => ({ ...p, subcontractorId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {subcontractors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-semibold">{t('licenseScore')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.licenseVerified} onChange={e => setForm((p: VendorFormData) => ({ ...p, licenseVerified: e.target.checked }))} className="rounded" />
              <Label className="text-xs">{t('licenseVerified')}</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">License Expiry</Label>
              <Input type="date" value={form.licenseExpiry} onChange={e => setForm((p: VendorFormData) => ({ ...p, licenseExpiry: e.target.value }))} />
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-semibold">{t('insuranceScore')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.insuranceVerified} onChange={e => setForm((p: VendorFormData) => ({ ...p, insuranceVerified: e.target.checked }))} className="rounded" />
              <Label className="text-xs">{t('insuranceVerified')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.coiOnFile} onChange={e => setForm((p: VendorFormData) => ({ ...p, coiOnFile: e.target.checked }))} className="rounded" />
              <Label className="text-xs">{t('coiOnFile')}</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Endorsement Status</Label>
              <Select value={form.endorsementStatus} onValueChange={v => setForm((p: VendorFormData) => ({ ...p, endorsementStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="deficient">Deficient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-semibold">{t('documentScore')}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('docsRequired')}</Label>
              <Input type="number" min={0} value={form.requiredDocs} onChange={e => setForm((p: VendorFormData) => ({ ...p, requiredDocs: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('docsSubmitted')}</Label>
              <Input type="number" min={0} value={form.submittedDocs} onChange={e => setForm((p: VendorFormData) => ({ ...p, submittedDocs: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expired Docs</Label>
              <Input type="number" min={0} value={form.expiredDocs} onChange={e => setForm((p: VendorFormData) => ({ ...p, expiredDocs: Number(e.target.value) }))} />
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-semibold">{t('experienceScore')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Total Projects</Label>
              <Input type="number" min={0} value={form.totalProjects} onChange={e => setForm((p: VendorFormData) => ({ ...p, totalProjects: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('projectsCompleted')}</Label>
              <Input type="number" min={0} value={form.completedProjects} onChange={e => setForm((p: VendorFormData) => ({ ...p, completedProjects: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('onTimeRate')} %</Label>
              <Input type="number" min={0} max={100} value={form.onTimeRate} onChange={e => setForm((p: VendorFormData) => ({ ...p, onTimeRate: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Avg Rating (0-5)</Label>
              <Input type="number" min={0} max={5} step={0.1} value={form.avgRating} onChange={e => setForm((p: VendorFormData) => ({ ...p, avgRating: Number(e.target.value) }))} />
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-semibold">{t('responsivenessScore')}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('avgResponseDays')}</Label>
              <Input type="number" min={0} step={0.1} value={form.avgResponseDays} onChange={e => setForm((p: VendorFormData) => ({ ...p, avgResponseDays: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Doc Requests</Label>
              <Input type="number" min={0} value={form.docRequestCount} onChange={e => setForm((p: VendorFormData) => ({ ...p, docRequestCount: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Doc Responses</Label>
              <Input type="number" min={0} value={form.docResponseCount} onChange={e => setForm((p: VendorFormData) => ({ ...p, docResponseCount: Number(e.target.value) }))} />
            </div>
          </div>

          <Separator />
          <div className="space-y-1">
            <Label className="text-xs">{t('notes')}</Label>
            <Textarea value={form.notes} onChange={e => setForm((p: VendorFormData) => ({ ...p, notes: e.target.value }))} placeholder={t('notesPlaceholder')} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!form.vendorName} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">{t('addVendor')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
