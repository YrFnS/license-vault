'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Link2, Unlink } from 'lucide-react';
import { StatusBadge, CEProgressBar, DetailLoadingSkeleton } from './QualifierBadges';
import type { Qualifier } from './types';

interface QualifiersDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailQualifier: Qualifier | null;
  detailLoading: boolean;
  canManage: boolean;
  onLinkLicense: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUnlinkLicense: (qualifierId: string, licenseId: string) => void;
}

export function QualifiersDetailDialog({
  open,
  onOpenChange,
  detailQualifier,
  detailLoading,
  canManage,
  onLinkLicense,
  onEdit,
  onDelete,
  onUnlinkLicense,
}: QualifiersDetailDialogProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('qualifierDetails')}</DialogTitle>
        </DialogHeader>

        {detailLoading ? (
          <DetailLoadingSkeleton />
        ) : detailQualifier ? (
          <div className="space-y-4 py-2">
            {/* Name & Status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {detailQualifier.firstName} {detailQualifier.lastName}
                </h3>
                {detailQualifier.email && (
                  <p className="text-sm text-muted-foreground">{detailQualifier.email}</p>
                )}
              </div>
              <StatusBadge status={detailQualifier.computedStatus} />
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {detailQualifier.phone && (
                <div>
                  <span className="text-muted-foreground">{t('phone')}:</span>{' '}
                  <span className="font-medium">{detailQualifier.phone}</span>
                </div>
              )}
              {detailQualifier.licenseNumber && (
                <div>
                  <span className="text-muted-foreground">{t('licenseNumber')}:</span>{' '}
                  <span className="font-medium">{detailQualifier.licenseNumber}</span>
                </div>
              )}
              {detailQualifier.licenseState && (
                <div>
                  <span className="text-muted-foreground">{t('licenseState')}:</span>{' '}
                  <span className="font-medium">{detailQualifier.licenseState}</span>
                </div>
              )}
              {detailQualifier.licenseType && (
                <div>
                  <span className="text-muted-foreground">{t('licenseType')}:</span>{' '}
                  <span className="font-medium">{detailQualifier.licenseType}</span>
                </div>
              )}
              {detailQualifier.licenseExpiry && (
                <div>
                  <span className="text-muted-foreground">{t('licenseExpiry')}:</span>{' '}
                  <span className="font-medium">{new Date(detailQualifier.licenseExpiry).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* CE Progress */}
            {detailQualifier.ceHoursRequired > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('ceProgress')}</Label>
                <CEProgressBar earned={detailQualifier.ceHoursEarned} required={detailQualifier.ceHoursRequired} />
              </div>
            )}

            {/* Notes */}
            {detailQualifier.notes && (
              <div>
                <Label className="text-sm font-medium">{t('notes')}</Label>
                <p className="text-sm text-muted-foreground mt-1">{detailQualifier.notes}</p>
              </div>
            )}

            <Separator />

            {/* Linked Licenses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">{t('linkedLicenses')}</Label>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLinkLicense}
                  >
                    <Link2 className="size-4 me-1" />
                    {t('linkLicense')}
                  </Button>
                )}
              </div>

              {detailQualifier.licenseLinks && detailQualifier.licenseLinks.length > 0 ? (
                <div className="space-y-2">
                  {detailQualifier.licenseLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{link.license.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{link.license.type}</span>
                          <span>•</span>
                          <span>{link.license.licenseNumber}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {link.role}
                          </Badge>
                        </div>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => onUnlinkLicense(detailQualifier.id, link.licenseId)}
                        >
                          <Unlink className="size-3.5" />
                          <span className="sr-only">{t('unlinkLicense')}</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No linked licenses
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    <Pencil className="size-4 me-1" />
                    {tc('edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                  >
                    <Trash2 className="size-4 me-1" />
                    {tc('delete')}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
