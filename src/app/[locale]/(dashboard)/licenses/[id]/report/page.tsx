'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Calendar,
  Building2,
  Hash,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  CheckCircle2,
  User,
  Loader2,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface LicenseData {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  notes: string | null;
  isRenewed: boolean;
  renewalDate: string | null;
  autoRenew: boolean;
  renewalHistory: string | null;
  status: string;
  daysUntilExpiration: number | null;
}

interface OrgData {
  name: string;
  tradeType: string;
  primaryState: string;
}

export default function LicenseReportPage() {
  const t = useTranslations('licenseReport');
  const tL = useTranslations('licenses');
  const tC = useTranslations('common');
  const params = useParams();
  const id = params.id as string;

  const [license, setLicense] = useState<LicenseData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchLicense = useCallback(async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch license');
      const data = await res.json();
      setLicense(data.license || null);
    } catch {
      // silently fail
    }
  }, [id]);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setOrg({
          name: data.organization?.name || 'Unknown Organization',
          tradeType: data.organization?.tradeType || '',
          primaryState: data.organization?.primaryState || '',
        });
      } else {
        setOrg({ name: 'Unknown Organization', tradeType: '', primaryState: '' });
      }
    } catch {
      setOrg({ name: 'Unknown Organization', tradeType: '', primaryState: '' });
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLicense(), fetchOrg()]).finally(() => {
      setLoading(false);
    });
  }, [fetchLicense, fetchOrg]);

  const generatedDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'expiring_soon': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      case 'expired': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ShieldCheck className="size-5" />;
      case 'expiring_soon': return <ShieldAlert className="size-5" />;
      case 'expired': return <ShieldX className="size-5" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return tL('status.active');
      case 'expiring_soon': return tL('status.expiringSoon');
      case 'expired': return tL('status.expired');
      default: return status || 'Unknown';
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/licenses/${id}/report`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${license?.licenseNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Could add toast here
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renewalHistoryEntries = useMemo(() => {
    if (!license?.renewalHistory) return [];
    try {
      const parsed = JSON.parse(license.renewalHistory);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [license?.renewalHistory]);

  const daysUntilExpiration = useMemo(() => {
    if (!license?.expirationDate) return null;
    try {
      const now = new Date();
      const exp = new Date(license.expirationDate);
      return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [license?.expirationDate]);

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load license report</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/licenses/${id}`}>
              <ArrowLeft className="size-4 me-2" />
              {t('backToLicense')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Ensure org always has a value for rendering
  const safeOrg = org || { name: 'Unknown Organization', tradeType: '', primaryState: '' };

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="print:hidden p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/licenses/${id}`}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="size-4" />
              {t('printReport')}
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {downloadingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloadingPdf ? (t('generatingPdf') || 'Generating...') : (t('downloadPdf') || 'Download PDF')}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content - single render, print-optimized */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 print:bg-white print:text-black print:shadow-none print:border-none p-6 print:p-0 print:m-0">
        {/* Organization Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-6 print:mb-6" style={{ breakInside: 'avoid' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Logo placeholder */}
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <ShieldCheck className="size-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                    {safeOrg.name}
                  </h2>
                  {(safeOrg.tradeType || safeOrg.primaryState) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500">
                      {safeOrg.tradeType}{safeOrg.tradeType && safeOrg.primaryState ? ' • ' : ''}{safeOrg.primaryState}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500 uppercase tracking-wider font-semibold">{t('title')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-400 mt-1">
                {t('generatedOn', { date: generatedDate })}
              </p>
            </div>
          </div>
        </div>

        {/* License Details Section */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-700 mb-4 flex items-center gap-2">
            <FileText className="size-4 print:hidden" />
            {t('licenseDetails')}
          </h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <ReportRow label={tL('form.name')} value={license.name || 'N/A'} />
              <ReportRow label={tL('form.type')} value={license.type || 'N/A'} />
              <ReportRow label={tL('form.licenseNumber')} value={license.licenseNumber || 'N/A'} mono />
              <ReportRow label={tL('form.issuedBy')} value={license.issuedBy || 'N/A'} />
              <ReportRow label={tL('form.issueDate')} value={formatDate(license.issueDate)} />
              <ReportRow
                label={tL('form.expirationDate')}
                value={formatDate(license.expirationDate)}
                highlight={license.status === 'expired' ? 'text-red-700 dark:text-red-400 print:text-red-700 font-semibold' : license.status === 'expiring_soon' ? 'text-amber-700 dark:text-amber-400 print:text-amber-700 font-semibold' : undefined}
              />
              {license.notes && (
                <ReportRow label={tL('form.notes')} value={license.notes} />
              )}
            </tbody>
          </table>
        </section>

        {/* Compliance Status Section */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-700 mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 print:hidden" />
            {t('statusSection')}
          </h3>
          <div className="border dark:border-slate-700 print:border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(license.status || 'unknown')}`}>
                {getStatusIcon(license.status || 'unknown')}
                <span className="font-semibold text-sm">{getStatusText(license.status)}</span>
              </div>
              {license.isRenewed && (
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 gap-1">
                  <CheckCircle2 className="size-3" />
                  {tL('detail.renewed')}
                </Badge>
              )}
            </div>
            {daysUntilExpiration !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600 flex items-center gap-1.5">
                <Clock className="size-4 text-gray-400 dark:text-gray-500 print:text-gray-400 print:hidden" />
                {daysUntilExpiration < 0
                  ? `${Math.abs(daysUntilExpiration)} days overdue`
                  : `${daysUntilExpiration} days until expiration`}
              </p>
            )}
            {daysUntilExpiration === null && (
              <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-500">
                Expiration date information not available
              </p>
            )}
          </div>
        </section>

        {/* Compliance Summary */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-700 mb-4 flex items-center gap-2">
            <FileText className="size-4 print:hidden" />
            {t('complianceSummary')}
          </h3>
          <div className="border dark:border-slate-700 print:border-gray-300 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">License Name</span>
              <span className="font-medium">{license.name || 'N/A'}</span>
            </div>
            <Separator className="print:border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Compliance Status</span>
              <span className={`font-medium ${
                license.status === 'active' ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' :
                license.status === 'expiring_soon' ? 'text-amber-700 dark:text-amber-400 print:text-amber-700' :
                'text-red-700 dark:text-red-400 print:text-red-700'
              }`}>{getStatusText(license.status)}</span>
            </div>
            <Separator className="print:border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Renewal Status</span>
              <span className="font-medium">{license.isRenewed ? tL('detail.renewed') : tL('detail.notRenewed')}</span>
            </div>
            <Separator className="print:border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Auto-Renew</span>
              <span className="font-medium">{license.autoRenew ? 'Enabled' : 'Disabled'}</span>
            </div>
            <Separator className="print:border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">License Type</span>
              <span className="font-medium">{license.type || 'N/A'}</span>
            </div>
            <Separator className="print:border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Issuing Authority</span>
              <span className="font-medium">{license.issuedBy || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Organization Information - always renders with fallback */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-700 mb-4 flex items-center gap-2">
            <Building2 className="size-4 print:hidden" />
            {t('organizationInfo')}
          </h3>
          <div className="border dark:border-slate-700 print:border-gray-300 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Organization</span>
              <span className="font-medium">{safeOrg.name}</span>
            </div>
            {safeOrg.tradeType && (
              <>
                <Separator className="print:border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Trade Type</span>
                  <span className="font-medium">{safeOrg.tradeType}</span>
                </div>
              </>
            )}
            {safeOrg.primaryState && (
              <>
                <Separator className="print:border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">Primary State</span>
                  <span className="font-medium">{safeOrg.primaryState}</span>
                </div>
              </>
            )}
            {!safeOrg.tradeType && !safeOrg.primaryState && (
              <>
                <Separator className="print:border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-500 print:text-gray-500 italic">No additional organization details configured</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Renewal History Section */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-700 mb-4 flex items-center gap-2">
            <Clock className="size-4 print:hidden" />
            {t('renewalHistorySection')}
          </h3>
          {renewalHistoryEntries.length > 0 ? (
            <div className="border dark:border-slate-700 print:border-gray-300 rounded-lg p-4 space-y-3">
              {renewalHistoryEntries.map((entry, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-3 print:border-gray-200" />}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex flex-col items-center shrink-0">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 print:text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatDate(entry.date)}
                      </p>
                      {entry.renewedBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="size-3 print:hidden" />
                          {entry.renewedBy}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border dark:border-slate-700 print:border-gray-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 print:text-gray-400">{t('noRenewalHistory')}</p>
            </div>
          )}
        </section>

        {/* QR Code Placeholder */}
        <section className="mb-8 print:mb-8" style={{ breakInside: 'avoid' }}>
          <div className="flex items-start gap-4">
            <div className="size-24 border-2 border-dashed border-gray-300 dark:border-gray-600 print:border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 print:bg-gray-50 shrink-0">
              <div className="text-center">
                <Hash className="size-6 text-gray-300 dark:text-gray-500 print:text-gray-300 mx-auto" />
                <p className="text-[8px] text-gray-400 dark:text-gray-500 print:text-gray-400 mt-1 leading-tight">QR Code</p>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 print:text-gray-600">{t('scanToVerify')}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-400 mt-1">License ID: {license.id}</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 print:border-gray-200 pt-4 mt-8 print:mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <ShieldCheck className="size-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 print:text-gray-500">{t('poweredBy')}</span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-400">
              {t('generatedOn', { date: generatedDate })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportRow({
  label,
  value,
  mono = false,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: string;
}) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 print:border-gray-100 last:border-0">
      <td className="py-2.5 pe-4 text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm w-1/3 align-top">{label}</td>
      <td className={`py-2.5 text-sm ${mono ? 'font-mono' : ''} ${highlight || 'text-gray-900 dark:text-gray-100 print:text-gray-900'}`}>{value}</td>
    </tr>
  );
}
