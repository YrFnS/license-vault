'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { RefreshCw, Upload, GraduationCap, Send } from 'lucide-react';
import { toast } from 'sonner';
import { itemVariants } from './constants';

export default function QuickActions() {
  const t = useTranslations('compliance');

  const actions = [
    {
      key: 'renew',
      label: t('renewLicenses'),
      icon: RefreshCw,
      href: '/licenses',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'upload',
      label: t('uploadDocuments'),
      icon: Upload,
      href: '/licenses',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
      key: 'ce',
      label: t('updateCeHours'),
      icon: GraduationCap,
      href: '/ce-tracking',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      key: 'report',
      label: t('sendReport'),
      icon: Send,
      href: '#',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-200 dark:border-rose-800',
    },
  ];

  const handleSendReport = () => {
    toast.success(t('reportSent'));
  };

  return (
    <motion.div variants={itemVariants}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t('quickActionsTitle')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isReport = action.key === 'report';
          return (
            <motion.div key={action.key} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
              {isReport ? (
                <button
                  onClick={handleSendReport}
                  className="group flex flex-col items-center gap-2 rounded-xl border py-5 px-4 transition-all duration-200 hover:shadow-lg bg-card shadow-sm w-full"
                >
                  <div className={`rounded-full p-2.5 ${action.bgColor} ${action.borderColor} border transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`size-5 ${action.color} transition-transform duration-200 group-hover:-rotate-3`} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {action.label}
                  </span>
                </button>
              ) : (
                <Link
                  href={action.href}
                  className="group flex flex-col items-center gap-2 rounded-xl border py-5 px-4 transition-all duration-200 hover:shadow-lg bg-card shadow-sm"
                >
                  <div className={`rounded-full p-2.5 ${action.bgColor} ${action.borderColor} border transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`size-5 ${action.color} transition-transform duration-200 group-hover:-rotate-3`} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {action.label}
                  </span>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
