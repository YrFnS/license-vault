import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
} from 'lucide-react';
import type { InsuranceRecord } from './types';
import { parseEndorsementTypes } from './utils';

export function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
          <CheckCircle2 className="size-3 me-1" />
          {t('active')}
        </Badge>
      );
    case 'expiring_soon':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
          <AlertTriangle className="size-3 me-1" />
          {t('expiring')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100">
          <XCircle className="size-3 me-1" />
          {t('expired')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function getComplianceBadge(complianceStatus: string, t: (key: string) => string) {
  switch (complianceStatus) {
    case 'compliant':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
          <ShieldCheck className="size-3 me-1" />
          {t('compliant')}
        </Badge>
      );
    case 'deficient':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
          <ShieldAlert className="size-3 me-1" />
          {t('deficient')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100">
          <XCircle className="size-3 me-1" />
          {t('expired')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100">
          <Clock className="size-3 me-1" />
          {t('pending')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{complianceStatus}</Badge>;
  }
}

export function getTypeBadge(type: string, t: (key: string) => string) {
  switch (type) {
    case 'insurance':
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800">
          <Shield className="size-3 me-1" />
          {t('types.insurance')}
        </Badge>
      );
    case 'bond':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          <FileText className="size-3 me-1" />
          {t('types.bond')}
        </Badge>
      );
    case 'certificate':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
          <CheckCircle2 className="size-3 me-1" />
          {t('types.certificate')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

export function getEndorsementBadges(record: InsuranceRecord, t: (key: string) => string) {
  const endorsements = parseEndorsementTypes(record.endorsementTypes);
  const badges: React.ReactNode[] = [];

  if (record.additionalInsured) {
    badges.push(
      <Badge key="ai" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-xs px-1.5 py-0">
        AI
      </Badge>
    );
  }
  if (record.primaryNoncontrib) {
    badges.push(
      <Badge key="pnc" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs px-1.5 py-0">
        PNC
      </Badge>
    );
  }
  if (record.waiverSubrogation) {
    badges.push(
      <Badge key="wos" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs px-1.5 py-0">
        WoS
      </Badge>
    );
  }

  endorsements.forEach((et) => {
    if (et.startsWith('CG_')) {
      badges.push(
        <Badge key={et} variant="outline" className="text-xs px-1.5 py-0">
          {et.replace(/_/g, ' ')}
        </Badge>
      );
    }
  });

  if (badges.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}
