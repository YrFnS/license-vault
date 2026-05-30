'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Code2,
  Shield,
  Zap,
  Globe,
  Key,
  Send,
  Loader2,
  ChevronRight,
  Webhook,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// --- Animation variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// --- Method color map ---
const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  POST: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PUT: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

// --- Endpoint data ---
interface Endpoint {
  method: string;
  path: string;
  descriptionKey: string;
  params?: { name: string; descriptionKey: string; required?: boolean }[];
  sampleResponse: Record<string, unknown>;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/licenses',
    descriptionKey: 'licensesEndpoint',
    params: [
      { name: 'page', descriptionKey: 'paramPage' },
      { name: 'limit', descriptionKey: 'paramLimit' },
      { name: 'status', descriptionKey: 'paramStatus' },
    ],
    sampleResponse: {
      data: [
        { id: 'lic_abc123', name: 'California Electrical License', status: 'active', expirationDate: '2026-03-15' },
        { id: 'lic_def456', name: 'Nevada Plumbing License', status: 'expiring_soon', expirationDate: '2025-04-20' },
      ],
      pagination: { page: 1, limit: 20, total: 47 },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/licenses/{id}',
    descriptionKey: 'licenseDetailEndpoint',
    params: [
      { name: 'id', descriptionKey: 'paramId', required: true },
    ],
    sampleResponse: {
      id: 'lic_abc123',
      name: 'California Electrical License',
      type: 'State License',
      licenseNumber: 'EL-2024-12345',
      status: 'active',
      issuedBy: 'California State Licensing Board',
      issueDate: '2024-03-15',
      expirationDate: '2026-03-15',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/projects',
    descriptionKey: 'projectsEndpoint',
    params: [
      { name: 'page', descriptionKey: 'paramPage' },
      { name: 'limit', descriptionKey: 'paramLimit' },
    ],
    sampleResponse: {
      data: [
        { id: 'proj_001', name: 'Sunset Tower Renovation', status: 'active', complianceScore: 92 },
        { id: 'proj_002', name: 'Harbor Bridge Repair', status: 'pending', complianceScore: 78 },
      ],
      pagination: { page: 1, limit: 20, total: 12 },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/compliance',
    descriptionKey: 'complianceEndpoint',
    sampleResponse: {
      overallScore: 87,
      totalLicenses: 47,
      activeLicenses: 38,
      expiringLicenses: 5,
      expiredLicenses: 4,
      complianceRate: 0.81,
      lastUpdated: '2025-03-04T12:00:00Z',
    },
  },
];

// --- Webhook events ---
interface WebhookEvent {
  event: string;
  labelKey: string;
  descKey: string;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { event: 'license.created', labelKey: 'eventLicenseCreated', descKey: 'eventLicenseCreatedDesc' },
  { event: 'license.updated', labelKey: 'eventLicenseUpdated', descKey: 'eventLicenseUpdatedDesc' },
  { event: 'license.expired', labelKey: 'eventLicenseExpired', descKey: 'eventLicenseExpiredDesc' },
  { event: 'license.renewed', labelKey: 'eventLicenseRenewed', descKey: 'eventLicenseRenewedDesc' },
  { event: 'insurance.expired', labelKey: 'eventInsuranceExpired', descKey: 'eventInsuranceExpiredDesc' },
  { event: 'compliance.changed', labelKey: 'eventComplianceChanged', descKey: 'eventComplianceChangedDesc' },
];

export default function ApiDocsPage() {
  const t = useTranslations('apiDocs');
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [tryItResults, setTryItResults] = useState<Record<string, { status: number; body: string } | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const handleTryIt = async (endpoint: Endpoint) => {
    if (!apiKey.trim()) return;
    const key = `${endpoint.method} ${endpoint.path}`;
    setLoading((prev) => ({ ...prev, [key]: true }));
    setTryItResults((prev) => ({ ...prev, [key]: null }));

    try {
      const url = endpoint.path.replace('{id}', 'lic_abc123');
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const body = await res.text();
      setTryItResults((prev) => ({
        ...prev,
        [key]: { status: res.status, body },
      }));
    } catch {
      setTryItResults((prev) => ({
        ...prev,
        [key]: { status: 0, body: '{"error": "Network error"}' },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-sm">
            <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
          <Badge variant="outline" className="ms-auto bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-mono">
            {t('v1')}
          </Badge>
        </div>
      </motion.div>

      {/* ===== Tabs: Getting Started | Endpoints | Webhooks ===== */}
      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="getting-started" className="gap-1.5">
            <Zap className="size-3.5" />
            <span className="hidden sm:inline">{t('gettingStarted')}</span>
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="gap-1.5">
            <Code2 className="size-3.5" />
            <span>{t('endpoints')}</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5">
            <Webhook className="size-3.5" />
            <span>{t('webhooks')}</span>
          </TabsTrigger>
        </TabsList>

        {/* ========== GETTING STARTED ========== */}
        <TabsContent value="getting-started" className="mt-6">
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Base URL */}
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-lg">{t('baseUrl')}</CardTitle>
                  </div>
                  <CardDescription>{t('baseUrlDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-sm overflow-x-auto">
                      {process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://api.licensevault.app')}/api/v1
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopy(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://api.licensevault.app')}/api/v1`, 'baseurl')}
                    >
                      {copied === 'baseurl' ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Authentication */}
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-lg">{t('authentication')}</CardTitle>
                  </div>
                  <CardDescription>{t('authDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-slate-100">
                      <span className="text-slate-500">{'# '}{t('authentication')}</span>{'\n'}
                      <span className="text-teal-400">Authorization</span>{': '}
                      <span className="text-emerald-400">Bearer</span>{' '}
                      <span className="text-amber-300">lv_live_your_api_key_here</span>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rate Limits */}
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="size-5 text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-lg">{t('rateLimits')}</CardTitle>
                  </div>
                  <CardDescription>{t('rateLimitsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">100</p>
                      <p className="text-xs text-muted-foreground mt-1">Requests / min</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">429</p>
                      <p className="text-xs text-muted-foreground mt-1">Rate limit status</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">60s</p>
                      <p className="text-xs text-muted-foreground mt-1">Retry after</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ========== ENDPOINTS ========== */}
        <TabsContent value="endpoints" className="mt-6">
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <Accordion type="multiple" defaultValue={['endpoint-0']} className="space-y-3">
              {ENDPOINTS.map((endpoint, idx) => {
                const resultKey = `${endpoint.method} ${endpoint.path}`;
                const result = tryItResults[resultKey];
                const isLoading = loading[resultKey];

                return (
                  <motion.div key={endpoint.path} variants={staggerItem}>
                    <AccordionItem value={`endpoint-${idx}`} className="border rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-4 sm:px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0 text-start">
                          <Badge
                            variant="outline"
                            className={cn('font-mono text-xs px-2.5 py-0.5 shrink-0', METHOD_COLORS[endpoint.method])}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono truncate">
                            {endpoint.path}
                          </code>
                          <span className="text-xs text-muted-foreground ms-auto hidden sm:block truncate ps-2">
                            {t(endpoint.descriptionKey)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 sm:px-6 pb-6 space-y-5">
                        {/* Description */}
                        <p className="text-sm text-muted-foreground sm:hidden">
                          {t(endpoint.descriptionKey)}
                        </p>

                        {/* Parameters */}
                        {endpoint.params && endpoint.params.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                              <ChevronRight className="size-3.5 text-emerald-500" />
                              {t('queryParams')}
                            </h4>
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/30 border-b">
                                    <th className="px-3 py-2 text-start font-medium text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                                    <th className="px-3 py-2 text-start font-medium text-xs uppercase tracking-wider text-muted-foreground">Description</th>
                                    <th className="px-3 py-2 text-start font-medium text-xs uppercase tracking-wider text-muted-foreground">Required</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.params.map((param) => (
                                    <tr key={param.name} className="border-b last:border-0">
                                      <td className="px-3 py-2">
                                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{param.name}</code>
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground text-xs">{t(param.descriptionKey)}</td>
                                      <td className="px-3 py-2">
                                        {param.required ? (
                                          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-[10px] px-1.5">Required</Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">Optional</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Sample Response */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                              <ChevronRight className="size-3.5 text-teal-500" />
                              {t('sampleResponse')}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleCopy(JSON.stringify(endpoint.sampleResponse, null, 2), `sample-${idx}`)}
                            >
                              {copied === `sample-${idx}` ? (
                                <><Check className="size-3 text-emerald-600" /> Copied</>
                              ) : (
                                <><Copy className="size-3" /> Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm overflow-x-auto max-h-72">
                            <pre className="text-slate-100">
                              {JSON.stringify(endpoint.sampleResponse, null, 2)}
                            </pre>
                          </div>
                        </div>

                        <Separator />

                        {/* Try It */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <Send className="size-3.5 text-amber-500" />
                            {t('tryIt')}
                          </h4>
                          <p className="text-xs text-muted-foreground">{t('tryItDesc')}</p>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Key className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="lv_live_..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="ps-9 font-mono text-sm"
                              />
                            </div>
                            <Button
                              onClick={() => handleTryIt(endpoint)}
                              disabled={!apiKey.trim() || isLoading}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shrink-0"
                            >
                              {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Send className="size-4 me-1" />
                              )}
                              <span className="hidden sm:inline">{t('sendRequest')}</span>
                            </Button>
                          </div>

                          {result && (
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">{t('statusCode')}:</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'font-mono text-xs',
                                    result.status >= 200 && result.status < 300
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                      : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                  )}
                                >
                                  {result.status || 'Error'}
                                </Badge>
                              </div>
                              <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm overflow-x-auto max-h-48">
                                <pre className="text-slate-100">
                                  {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(result.body), null, 2);
                                    } catch {
                                      return result.body;
                                    }
                                  })()}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                );
              })}
            </Accordion>
          </motion.div>
        </TabsContent>

        {/* ========== WEBHOOKS ========== */}
        <TabsContent value="webhooks" className="mt-6">
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Webhook description */}
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-lg">{t('webhooks')}</CardTitle>
                  </div>
                  <CardDescription>{t('webhooksDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WEBHOOK_EVENTS.map((wh) => (
                      <div
                        key={wh.event}
                        className="p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800"
                          >
                            {wh.event}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{t(wh.labelKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(wh.descKey)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payload Format */}
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code2 className="size-5 text-teal-600 dark:text-teal-400" />
                    <CardTitle className="text-lg">{t('webhookPayload')}</CardTitle>
                  </div>
                  <CardDescription>{t('webhookPayloadDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-slate-100">
{`{
  "event": "license.expired",
  "timestamp": "2025-03-04T12:00:00Z",
  "data": {
    "id": "lic_abc123",
    "name": "California Electrical License",
    "status": "expired",
    "expirationDate": "2025-03-04"
  },
  "organization": {
    "id": "org_xyz789",
    "name": "Acme Construction"
  }
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ===== API Key Management Link ===== */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <Key className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('manageApiKeys')}</h3>
                  <p className="text-sm text-muted-foreground">{t('manageApiKeysDesc')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={() => router.push('/settings/api')}
              >
                {t('goToSettings')}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
