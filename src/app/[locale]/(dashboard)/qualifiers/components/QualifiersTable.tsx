'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { StatusBadge, CEProgressBar } from './QualifierBadges';
import { fadeIn, staggerItem } from './constants';
import type { Qualifier } from './types';

interface QualifiersTableProps {
  qualifiers: Qualifier[];
  canManage: boolean;
  onView: (q: Qualifier) => void;
  onEdit: (q: Qualifier) => void;
  onDelete: (q: Qualifier) => void;
}

export function QualifiersTable({ qualifiers, canManage, onView, onEdit, onDelete }: QualifiersTableProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <motion.div {...fadeIn} className="hidden md:block">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start p-3 font-medium text-muted-foreground">{tc('name')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseNumber')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseState')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseExpiry')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('ceProgress')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('status')}</th>
                  <th className="text-end p-3 font-medium text-muted-foreground">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {qualifiers.map((q) => (
                    <motion.tr
                      key={q.id}
                      variants={staggerItem}
                      initial="initial"
                      animate="animate"
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{q.firstName} {q.lastName}</p>
                          {q.email && (
                            <p className="text-xs text-muted-foreground">{q.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{q.licenseNumber || '—'}</td>
                      <td className="p-3 text-muted-foreground">{q.licenseState || '—'}</td>
                      <td className="p-3 text-muted-foreground">
                        {q.licenseExpiry
                          ? new Date(q.licenseExpiry).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-3" style={{ minWidth: 150 }}>
                        {q.ceHoursRequired > 0 ? (
                          <CEProgressBar earned={q.ceHoursEarned} required={q.ceHoursRequired} />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={q.computedStatus} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                            onClick={() => onView(q)}
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">{tc('viewDetails')}</span>
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                                onClick={() => onEdit(q)}
                              >
                                <Pencil className="size-4" />
                                <span className="sr-only">{tc('edit')}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                onClick={() => onDelete(q)}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">{tc('delete')}</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
