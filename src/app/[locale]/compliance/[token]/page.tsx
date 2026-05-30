'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Building2, Wrench, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ComplianceData {
  organization: {
    name: string;
    tradeType: string;
  };
  complianceRate: number;
  licenses: {
    name: string;
    type: string;
    status: 'active' | 'expiring' | 'expired';
    expirationDate: string;
  }[];
}

interface CompliancePageProps {
  params: Promise<{ token: string }>;
}

export default function CompliancePortalPage({ params }: CompliancePageProps) {
  const t = useTranslations('compliance');
  const tCommon = useTranslations('common');

  const [data, setData] = useState<ComplianceData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
    });
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/compliance/${token}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <Shield className="size-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="size-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="size-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">{t('notFound')}</h1>
            <p className="text-muted-foreground">{t('invalidLink')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCount = data.licenses.filter((l) => l.status === 'active').length;
  const expiringCount = data.licenses.filter((l) => l.status === 'expiring').length;
  const expiredCount = data.licenses.filter((l) => l.status === 'expired').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case 'expiring': return <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />;
      case 'expired': return <ShieldX className="size-4 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: 'active' | 'expiring' | 'expired') => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1">
            <CheckCircle2 className="size-3" />
            Active
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1">
            <AlertTriangle className="size-3" />
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
            <XCircle className="size-3" />
            Expired
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-emerald-600">
            <Shield className="size-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">{tCommon('appName')}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Organization Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
                <Building2 className="size-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1">{data.organization.name}</h1>
                <div className="flex items-center gap-2 text-emerald-100">
                  <Wrench className="size-4" />
                  <span className="text-sm">{data.organization.tradeType}</span>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Compliance Rate */}
              <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.complianceRate}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t('rate')}</p>
              </div>
              {/* Active */}
              <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('activeLicenses')}</p>
              </div>
              {/* At Risk */}
              <div className="flex flex-col items-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{expiringCount + expiredCount}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('complianceStatus')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licenses List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold">{t('activeLicenses')}</h2>
              <Badge variant="outline" className="ms-auto">
                {data.licenses.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.licenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noActiveLicenses')}</p>
            ) : (
              <div className="space-y-3">
                {data.licenses.map((license, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-3 py-3">
                      {getStatusIcon(license.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{license.name}</p>
                        <p className="text-sm text-muted-foreground">{license.type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {getStatusBadge(license.status)}
                        <p className="text-xs text-muted-foreground">
                          {t('expires')}: {formatDate(license.expirationDate)}
                        </p>
                      </div>
                    </div>
                    {idx < data.licenses.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4 text-emerald-600" />
            <span>{t('verifiedBy')} {tCommon('appName')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
            >
              <ShieldCheck className="size-3" />
              Verified
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
