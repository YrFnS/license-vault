'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Upload,
  FileText,
  Shield,
  ShieldHalf,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  ScanSearch,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

interface COIExtraction {
  insuredName: string | null;
  policyNumber: string | null;
  insuranceProvider: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  coverageAmount: number | null;
  perOccurrenceLimit: number | null;
  aggregateLimit: number | null;
  additionalInsured: boolean;
  primaryNoncontributory: boolean;
  waiverOfSubrogation: boolean;
  endorsementTypes: string[];
  holderName: string | null;
  confidence: number;
}

interface LicenseExtraction {
  licenseNumber: string | null;
  licenseType: string | null;
  licenseeName: string | null;
  state: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  issuingBoard: string | null;
  restrictions: string | null;
  confidence: number;
}

interface BondExtraction {
  bondNumber: string | null;
  bondType: string | null;
  principalName: string | null;
  obligeeName: string | null;
  suretyCompany: string | null;
  bondAmount: number | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  confidence: number;
}

interface ScanResult {
  id: string;
  documentType: 'coi' | 'license' | 'bond' | 'unknown';
  coi?: COIExtraction;
  license?: LicenseExtraction;
  bond?: BondExtraction;
  rawText: string;
  confidence: number;
  createdAt: string;
}

interface ScanHistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  extractedData: {
    coi?: COIExtraction;
    license?: LicenseExtraction;
    bond?: BondExtraction;
  };
  rawText: string | null;
  confidence: number;
  status: string;
  createdAt: string;
}

interface DocumentScannerProps {
  scanHistory?: ScanHistoryItem[];
}

// ─── Confidence Color Helper ────────────────────────────────────────────────

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (confidence >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return 'bg-emerald-100 dark:bg-emerald-900/40';
  if (confidence >= 50) return 'bg-amber-100 dark:bg-amber-900/40';
  return 'bg-red-100 dark:bg-red-900/40';
}

function getConfidenceLabel(confidence: number, t: (key: string) => string): string {
  if (confidence >= 80) return t('highConfidence');
  if (confidence >= 50) return t('mediumConfidence');
  return t('lowConfidence');
}

// ─── Document Type Icon ─────────────────────────────────────────────────────

function DocTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'coi':
      return <ShieldHalf className="size-5 text-emerald-600 dark:text-emerald-400" />;
    case 'license':
      return <GraduationCap className="size-5 text-teal-600 dark:text-teal-400" />;
    case 'bond':
      return <Shield className="size-5 text-amber-600 dark:text-amber-400" />;
    default:
      return <FileText className="size-5 text-muted-foreground" />;
  }
}

// ─── Format Date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Format Currency ────────────────────────────────────────────────────────

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Field Row ──────────────────────────────────────────────────────────────

