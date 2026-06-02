'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, UserCheck, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, CEProgressBar } from './QualifierBadges';
import { staggerContainer, staggerItem } from './constants';
import type { Qualifier } from './types';

interface QualifiersMobileCardsProps {
  qualifiers: Qualifier[];
  canManage: boolean;
  onView: (q: Qualifier) => void;
  onEdit: (q: Qualifier) => void;
  onDelete: (q: Qualifier) => void;
}

export function QualifiersMobileCards({ qualifiers, canManage, onView, onEdit, onDelete }: QualifiersMobileCardsProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="md:hidden space-y-3"
    >
      {qualifiers.map((q) => (
        <motion.div key={q.id} variants={staggerItem} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-2">
                      <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className={cn(
                      'absolute -bottom-0.5 -end-0.5 size-3 rounded-full ring-2 ring-background',
                      q.computedStatus === 'active' ? 'bg-emerald-500' :
                      q.computedStatus === 'expiring' ? 'bg-amber-500' :
                      q.computedStatus === 'expired' ? 'bg-red-500' :
                      q.computedStatus === 'ce_deficient' ? 'bg-orange-500' : 'bg-slate-400'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{q.firstName} {q.lastName}</p>
                    {q.email && (
                      <p className="text-xs text-muted-foreground truncate">{q.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {q.linkedLicensesCount > 0 && (
                    <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                      <Link2 className="size-3 me-0.5" />
                      {q.linkedLicensesCount}
                    </Badge>
                  )}
                  <StatusBadge status={q.computedStatus} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {q.licenseNumber && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseNumber')}:</span>{' '}
                    <span className="font-medium">{q.licenseNumber}</span>
                  </div>
                )}
                {q.licenseState && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseState')}:</span>{' '}
                    <span className="font-medium">{q.licenseState}</span>
                  </div>
                )}
                {q.licenseExpiry && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseExpiry')}:</span>{' '}
                    <span className="font-medium">{new Date(q.licenseExpiry).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {q.ceHoursRequired > 0 && (
                <div className="mt-3">
                  <CEProgressBar earned={q.ceHoursEarned} required={q.ceHoursRequired} />
                </div>
              )}

              <div className="mt-3 flex items-center justify-end gap-1 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => onView(q)}
                >
                  <Eye className="size-4 me-1" />
                  {tc('viewDetails')}
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => onEdit(q)}
                    >
                      <Pencil className="size-4 me-1" />
                      {tc('edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => onDelete(q)}
                    >
                      <Trash2 className="size-4 me-1" />
                      {tc('delete')}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