function FieldRow({ label, value, isBoolean }: { label: string; value: string | boolean | null; isBoolean?: boolean }) {
  if (isBoolean) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        {value ? (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
            <CheckCircle2 className="size-3 me-1" />
            Yes
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">No</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-end truncate">{value || '—'}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DocumentScanner({ scanHistory = [] }: DocumentScannerProps) {
  const t = useTranslations('documentScanner');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('auto');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('unsupportedFileType'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }
    setSelectedFile(file);
    setScanResult(null);
    setScanError(null);
  }, [t]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Handle scan
  const handleScan = useCallback(async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setScanError(null);
    setScanProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);

      const response = await fetch('/api/documents/scan', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      const data = await response.json();
      setScanResult(data);
      toast.success(t('scanComplete'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('scanFailed');
      setScanError(message);
      toast.error(message);
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [selectedFile, documentType, t]);

  // Copy extracted data
  const handleCopyData = useCallback(() => {
    if (!scanResult) return;
    const data = {
      documentType: scanResult.documentType,
      confidence: scanResult.confidence,
      coi: scanResult.coi,
      license: scanResult.license,
      bond: scanResult.bond,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success(t('copiedToClipboard'));
  }, [scanResult, t]);

  // Reset scanner
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setScanResult(null);
    setScanError(null);
    setDocumentType('auto');
    setShowRawText(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden shadow-sm">
            {/* Document Type Selector */}
            <div className="p-4 border-b bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
              <div className="flex items-center gap-3">
                <ScanSearch className="size-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{t('documentType')}</span>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="w-[180px] ms-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <span className="flex items-center gap-2">
                        <Sparkles className="size-3.5" />
                        {t('autoDetect')}
                      </span>
                    </SelectItem>
                    <SelectItem value="coi">
                      <span className="flex items-center gap-2">
                        <ShieldHalf className="size-3.5" />
                        {t('coi')}
                      </span>
                    </SelectItem>
                    <SelectItem value="license">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="size-3.5" />
                        {t('license')}
                      </span>
                    </SelectItem>
                    <SelectItem value="bond">
                      <span className="flex items-center gap-2">
                        <Shield className="size-3.5" />
                        {t('bond')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={cn(
                'relative p-8 transition-all duration-300 cursor-pointer',
                isDragOver
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-400 dark:border-emerald-600'
                  : 'hover:bg-muted/30',
                selectedFile && 'pb-4'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {!selectedFile ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className={cn(
                    'rounded-2xl p-4 transition-colors duration-300',
                    isDragOver
                      ? 'bg-emerald-100 dark:bg-emerald-900/50'
                      : 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30'
                  )}>
                    <Camera className={cn(
                      'size-10 transition-colors',
                      isDragOver
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-emerald-500 dark:text-emerald-400'
                    )} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{t('uploadArea')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('uploadHint')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <Upload className="size-4" />
                    {t('browseFiles')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 p-3">
                    <FileText className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Scan Button */}
            {selectedFile && (
              <div className="p-4 border-t bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
                {isScanning ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {t('scanning')}
                      </span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleScan}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm gap-2"
                    >
                      <ScanSearch className="size-4" />
                      {t('scanDocument')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="shrink-0"
                    >
                      {t('clear')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{t('scanFailed')}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{scanError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30"
                  onClick={() => setScanError(null)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Results */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Result Header */}
            <Card className="overflow-hidden shadow-sm">
              <div className="p-4 bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-xl p-2.5', getConfidenceBg(scanResult.confidence))}>
                      <DocTypeIcon type={scanResult.documentType} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {t(scanResult.documentType === 'unknown' ? 'unknown' : scanResult.documentType)}
                        </h3>
                        <Badge className={cn(
                          'text-xs font-medium',
                          scanResult.confidence >= 80
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : scanResult.confidence >= 50
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800'
                        )}>
                          {getConfidenceLabel(scanResult.confidence, t)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('confidence')}: {scanResult.confidence}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyData}
                      className="gap-1.5"
                    >
                      <Copy className="size-3.5" />
                      {t('copyData')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="gap-1.5"
                    >
                      {t('scanAnother')}
                    </Button>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        scanResult.confidence >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : scanResult.confidence >= 50
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${scanResult.confidence}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Extracted Fields */}
            {scanResult.coi && (
              <Card className="shadow-sm">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldHalf className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-semibold text-sm">{t('coiDetails')}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <FieldRow label={t('insuredName')} value={scanResult.coi.insuredName} />
                    <FieldRow label={t('policyNumber')} value={scanResult.coi.policyNumber} />
                    <FieldRow label={t('insuranceProvider')} value={scanResult.coi.insuranceProvider} />
                    <FieldRow label={t('holderName')} value={scanResult.coi.holderName} />
                    <FieldRow label={t('effectiveDate')} value={formatDate(scanResult.coi.effectiveDate, locale)} />
                    <FieldRow label={t('expirationDate')} value={formatDate(scanResult.coi.expirationDate, locale)} />
                    <FieldRow label={t('coverageAmount')} value={formatCurrency(scanResult.coi.coverageAmount)} />
                    <FieldRow label={t('perOccurrenceLimit')} value={formatCurrency(scanResult.coi.perOccurrenceLimit)} />
                    <FieldRow label={t('aggregateLimit')} value={formatCurrency(scanResult.coi.aggregateLimit)} />
                    <FieldRow label={t('additionalInsured')} value={scanResult.coi.additionalInsured} isBoolean />
                    <FieldRow label={t('primaryNoncontributory')} value={scanResult.coi.primaryNoncontributory} isBoolean />
                    <FieldRow label={t('waiverOfSubrogation')} value={scanResult.coi.waiverOfSubrogation} isBoolean />
                  </div>
                  {scanResult.coi.endorsementTypes.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">{t('endorsementTypes')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.coi.endorsementTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {scanResult.license && (
              <Card className="shadow-sm">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="size-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="font-semibold text-sm">{t('licenseDetails')}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <FieldRow label={t('licenseeName')} value={scanResult.license.licenseeName} />
                    <FieldRow label={t('licenseNumber')} value={scanResult.license.licenseNumber} />
                    <FieldRow label={t('licenseTypeField')} value={scanResult.license.licenseType} />
                    <FieldRow label={t('state')} value={scanResult.license.state} />
                    <FieldRow label={t('issueDate')} value={formatDate(scanResult.license.issueDate, locale)} />
                    <FieldRow label={t('expirationDate')} value={formatDate(scanResult.license.expirationDate, locale)} />
                    <FieldRow label={t('issuingBoard')} value={scanResult.license.issuingBoard} />
                    <FieldRow label={t('restrictions')} value={scanResult.license.restrictions} />
                  </div>
                </div>
              </Card>
            )}

            {scanResult.bond && (
              <Card className="shadow-sm">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="size-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-semibold text-sm">{t('bondDetails')}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <FieldRow label={t('bondNumber')} value={scanResult.bond.bondNumber} />
                    <FieldRow label={t('bondType')} value={scanResult.bond.bondType} />
                    <FieldRow label={t('principalName')} value={scanResult.bond.principalName} />
                    <FieldRow label={t('obligeeName')} value={scanResult.bond.obligeeName} />
                    <FieldRow label={t('suretyCompany')} value={scanResult.bond.suretyCompany} />
                    <FieldRow label={t('bondAmount')} value={formatCurrency(scanResult.bond.bondAmount)} />
                    <FieldRow label={t('effectiveDate')} value={formatDate(scanResult.bond.effectiveDate, locale)} />
                    <FieldRow label={t('expirationDate')} value={formatDate(scanResult.bond.expirationDate, locale)} />
                  </div>
                </div>
              </Card>
            )}

            {scanResult.documentType === 'unknown' && (
              <Card className="shadow-sm">
                <div className="p-6 text-center">
                  <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('unknownDocumentType')}</p>
                </div>
              </Card>
            )}

            {/* Raw Text Expandable */}
            {scanResult.rawText && (
              <Card className="shadow-sm overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => setShowRawText(!showRawText)}
                >
                  <span className="text-sm font-medium">{t('rawText')}</span>
                  {showRawText ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {showRawText && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4">
                        <ScrollArea className="max-h-64">
                          <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                            {scanResult.rawText}
                          </pre>
                        </ScrollArea>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan History */}
      {scanHistory.length > 0 && !scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="shadow-sm">
            <div className="p-4 border-b bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm">{t('scanHistory')}</h3>
                <Badge variant="secondary" className="text-xs ms-auto">
                  {scanHistory.length}
                </Badge>
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="divide-y">
                {scanHistory.map((item) => (
                  <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <DocTypeIcon type={item.documentType} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt, locale)} • {t('confidence')}: {item.confidence}%
                        </p>
                      </div>
                      <Badge className={cn('text-xs', getConfidenceBg(item.confidence), getConfidenceColor(item.confidence), 'border-0')}>
                        {t(item.documentType === 'unknown' ? 'unknown' : item.documentType)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Quick Tips Component ───────────────────────────────────────────────────

export function ScanTips() {
  const t = useTranslations('documentScanner');

  const tips = [
    { key: 'tip1', icon: Camera },
    { key: 'tip2', icon: FileText },
    { key: 'tip3', icon: Shield },
    { key: 'tip4', icon: Sparkles },
  ] as const;

  return (
    <Card className="shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-sm">{t('tips')}</h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.key} className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-1.5 mt-0.5">
                <Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(tip.key)}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
